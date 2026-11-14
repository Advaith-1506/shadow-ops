import { beforeEach, afterEach, it, expect } from "vitest";
import { once } from "node:events";
import { WebSocket } from "ws";
import { createRoomServer } from "../../server/roomServer.js";
let server, clients, time;
const send = (ws, type, data = {}) =>
  ws.send(JSON.stringify({ type, ...data }));
const pause = (ms = 35) => new Promise((r) => setTimeout(r, ms));
async function client() {
  const ws = new WebSocket(`ws://127.0.0.1:${server.wss.address().port}`);
  ws.messages = [];
  ws.on("message", (b) => ws.messages.push(JSON.parse(b)));
  await once(ws, "open");
  clients.push(ws);
  return ws;
}
async function read(ws, type) {
  const deadline = Date.now() + 2500;
  while (Date.now() < deadline) {
    const i = ws.messages.findIndex((m) => m.type === type);
    if (i >= 0) return ws.messages.splice(i, 1)[0];
    await pause(10);
  }
  throw Error(`Missing ${type}`);
}
async function party() {
  const host = await client();
  send(host, "party_create", { maxPlayers: 4 });
  const welcome = await read(host, "host_connected");
  return { host, welcome, room: server.rooms.get(welcome.roomCode) };
}
async function join(code, role = "Assassin", nickname = "Phone") {
  const ws = await client();
  send(ws, "join_room", { roomCode: code, role, nickname });
  const welcome = await read(ws, "joined_room");
  return { ws, welcome };
}
async function start(host, players) {
  for (const p of players) send(p.ws, "ready", { ready: true });
  await pause();
  send(host, "host_start");
  await read(host, "game_start");
}
beforeEach(async () => {
  clients = [];
  time = Date.now();
  server = createRoomServer({
    port: 0,
    host: "127.0.0.1",
    now: () => time,
    serverIp: "192.168.1.22",
    lanAddresses: [{ name: "en0", address: "192.168.1.22" }],
  });
  await once(server.wss, "listening");
});
afterEach(async () => {
  clients.forEach((ws) => ws.terminate());
  await server.close();
});
it("runs one host, one authorized display and four uniquely named player sessions", async () => {
  const { host, welcome, room } = await party();
  expect(room.players.size).toBe(0);
  expect(welcome.playerId).toBeUndefined();
  const display = await client();
  send(display, "display_join", {
    roomCode: welcome.roomCode,
    token: welcome.displayKey,
  });
  await read(display, "display_connected");
  const phones = [];
  for (const [i, role] of ["Hacker", "Assassin", "Scout", "Decoy"].entries())
    phones.push(await join(welcome.roomCode, role, `Phone ${i + 1}`));
  expect(room.players.size).toBe(4);
  expect(new Set([...room.players.values()].map((p) => p.role)).size).toBe(4);
  const fifth = await client();
  send(fifth, "join_room", { roomCode: welcome.roomCode });
  expect((await read(fifth, "join_error")).message).toMatch(/full/);
  await start(host, phones);
  const shown = await read(display, "game_start");
  expect(shown.state.players).toHaveLength(4);
  expect(shown.state.players[3].nickname).toBe("Phone 4");
  const state = (await read(display, "snapshot")).state;
  const playerState = (await read(phones[0].ws, "snapshot")).state;
  expect(state).toEqual(playerState);
  expect(JSON.stringify(state)).not.toContain(welcome.sessionToken);
  expect(JSON.stringify(state)).not.toContain(welcome.displayKey);
});
it("rejects unauthorized displays and all display gameplay/host actions", async () => {
  const { host, welcome } = await party();
  const viewer = await client();
  send(viewer, "display_join", {
    roomCode: welcome.roomCode,
    token: "0".repeat(64),
  });
  expect((await read(viewer, "join_error")).message).toMatch(/denied/);
  send(viewer, "display_join", {
    roomCode: welcome.roomCode,
    token: welcome.displayKey,
  });
  await read(viewer, "display_connected");
  for (const [type, data] of [
    ["ready", { ready: true }],
    ["select_role", { role: "Hacker" }],
    ["client_input", { input: { up: true } }],
    ["host_start", {}],
    ["lobby_reset", {}],
  ]) {
    send(viewer, type, data);
    expect((await read(viewer, "join_error")).message).toMatch(
      /denied|Only host/,
    );
  }
  send(host, "client_input", { input: { up: true } });
  expect((await read(host, "join_error")).message).toMatch(/Read-only/);
});
it("never grants administrative rights to a phone joining by room code", async () => {
  const { welcome } = await party();
  const phone = await join(welcome.roomCode, "Hacker");
  send(phone.ws, "host_start");
  expect((await read(phone.ws, "join_error")).message).toMatch(/Only host/);
  expect(phone.welcome.sessionToken).not.toBe(welcome.sessionToken);
  expect(phone.welcome.displayKey).toBeUndefined();
});
it("rejects duplicate roles and missing Assassin even when all players ready", async () => {
  const { host, welcome, room } = await party();
  const a = await join(welcome.roomCode, "Hacker"),
    b = await join(welcome.roomCode, "Decoy"),
    c = await join(welcome.roomCode, "Decoy");
  for (const p of [a, b, c]) send(p.ws, "ready", { ready: true });
  await pause();
  send(host, "host_start");
  expect((await read(host, "join_error")).message).toMatch(/Hacker, Assassin/);
  expect(room.state).toBeNull();
});
it("reserves identity and role across lobby refresh and rotates private credentials", async () => {
  const { welcome, room } = await party();
  const phone = await join(welcome.roomCode, "Scout", "Echo");
  phone.ws.close();
  await once(phone.ws, "close");
  await pause();
  expect(room.players.size).toBe(1);
  const resumed = await client();
  send(resumed, "resume", {
    roomCode: welcome.roomCode,
    token: phone.welcome.sessionToken,
  });
  const ack = await read(resumed, "joined_room");
  expect(ack.playerId).toBe(phone.welcome.playerId);
  expect(ack.sessionToken).not.toBe(phone.welcome.sessionToken);
  expect(room.players.get(ack.playerId).role).toBe("Scout");
  expect(room.players.get(ack.playerId).nickname).toBe("Echo");
});
it("rejects active duplicate controllers and token replays", async () => {
  const { welcome, room } = await party();
  const phone = await join(welcome.roomCode, "Hacker");
  const duplicate = await client();
  send(duplicate, "resume", {
    roomCode: welcome.roomCode,
    token: phone.welcome.sessionToken,
  });
  expect((await read(duplicate, "join_error")).message).toMatch(/active/);
  expect(room.players.size).toBe(1);
});
it("restores the private host independently without using a player slot", async () => {
  const { host, welcome, room } = await party();
  host.close();
  await once(host, "close");
  await pause();
  const resumed = await client();
  send(resumed, "host_resume", {
    roomCode: welcome.roomCode,
    token: welcome.sessionToken,
  });
  const ack = await read(resumed, "host_connected");
  expect(ack.sessionToken).not.toBe(welcome.sessionToken);
  expect(room.players.size).toBe(0);
  const attacker = await client();
  send(attacker, "host_resume", {
    roomCode: welcome.roomCode,
    token: welcome.sessionToken,
  });
  expect((await read(attacker, "join_error")).message).toMatch(/invalid/);
});
it("rejects malformed nicknames, roles, tokens and coordinates", async () => {
  const { welcome } = await party();
  const ws = await client();
  for (const data of [
    { roomCode: welcome.roomCode, nickname: "<script>" },
    { roomCode: welcome.roomCode, nickname: "x".repeat(21) },
    { roomCode: welcome.roomCode, role: "Root" },
    { roomCode: welcome.roomCode, playerId: 1 },
    { roomCode: welcome.roomCode, nickname: "\n" },
  ]) {
    send(ws, "join_room", data);
    expect((await read(ws, "join_error")).message).toMatch(/schema/);
  }
});
it("clears inputs on disconnect, freezes and resumes a started mission", async () => {
  const { host, welcome, room } = await party();
  const a = await join(welcome.roomCode, "Hacker"),
    b = await join(welcome.roomCode, "Assassin");
  await start(host, [a, b]);
  send(b.ws, "client_input", { input: { right: true, ability: true } });
  await pause();
  b.ws.close();
  await once(b.ws, "close");
  await pause();
  expect(room.players.get(2).input.right).toBe(false);
  const elapsedTime = room.state.elapsedTime;
  await pause(80);
  expect(room.state.elapsedTime).toBe(elapsedTime);
  const resumed = await client();
  send(resumed, "resume", {
    roomCode: welcome.roomCode,
    token: b.welcome.sessionToken,
  });
  await read(resumed, "joined_room");
  await read(resumed, "game_start");
  await pause();
  expect(room.state.elapsedTime).toBeGreaterThan(elapsedTime);
});
it("returns the same squad to lobby only on host authorization after mission end", async () => {
  const { host, welcome, room } = await party();
  const a = await join(welcome.roomCode, "Hacker"),
    b = await join(welcome.roomCode, "Assassin");
  await start(host, [a, b]);
  send(host, "lobby_reset");
  expect((await read(host, "join_error")).message).toMatch(/active/);
  room.state.screen = "win";
  send(a.ws, "lobby_reset");
  expect((await read(a.ws, "join_error")).message).toMatch(/Only host/);
  send(host, "lobby_reset");
  await read(a.ws, "lobby_return");
  expect(room.state).toBeNull();
  expect(room.players.size).toBe(2);
  expect([...room.players.values()].every((p) => !p.ready)).toBe(true);
});
it("ages out abandoned lobby reservations after 30 seconds", async () => {
  const { welcome, room } = await party();
  const p = await join(welcome.roomCode);
  p.ws.close();
  await once(p.ws, "close");
  await pause();
  time += 31000;
  await pause();
  expect(room.players.size).toBe(0);
});
it.each([
  ["Hacker", "Assassin"],
  ["Hacker", "Assassin", "Scout"],
  ["Hacker", "Assassin", "Decoy"],
  ["Hacker", "Assassin", "Scout", "Decoy"],
])("starts only fixed valid composition %j", async (...roles) => {
  const { host, welcome, room } = await party(),
    phones = [];
  for (const role of roles) phones.push(await join(welcome.roomCode, role));
  await start(host, phones);
  expect(room.state.mission.config.participants.map((p) => p.role)).toEqual(
    roles,
  );
  for (const phone of phones) {
    const initial = await read(phone.ws, "game_start");
    expect(initial.state.mission.config).toEqual(room.state.mission.config);
    expect(
      initial.state.mission.objectives.every((o) => o.status !== "complete"),
    ).toBe(true);
  }
});
it("synchronizes a legitimate role event and preserves it across reconnect", async () => {
  const { host, welcome, room } = await party();
  const hacker = await join(welcome.roomCode, "Hacker"),
    assassin = await join(welcome.roomCode, "Assassin");
  await start(host, [hacker, assassin]);
  // Network fixture places Hacker near ALPHA; completion still goes through
  // authenticated button input and the authoritative 30Hz simulation.
  Object.assign(room.state.players[0], {
    x: room.state.mission.keys[0].x,
    y: room.state.mission.keys[0].y,
  });
  send(hacker.ws, "client_input", { input: { interact: true } });
  await pause(80);
  expect(
    room.state.mission.objectives.find((o) => o.id === "electronic_key").status,
  ).toBe("complete");
  const config = room.state.mission.config;
  for (const client of [host, hacker.ws, assassin.ws]) {
    let state;
    for (let i = 0; i < 20; i++) {
      state = (await read(client, "snapshot")).state;
      if (
        state.mission.objectives.find((o) => o.id === "electronic_key")
          .status === "complete"
      )
        break;
    }
    expect(
      state.mission.objectives.find((o) => o.id === "electronic_key")
        .completedBy,
    ).toBe(1);
  }
  hacker.ws.close();
  await once(hacker.ws, "close");
  await pause();
  const resumed = await client();
  send(resumed, "resume", {
    roomCode: welcome.roomCode,
    token: hacker.welcome.sessionToken,
  });
  await read(resumed, "joined_room");
  const restored = (await read(resumed, "game_start")).state;
  expect(restored.mission.config).toEqual(config);
  expect(
    restored.mission.objectives.find((o) => o.id === "electronic_key").status,
  ).toBe("complete");
  for (const [type, data] of [
    ["objective_complete", { id: "recon" }],
    ["client_input", { input: { objective: "complete" } }],
    ["select_role", { role: "Scout" }],
  ]) {
    send(resumed, type, data);
    expect((await read(resumed, "join_error")).message).toMatch(
      /schema|Lobby action/,
    );
  }
  expect(room.state.players[0].role).toBe("Hacker");
});
