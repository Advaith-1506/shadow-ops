import { WebSocketServer } from "ws";
import os from "os";

const PORT = Number(process.env.PORT || 8787);
const wss = new WebSocketServer({ port: PORT });
const rooms = new Map();

function pickLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function send(ws, type, payload = {}) {
  if (!ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify({ type, ...payload }));
}

function broadcast(room, type, payload = {}) {
  for (const client of room.clients.values()) send(client, type, payload);
}

function playerIds(room) {
  return [...room.clients.entries()].map(([id]) => id).sort((a, b) => a - b);
}

function nextPlayerId(room) {
  for (let i = 1; i <= room.maxPlayers; i += 1) {
    if (!room.clients.has(i)) return i;
  }
  return null;
}

wss.on("connection", (ws) => {
  ws.meta = { roomCode: null, playerId: null, isHost: false };

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === "host_create") {
      let roomCode = genCode();
      while (rooms.has(roomCode)) roomCode = genCode();
      const maxPlayers = Math.max(1, Math.min(4, Number(msg.maxPlayers || 4)));
      const room = {
        roomCode,
        maxPlayers,
        clients: new Map(),
        hostId: 1,
      };
      room.clients.set(1, ws);
      rooms.set(roomCode, room);
      ws.meta = { roomCode, playerId: 1, isHost: true };
      send(ws, "room_created", { roomCode, serverIp: pickLanIp(), port: PORT, playerId: 1, maxPlayers });
      return;
    }

    if (msg.type === "discover_rooms") {
      const list = [...rooms.values()].map((r) => ({
        roomCode: r.roomCode,
        players: playerIds(r).length,
        maxPlayers: r.maxPlayers,
      }));
      send(ws, "rooms_discovered", { rooms: list, serverIp: pickLanIp(), port: PORT });
      return;
    }

    if (msg.type === "join_room") {
      const roomCode = String(msg.roomCode || "").toUpperCase();
      const room = rooms.get(roomCode);
      if (!room) return send(ws, "join_error", { message: "Room not found." });
      const id = nextPlayerId(room);
      if (!id) return send(ws, "join_error", { message: "Room is full." });
      room.clients.set(id, ws);
      ws.meta = { roomCode, playerId: id, isHost: false };
      send(ws, "joined_room", { roomCode, playerId: id, maxPlayers: room.maxPlayers });
      broadcast(room, "roster_update", { players: playerIds(room), maxPlayers: room.maxPlayers });
      return;
    }

    const room = rooms.get(ws.meta.roomCode || "");
    if (!room) return;

    if (msg.type === "host_start" && ws.meta.isHost) {
      broadcast(room, "game_start", { playerIds: playerIds(room) });
      return;
    }

    if (msg.type === "client_input") {
      const host = room.clients.get(room.hostId);
      if (host && host !== ws) {
        send(host, "client_input", { playerId: ws.meta.playerId, input: msg.input || {} });
      }
      return;
    }

    if (msg.type === "frame_inputs" && ws.meta.isHost) {
      for (const [id, client] of room.clients.entries()) {
        if (id === room.hostId) continue;
        send(client, "frame_inputs", { frame: msg.frame, inputs: msg.inputs || {} });
      }
      return;
    }

    if (msg.type === "game_end" && ws.meta.isHost) {
      broadcast(room, "game_end", { result: msg.result || "ended" });
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.meta.roomCode || "");
    if (!room) return;
    room.clients.delete(ws.meta.playerId);
    if (ws.meta.isHost) {
      broadcast(room, "peer_left");
      rooms.delete(room.roomCode);
      return;
    }
    broadcast(room, "roster_update", { players: playerIds(room), maxPlayers: room.maxPlayers });
  });
});

console.log(`Museum Break LAN server listening on ws://0.0.0.0:${PORT} (LAN IP: ${pickLanIp()})`);
