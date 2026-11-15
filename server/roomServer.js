import { WebSocketServer } from "ws";
import { randomBytes, randomInt } from "node:crypto";
import { createShadowState, ROLES } from "../src/lib/game/mission.js";
import { validateComposition } from "../src/lib/game/missionConfig.js";
import { updateGame } from "../src/lib/game/gameLoop.js";
const KEYS = ["up", "down", "left", "right", "interact", "ability"];
const EMPTY = Object.fromEntries(KEYS.map((k) => [k, false]));
const GRACE = 30000;
const credential = () => randomBytes(32).toString("hex");
const validToken = (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const validName = (v) =>
  typeof v === "string" && /^[^\u0000-\u001f\u007f<>]{1,20}$/u.test(v.trim());
export function validateMessage(m) {
  if (
    !m ||
    typeof m !== "object" ||
    Array.isArray(m) ||
    typeof m.type !== "string"
  )
    return false;
  const schemas = {
    host_create: ["maxPlayers", "nickname", "role"],
    party_create: ["maxPlayers"],
    join_room: ["roomCode", "nickname", "role"],
    resume: ["roomCode", "token"],
    host_resume: ["roomCode", "token"],
    display_join: ["roomCode", "token"],
    discover_rooms: [],
    select_role: ["role"],
    ready: ["ready"],
    host_start: [],
    lobby_reset: [],
    client_input: ["input"],
    leave: [],
  };
  if (
    !Object.hasOwn(schemas, m.type) ||
    Object.keys(m).some((k) => k !== "type" && !schemas[m.type].includes(k))
  )
    return false;
  if (
    ["host_create", "party_create"].includes(m.type) &&
    !(Number.isInteger(m.maxPlayers) && m.maxPlayers >= 2 && m.maxPlayers <= 4)
  )
    return false;
  if (
    ["join_room", "resume", "host_resume", "display_join"].includes(m.type) &&
    !(typeof m.roomCode === "string" && /^[A-Z2-9]{6}$/.test(m.roomCode))
  )
    return false;
  if (
    ["resume", "host_resume", "display_join"].includes(m.type) &&
    !validToken(m.token)
  )
    return false;
  if ("nickname" in m && !validName(m.nickname)) return false;
  if ("role" in m && !ROLES.includes(m.role)) return false;
  if (m.type === "select_role") return ROLES.includes(m.role);
  if (m.type === "ready") return typeof m.ready === "boolean";
  if (m.type === "client_input")
    return (
      !!m.input &&
      typeof m.input === "object" &&
      !Array.isArray(m.input) &&
      Object.keys(m.input).every(
        (k) => KEYS.includes(k) && typeof m.input[k] === "boolean",
      )
    );
  return true;
}
export function createRoomServer({
  port = 8787,
  host = "0.0.0.0",
  serverIp = "localhost",
  lanAddresses = [],
  now = () => Date.now(),
} = {}) {
  const wss = new WebSocketServer({ port, host, maxPayload: 2048 });
  const rooms = new Map();
  const send = (ws, type, data = {}) => {
    if (ws?.readyState === 1 && ws.bufferedAmount < 1e6)
      ws.send(JSON.stringify({ type, ...data }));
  };
  const broadcast = (r, type, data) => {
    for (const p of r.players.values()) send(p.ws, type, data);
    send(r.hostSession?.ws, type, data);
    for (const ws of r.displays) send(ws, type, data);
  };
  const roster = (r) =>
    [...r.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      role: p.role,
      ready: p.ready,
      connected: !!p.ws,
    }));
  const lobby = (r) => {
    broadcast(r, "roster_update", {
      players: roster(r),
      hostId: r.hostId,
      maxPlayers: r.maxPlayers,
      party: r.party,
      displayCount: r.displays.size,
    });
    if (!r.party)
      send(r.players.get(r.hostId)?.ws, "host_access", {
        displayKey: r.displayKey,
      });
  };
  const error = (ws, message) => send(ws, "join_error", { message });
  const isHost = (r, ws) =>
    r.party
      ? r.hostSession?.ws === ws
      : ws.kind === "player" &&
        ws.playerId === r.hostId &&
        r.players.get(ws.playerId)?.ws === ws;
  const welcome = (r, ws, type, extra = {}) => {
    send(ws, type, {
      roomCode: r.code,
      hostId: r.hostId,
      maxPlayers: r.maxPlayers,
      party: r.party,
      serverIp,
      lanAddresses,
      ...extra,
    });
    lobby(r);
    if (r.state)
      send(ws, "game_start", {
        playerIds: r.state.players.map((p) => p.id),
        state: r.state,
      });
  };
  function detach(ws, permanent = false) {
    const r = rooms.get(ws.roomCode);
    if (!r) return;
    if (ws.kind === "display") r.displays.delete(ws);
    if (ws.kind === "host" && r.hostSession?.ws === ws) {
      r.hostSession.ws = null;
      r.hostSession.disconnectedAt = now();
      if (permanent) {
        broadcast(r, "room_closed", { message: "The host closed this room." });
        for (const p of r.players.values()) p.ws?.close(1000, "Room closed");
        for (const d of r.displays) d.close(1000, "Room closed");
        rooms.delete(r.code);
      }
    }
    const p = r.players.get(ws.playerId);
    if (ws.kind === "player" && p?.ws === ws) {
      p.ws = null;
      p.input = { ...EMPTY };
      p.disconnectedAt = now();
      p.ready = false;
      if (permanent) r.players.delete(p.id);
      if (!r.party && !r.players.has(r.hostId))
        r.hostId = [...r.players.keys()][0];
    }
    ws.roomCode = null;
    if (!r.party && !r.players.size) {
      rooms.delete(r.code);
      return;
    }
    lobby(r);
  }
  function attachPlayer(r, p, ws, type) {
    p.ws = ws;
    p.input = { ...EMPTY };
    p.inputAt = now();
    p.token = credential();
    ws.roomCode = r.code;
    ws.playerId = p.id;
    ws.kind = "player";
    welcome(r, ws, type, { playerId: p.id, sessionToken: p.token });
  }
  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.windowStart = now();
    ws.messages = 0;
    ws.on("error", () => {});
    ws.on("message", (raw) => {
      if (now() - ws.windowStart >= 1000) {
        ws.windowStart = now();
        ws.messages = 0;
      }
      if (++ws.messages > 80) {
        error(ws, "Rate limit exceeded");
        ws.close(1008, "Rate limit");
        return;
      }
      let m;
      try {
        m = JSON.parse(raw.toString());
      } catch {
        return error(ws, "Malformed JSON");
      }
      if (!validateMessage(m)) return error(ws, "Invalid action schema");
      if (m.type === "discover_rooms")
        return send(ws, "rooms_discovered", {
          rooms: [...rooms.values()]
            .filter((r) => !r.state)
            .slice(0, 50)
            .map((r) => ({
              roomCode: r.code,
              players: r.players.size,
              maxPlayers: r.maxPlayers,
            })),
        });
      if (
        [
          "host_create",
          "party_create",
          "join_room",
          "resume",
          "host_resume",
          "display_join",
        ].includes(m.type)
      ) {
        if (ws.roomCode) return error(ws, "Already in a room");
        let r;
        if (["host_create", "party_create"].includes(m.type)) {
          if (rooms.size >= 100) return error(ws, "Server room limit reached");
          let code;
          do {
            code = Array.from(
              { length: 6 },
              () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(32)],
            ).join("");
          } while (rooms.has(code));
          r = {
            code,
            maxPlayers: m.maxPlayers,
            party: m.type === "party_create",
            hostId: m.type === "party_create" ? null : 1,
            hostSession: null,
            displayKey: credential(),
            displays: new Set(),
            players: new Map(),
            state: null,
          };
          rooms.set(code, r);
        } else {
          r = rooms.get(m.roomCode);
          if (!r) return error(ws, "Room not found or expired");
        }
        if (["party_create", "host_resume"].includes(m.type)) {
          if (
            m.type === "host_resume" &&
            (!r.party ||
              r.hostSession?.token !== m.token ||
              r.hostSession.ws ||
              now() - r.hostSession.disconnectedAt >= GRACE)
          )
            return error(ws, "Host session active, invalid, or expired");
          r.hostSession = { ws, token: credential(), disconnectedAt: 0 };
          ws.roomCode = r.code;
          ws.kind = "host";
          welcome(r, ws, "host_connected", {
            sessionToken: r.hostSession.token,
            displayKey: r.displayKey,
          });
          return;
        }
        if (m.type === "display_join") {
          if (r.displayKey !== m.token)
            return error(
              ws,
              "Display access denied. Open Shared Display from the host.",
            );
          if (r.displays.size >= 4) return error(ws, "Display limit reached");
          r.displays.add(ws);
          ws.roomCode = r.code;
          ws.kind = "display";
          welcome(r, ws, "display_connected");
          return;
        }
        if (m.type === "resume") {
          const p = [...r.players.values()].find(
            (p) =>
              p.token === m.token && !p.ws && now() - p.disconnectedAt < GRACE,
          );
          if (!p)
            return error(ws, "Player session active, invalid, or expired");
          attachPlayer(r, p, ws, "joined_room");
          return;
        }
        if (r.state) return error(ws, "Match already started");
        let id = 1;
        while (r.players.has(id)) id++;
        if (id > r.maxPlayers) return error(ws, "Room full");
        const p = {
          id,
          nickname: m.nickname?.trim() || `Operative ${id}`,
          role: m.role || ["Hacker", "Assassin", "Scout", "Decoy"][id - 1],
          ready: false,
          disconnectedAt: 0,
        };
        r.players.set(id, p);
        attachPlayer(
          r,
          p,
          ws,
          m.type === "host_create" ? "room_created" : "joined_room",
        );
        return;
      }
      const r = rooms.get(ws.roomCode);
      if (!r) return error(ws, "Room membership required");
      if (m.type === "leave") {
        detach(ws, true);
        ws.close();
        return;
      }
      if (["host_start", "lobby_reset"].includes(m.type)) {
        if (!isHost(r, ws))
          return error(ws, "Only host can start or reset the mission");
        if (m.type === "lobby_reset") {
          if (r.state?.screen === "playing")
            return error(ws, "Mission still active");
          for (const p of r.players.values()) {
            p.ready = false;
            p.input = { ...EMPTY };
          }
          r.state = null;
          broadcast(r, "lobby_return");
          lobby(r);
          return;
        }
        if (r.state) return error(ws, "Match already started");
        const players = [...r.players.values()];
        if (players.length < 2 || !players.every((p) => p.ready && p.ws))
          return error(ws, "Need 2–4 connected, ready players");
        const composition = validateComposition(players);
        if (!composition.valid) return error(ws, composition.message);
        r.state = createShadowState(roster(r));
        broadcast(r, "game_start", {
          playerIds: r.state.players.map((p) => p.id),
          state: r.state,
        });
        return;
      }
      const p = r.players.get(ws.playerId);
      if (ws.kind !== "player" || p?.ws !== ws)
        return error(ws, "Read-only session: player actions denied");
      if (m.type === "client_input") {
        if (!r.state || r.state.screen !== "playing")
          return error(ws, "Match not active");
        p.input = { ...EMPTY, ...m.input };
        p.inputAt = now();
        return;
      }
      if (r.state) return error(ws, "Lobby action during match");
      if (m.type === "select_role") {
        p.role = m.role;
        p.ready = false;
        lobby(r);
      }
      if (m.type === "ready") {
        p.ready = m.ready;
        lobby(r);
      }
    });
    ws.on("close", () => detach(ws));
  });
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 5000);
  heartbeat.unref();
  const timer = setInterval(() => {
    for (const r of rooms.values()) {
      // Reserved lobby slots survive refresh but expire after the same 30s grace.
      if (!r.state)
        for (const p of r.players.values())
          if (!p.ws && now() - p.disconnectedAt >= GRACE)
            r.players.delete(p.id);
      if (!r.party && !r.players.has(r.hostId))
        r.hostId = [...r.players.keys()][0];
      const anyone =
        [...r.players.values()].some((p) => p.ws) || r.hostSession?.ws;
      const latestDisconnect = Math.max(
        r.hostSession?.disconnectedAt || 0,
        ...[...r.players.values()].map((p) => p.disconnectedAt || 0),
      );
      if (!anyone && now() - latestDisconnect >= GRACE) {
        broadcast(r, "room_closed", { message: "Room expired." });
        for (const d of r.displays) d.close();
        rooms.delete(r.code);
        continue;
      }
      if (!r.state) {
        const signature = JSON.stringify(roster(r));
        if (signature !== r.lastRoster) {
          r.lastRoster = signature;
          lobby(r);
        }
        continue;
      }
      const missing = [...r.players.values()].filter((p) => !p.ws);
      let paused = false;
      if (missing.length && r.state.screen === "playing") {
        paused = true;
        if (missing.some((p) => now() - p.disconnectedAt >= GRACE)) {
          r.state.screen = "loss";
          r.state.lossReason = "Teammate disconnected for over 30 seconds.";
          paused = false;
        }
      }
      if (
        r.players.size !== r.state.players.length &&
        r.state.screen === "playing"
      ) {
        r.state.screen = "loss";
        r.state.lossReason = "A teammate left the operation.";
      }
      if (r.state.screen === "playing" && !paused) {
        const inputs = {};
        for (const p of r.players.values())
          inputs[p.id] = now() - p.inputAt < 250 ? p.input : { ...EMPTY };
        updateGame(r.state, 1 / 30, inputs);
      }
      broadcast(r, "snapshot", { state: r.state, paused });
    }
  }, 1000 / 30);
  timer.unref();
  return {
    wss,
    rooms,
    close: () => {
      clearInterval(timer);
      clearInterval(heartbeat);
      for (const c of wss.clients) c.terminate();
      return new Promise((resolve) => wss.close(resolve));
    },
  };
}
