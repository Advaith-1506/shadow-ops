import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { WebSocket } from "ws";
import { once } from "node:events";
import { createRoomServer, validateMessage } from "../../server/roomServer.js";
let server, clients, clock;
async function client() {
  const ws = new WebSocket(`ws://127.0.0.1:${server.wss.address().port}`);
  ws.queue = [];
  ws.on("message", (b) => ws.queue.push(JSON.parse(b)));
  await once(ws, "open");
  clients.push(ws);
  return ws;
}
const send = (ws, type, p = {}) => ws.send(JSON.stringify({ type, ...p }));
async function receive(ws, type) {
  const start = Date.now();
  while (Date.now() - start < 2500) {
    const i = ws.queue.findIndex((m) => m.type === type);
    if (i >= 0) return ws.queue.splice(i, 1)[0];
    await new Promise((r) => setTimeout(r, 10));
  }
  throw Error("Timeout " + type);
}
async function pair() {
  const a = await client();
  send(a, "host_create", { maxPlayers: 4 });
  const created = await receive(a, "room_created");
  const b = await client();
  send(b, "join_room", { roomCode: created.roomCode });
  const joined = await receive(b, "joined_room");
  return { a, b, created, joined };
}
async function start(a, b) {
  send(a, "ready", { ready: true });
  send(b, "ready", { ready: true });
  await new Promise((r) => setTimeout(r, 30));
  send(a, "host_start");
  await receive(a, "game_start");
  await receive(b, "game_start");
}
beforeEach(async () => {
  clock = Date.now();
  clients = [];
  server = createRoomServer({ port: 0, host: "127.0.0.1", now: () => clock });
  await once(server.wss, "listening");
});
afterEach(async () => {
  for (const c of clients) c.terminate();
  await server.close();
});
describe("real WebSocket room protocol", () => {
  it("creates and joins rooms without leaking session tokens in roster or state", async () => {
    const { a, b, created, joined } = await pair();
    expect(created.roomCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(joined.playerId).toBe(2);
    expect(created.sessionToken).toHaveLength(64);
    const roster = await receive(b, "roster_update");
    expect(JSON.stringify(roster)).not.toContain("token");
    expect(JSON.stringify(roster)).not.toContain(created.sessionToken);
    await start(a, b);
    const snap = await receive(b, "snapshot");
    expect(snap.state.players).toHaveLength(2);
    expect(JSON.stringify(snap)).not.toContain("token");
  });
  it("rejects duplicate membership and nonexistent rooms", async () => {
    const { a, created } = await pair();
    send(a, "join_room", { roomCode: created.roomCode });
    expect((await receive(a, "join_error")).message).toMatch(/Already/);
    const c = await client();
    send(c, "join_room", { roomCode: "ZZZZZZ" });
    expect((await receive(c, "join_error")).message).toMatch(/not found/);
  });
  it("enforces capacity and rejects joins after start", async () => {
    const { a, b, created } = await pair();
    const r = server.rooms.get(created.roomCode);
    r.maxPlayers = 2;
    const c = await client();
    send(c, "join_room", { roomCode: created.roomCode });
    expect((await receive(c, "join_error")).message).toMatch(/full/);
    await start(a, b);
    send(c, "join_room", { roomCode: created.roomCode });
    expect((await receive(c, "join_error")).message).toMatch(/started/);
  });
  it("allows only host to start with ready players and complementary roles", async () => {
    const { a, b } = await pair();
    send(b, "host_start");
    expect((await receive(b, "join_error")).message).toMatch(/Only host/);
    send(a, "host_start");
    expect((await receive(a, "join_error")).message).toMatch(/ready/);
    send(b, "select_role", { role: "Hacker" });
    send(a, "ready", { ready: true });
    send(b, "ready", { ready: true });
    await new Promise((r) => setTimeout(r, 30));
    send(a, "host_start");
    expect((await receive(a, "join_error")).message).toMatch(/Hacker and an Assassin/);
  });
  it("role changes revoke ready status and reject unknown roles", async () => {
    const { a } = await pair();
    send(a, "ready", { ready: true });
    send(a, "select_role", { role: "Scout" });
    await new Promise((r) => setTimeout(r, 30));
    const r = [...server.rooms.values()][0];
    expect(r.players.get(1).role).toBe("Scout");
    expect(r.players.get(1).ready).toBe(false);
    send(a, "select_role", { role: "Admin" });
    expect((await receive(a, "join_error")).message).toMatch(/schema/);
  });
  it("rejects malformed, forged identity, speed, score, and victory payloads", async () => {
    const { a, b } = await pair();
    await start(a, b);
    for (const msg of [
      { type: "client_input", playerId: 1, input: {} },
      { type: "client_input", input: { right: true, speed: 9999 } },
      { type: "game_end", result: "win" },
      { type: "frame_inputs", inputs: {} },
      { type: "client_input", input: { up: "true" } },
      null,
      [],
    ]) {
      a.send(JSON.stringify(msg));
      expect((await receive(a, "join_error")).message).toMatch(/schema/);
    }
    a.send("{");
    expect((await receive(a, "join_error")).message).toMatch(/Malformed/);
  });
  it("advances movement at server tick speed and shares identical state", async () => {
    const { a, b, created } = await pair();
    await start(a, b);
    const r = server.rooms.get(created.roomCode),
      p = r.state.players[0],
      x = p.x;
    send(a, "client_input", { input: { right: true } });
    await new Promise((r) => setTimeout(r, 150));
    expect(p.x).toBeGreaterThan(x);
    expect(p.x - x).toBeLessThan(140 * 0.22);
    const sa = await receive(a, "snapshot"),
      sb = await receive(b, "snapshot");
    expect(sa.state).toEqual(sb.state);
  });
  it("freezes on disconnect and resumes only with private rotating token", async () => {
    const { a, b, created, joined } = await pair();
    await start(a, b);
    b.close();
    await once(b, "close");
    await new Promise((r) => setTimeout(r, 50));
    const r = server.rooms.get(created.roomCode),
      timer = r.state.timer;
    await new Promise((r) => setTimeout(r, 80));
    expect(r.state.timer).toBe(timer);
    const bad = await client();
    send(bad, "resume", { roomCode: created.roomCode, token: "0".repeat(64) });
    expect((await receive(bad, "join_error")).message).toMatch(/session/);
    const c = await client();
    send(c, "resume", {
      roomCode: created.roomCode,
      token: joined.sessionToken,
    });
    const resumed = await receive(c, "joined_room");
    expect(resumed.playerId).toBe(2);
    expect(resumed.sessionToken).not.toBe(joined.sessionToken);
    await receive(c, "game_start");
  });
  it("fails mission when reconnect grace expires", async () => {
    const { a, b, created } = await pair();
    await start(a, b);
    b.close();
    await once(b, "close");
    await new Promise((r) => setTimeout(r, 30));
    clock += 31000;
    await new Promise((r) => setTimeout(r, 50));
    expect(server.rooms.get(created.roomCode).state.screen).toBe("loss");
  });
  it("rate limits abusive action spam", async () => {
    const a = await client();
    for (let i = 0; i < 90; i++) send(a, "discover_rooms");
    const [code] = await once(a, "close");
    expect(code).toBe(1008);
  });
});
describe("strict runtime schemas", () => {
  it("rejects unknown fields and dangerous input shapes", () => {
    expect(validateMessage({ type: "client_input", input: { x: 1 } })).toBe(
      false,
    );
    expect(validateMessage({ type: "host_create", maxPlayers: NaN })).toBe(
      false,
    );
    expect(validateMessage({ type: "ready", ready: true, score: 1 })).toBe(
      false,
    );
    expect(
      validateMessage({ type: "client_input", input: { ability: true } }),
    ).toBe(true);
  });
});

it('rejects malicious object coercion in room codes',()=>{expect(validateMessage({type:'join_room',roomCode:{toString:null,valueOf:null}})).toBe(false);});
