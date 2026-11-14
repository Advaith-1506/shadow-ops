import React from "react";
import { ROLES } from "@/lib/game/mission";
export default function LobbyScreen({
  players,
  myPlayerId,
  hostId,
  sendLobby,
  wsUrl,
  setWsUrl,
  joinCode,
  setJoinCode,
  onHost,
  onJoin,
  onDiscover,
  discoveredRooms,
  onBack,
  status,
  roomCode,
  inviteLink,
  error,
  lanMaxPlayers,
  setLanMaxPlayers,
}) {
  const me = players.find((p) => p.id === myPlayerId);
  const canStart =
    players.length >= 2 &&
    players.every((p) => p.ready && p.connected) &&
    players.some((p) => p.role === "Hacker") &&
    players.some((p) => p.role !== "Hacker");
  return (
    <main className="ops-shell ops-lobby">
      <div className="ops-grid" />
      <section className="ops-panel">
        <p className="ops-eyebrow">SHADOW OPS / SQUAD COMMAND</p>
        <h1>ASSEMBLE SQUAD</h1>
        <p className="ops-copy">
          Connect to the host laptop’s server. Choose a role, then ready up.
        </p>
        {!roomCode ? (
          <>
            <label>
              SERVER ADDRESS
              <input
                aria-label="Server address"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://192.168.1.10:8787"
              />
            </label>
            <div className="ops-form-row">
              <label>
                SQUAD SIZE
                <select
                  value={lanMaxPlayers}
                  onChange={(e) => setLanMaxPlayers(Number(e.target.value))}
                >
                  {[2, 3, 4].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <button className="ops-primary" onClick={onHost}>
                HOST ROOM
              </button>
            </div>
            <div className="ops-form-row">
              <label>
                ROOM CODE
                <input
                  aria-label="Room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABC234"
                />
              </label>
              <button onClick={onJoin}>JOIN ROOM</button>
            </div>
            <button onClick={onDiscover}>FIND ROOMS ON THIS SERVER</button>
            {discoveredRooms.map((r) => (
              <button key={r.roomCode} onClick={() => setJoinCode(r.roomCode)}>
                {r.roomCode} · {r.players}/{r.maxPlayers}
              </button>
            ))}
          </>
        ) : (
          <>
            <div className="ops-room">
              ROOM <strong>{roomCode}</strong>
              <small>{inviteLink}</small>
            </div>
            <div className="ops-roster">
              {players.map((p) => (
                <div key={p.id}>
                  <b>
                    P{p.id} {p.id === hostId ? " / HOST" : ""}
                    {p.id === myPlayerId ? " / YOU" : ""}
                  </b>
                  <span>{p.role}</span>
                  <span className={p.ready ? "ops-live" : ""}>
                    {!p.connected ? "OFFLINE" : p.ready ? "READY" : "PREPARING"}
                  </span>
                </div>
              ))}
            </div>
            <p className="ops-copy">
              Choose your specialty. A Hacker + one different role are required.
              Duplicate roles are allowed.
            </p>
            <div className="ops-role-picks">
              {ROLES.map((role) => (
                <button
                  aria-pressed={me?.role === role}
                  className={me?.role === role ? "selected" : ""}
                  key={role}
                  onClick={() => sendLobby("select_role", { role })}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="ops-copy">
              {me?.role === "Hacker"
                ? "Q: disable a nearby camera for 10s or unlock a nearby side door. Cooldown 16s."
                : me?.role === "Assassin"
                  ? "Q: stun a guard within 62px for 5s. Cooldown 12s."
                  : "Q: highlight guards and hazards within 360px for 6s. Cooldown 18s."}
            </p>
            <div className="ops-actions">
              <button onClick={() => sendLobby("ready", { ready: !me?.ready })}>
                {me?.ready ? "CANCEL READY" : "READY UP"}
              </button>
              {myPlayerId === hostId && (
                <button
                  className="ops-primary"
                  disabled={!canStart}
                  onClick={() => sendLobby("host_start")}
                >
                  DEPLOY SQUAD
                </button>
              )}
            </div>
            {!canStart && (
              <p className="ops-copy">
                Deployment needs 2–4 ready operatives, including a Hacker and a
                different role.
              </p>
            )}
          </>
        )}
        <p role="status" className="ops-copy">
          {status}
        </p>
        {error && (
          <p role="alert" className="ops-error">
            {error}
          </p>
        )}
        <button onClick={onBack}>← RETURN TO COMMAND</button>
      </section>
    </main>
  );
}
