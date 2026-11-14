import { WebSocketServer } from "ws";
import { randomBytes, randomInt } from "node:crypto";
import { createShadowState, ROLES } from "../src/lib/game/mission.js";
import { updateGame } from "../src/lib/game/gameLoop.js";
const KEYS = ["up", "down", "left", "right", "interact", "ability"];
const EMPTY = Object.fromEntries(KEYS.map((k) => [k, false]));
export function validateMessage(m) {
  if (
    !m ||
    typeof m !== "object" ||
    Array.isArray(m) ||
    typeof m.type !== "string"
  )
    return false;
  const schemas = {
    host_create: ["maxPlayers"],
    join_room: ["roomCode"],
    resume: ["roomCode", "token"],
    discover_rooms: [],
    select_role: ["role"],
    ready: ["ready"],
    host_start: [],
    client_input: ["input"],
    leave: [],
  };
  if (
    !Object.hasOwn(schemas, m.type) ||
    Object.keys(m).some((k) => k !== "type" && !schemas[m.type].includes(k))
  )
    return false;
  if (m.type === "host_create")
    return (
      Number.isInteger(m.maxPlayers) && m.maxPlayers >= 2 && m.maxPlayers <= 4
    );
  if (
    ["join_room", "resume"].includes(m.type) &&
    (typeof m.roomCode !== "string" || !/^[A-Z2-9]{6}$/.test(m.roomCode))
  )
    return false;
  if (m.type === "resume")
    return typeof m.token === "string" && /^[a-f0-9]{64}$/.test(m.token);
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
  };
  const roster = (r) =>
    [...r.players.values()].map((p) => ({
      id: p.id,
      role: p.role,
      ready: p.ready,
      connected: !!p.ws,
    }));
  const lobby = (r) =>
    broadcast(r, "roster_update", {
      players: roster(r),
      hostId: r.hostId,
      maxPlayers: r.maxPlayers,
    });
  const error = (ws, message) => send(ws, "join_error", { message });
  function detach(ws, permanent = false) {
    const r = rooms.get(ws.roomCode);
    const p = r?.players.get(ws.playerId);
    if (!p || p.ws !== ws) return;
    p.ws = null;
    p.input = { ...EMPTY };
    p.disconnectedAt = now();
    p.ready = false;
    if (permanent || !r.state) r.players.delete(p.id);
    if (!r.players.size) rooms.delete(r.code);
    else {
      if (!r.players.has(r.hostId)) r.hostId = [...r.players.keys()][0];
      lobby(r);
    }
    ws.roomCode = null;
  }
  wss.on("connection", (ws) => {
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
      if (["host_create", "join_room", "resume"].includes(m.type)) {
        if (ws.roomCode) return error(ws, "Already in a room");
        let r, p;
        if (m.type === "host_create") {
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
            hostId: 1,
            players: new Map(),
            state: null,
          };
          rooms.set(code, r);
        } else {
          r = rooms.get(m.roomCode);
          if (!r) return error(ws, "Room not found");
        }
        if (m.type === "resume") {
          p = [...r.players.values()].find(
            (p) =>
              p.token === m.token && !p.ws && now() - p.disconnectedAt < 30000,
          );
          if (!p) return error(ws, "Invalid or expired session");
        } else {
          if (r.state) return error(ws, "Match already started");
          let id = 1;
          while (r.players.has(id)) id++;
          if (id > r.maxPlayers) return error(ws, "Room full");
          p = {
            id,
            role: id === 1 ? "Hacker" : "Assassin",
            ready: false,
            token: randomBytes(32).toString("hex"),
            input: { ...EMPTY },
          };
          r.players.set(id, p);
        }
        p.ws = ws;
        p.inputAt = now();
        p.token = randomBytes(32).toString("hex");
        ws.roomCode = r.code;
        ws.playerId = p.id;
        send(ws, m.type === "host_create" ? "room_created" : "joined_room", {
          roomCode: r.code,
          playerId: p.id,
          hostId: r.hostId,
          maxPlayers: r.maxPlayers,
          serverIp,
          sessionToken: p.token,
        });
        lobby(r);
        if (r.state)
          send(ws, "game_start", {
            playerIds: r.state.players.map((p) => p.id),
            state: r.state,
          });
        return;
      }
      const r = rooms.get(ws.roomCode);
      const p = r?.players.get(ws.playerId);
      if (!p || p.ws !== ws) return error(ws, "Room membership required");
      if (m.type === "leave") {
        detach(ws, true);
        ws.close();
        return;
      }
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
      if (m.type === "host_start") {
        if (p.id !== r.hostId) return error(ws, "Only host can start");
        const players = [...r.players.values()];
        if (players.length < 2 || !players.every((p) => p.ready && p.ws))
          return error(ws, "Need 2–4 connected, ready players");
        if (
          !players.some((p) => p.role === "Hacker") ||
          !players.some((p) => p.role !== "Hacker")
        )
          return error(ws, "Need a Hacker and a different role");
        r.state = createShadowState(roster(r));
        broadcast(r, "game_start", {
          playerIds: r.state.players.map((p) => p.id),
          state: r.state,
        });
      }
    });
    ws.on("close", () => detach(ws));
  });
  const timer = setInterval(() => {
    for (const r of rooms.values()) {
      if (
        ![...r.players.values()].some((p) => p.ws) &&
        [...r.players.values()].every((p) => now() - p.disconnectedAt >= 30000)
      ) {
        rooms.delete(r.code);
        continue;
      }
      if (!r.state) continue;
      // Freeze the whole mission during the reconnect grace period: no abandoned carrier or guards advancing.
      const missing = [...r.players.values()].filter((p) => !p.ws);
      if (missing.length && r.state.screen === "playing") {
        if (missing.some((p) => now() - p.disconnectedAt >= 30000)) {
          r.state.screen = "loss";
          r.state.lossReason = "Teammate disconnected for over 30 seconds.";
        }
        broadcast(r, "snapshot", { state: r.state, paused: true });
        continue;
      }
      // Explicit leave during a mission fails it rather than silently relaxing all-player extraction.
      if (
        r.players.size !== r.state.players.length &&
        r.state.screen === "playing"
      ) {
        r.state.screen = "loss";
        r.state.lossReason = "A teammate left the operation.";
      }
      if (r.state.screen === "playing") {
        const inputs = {};
        for (const p of r.players.values())
          inputs[p.id] = now() - p.inputAt < 250 ? p.input : { ...EMPTY };
        updateGame(r.state, 1 / 30, inputs);
      }
      broadcast(r, "snapshot", { state: r.state, paused: false });
    }
  }, 1000 / 30);
  timer.unref();
  return {
    wss,
    rooms,
    close: () => {
      clearInterval(timer);
      for (const c of wss.clients) c.terminate();
      return new Promise((resolve) => wss.close(resolve));
    },
  };
}
