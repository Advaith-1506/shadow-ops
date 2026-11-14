import React from "react";
import RoleCards from "./RoleCards";
import { validateComposition } from "@/lib/game/missionConfig";
import PartyInvite from "./PartyInvite";
import { CommandHeader, ROLE_ICONS, commandKeyCapture } from "./CommandUI";
import MissionBriefing from "./MissionBriefing";
export default function LobbyScreen({ net, onBack, entry = "join" }) {
  const { players, kind, myPlayerId, hostId, roomCode } = net;
  const me = players.find((p) => p.id === myPlayerId);
  const host = kind === "host" || (kind === "player" && myPlayerId === hostId);
  const composition = validateComposition(players);
  const canStart =
    composition.valid && players.every((p) => p.ready && p.connected);
  return (
    <main
      onKeyDownCapture={commandKeyCapture}
      className="ops-shell ops-lobby command-ui command-lobby"
    >
      <div className="ops-grid" />
      <section
        className={`ops-panel party-lobby ${roomCode && host ? "host-lobby" : ""}`}
      >
        <CommandHeader
          title={
            roomCode
              ? "SQUAD LOBBY"
              : entry === "host"
                ? "HOST GAME"
                : "JOIN THE OPERATION"
          }
          subtitle={
            roomCode
              ? "YOUR PHONES. ONE MISSION."
              : entry === "host"
                ? "Establish a shared-screen operation."
                : "Your squad is waiting. Join the operation."
          }
        />
        {!roomCode ? (
          <>
            <p className="ops-copy">
              {entry === "host"
                ? "Put this laptop on the big screen. Up to four phones become controllers; this display uses no player slot."
                : "Scan the host QR or enter a room code. Choose how you want to play."}
            </p>
            <label>
              WEBSOCKET SERVER
              <input
                aria-label="Server address"
                value={net.wsUrl}
                onChange={(e) => net.setWsUrl(e.target.value)}
              />
            </label>
            {entry === "host" ? (
              <>
                <label>
                  MAX PLAYERS
                  <select
                    value={net.lanMaxPlayers}
                    onChange={(e) =>
                      net.setLanMaxPlayers(Number(e.target.value))
                    }
                  >
                    {[2, 3, 4].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="ops-primary"
                  onClick={() => net.hostLanGame(true)}
                >
                  CREATE PARTY ROOM
                </button>
                <details className="party-advanced">
                  <summary>Host and play with this keyboard instead</summary>
                  <label>
                    YOUR NICKNAME
                    <input
                      value={net.nickname}
                      onChange={(e) => net.setNickname(e.target.value)}
                      maxLength={20}
                    />
                  </label>
                  <button
                    onClick={() => {
                      net.changeViewMode("game");
                      net.hostLanGame(false);
                    }}
                  >
                    HOST AS A PLAYER
                  </button>
                </details>
              </>
            ) : (
              <>
                <div className="ops-form-row">
                  <label>
                    ROOM CODE
                    <input
                      aria-label="Join room code"
                      value={net.joinCode}
                      onChange={(e) =>
                        net.setJoinCode(e.target.value.toUpperCase())
                      }
                      maxLength={6}
                    />
                  </label>
                  <label>
                    NICKNAME
                    <input
                      aria-label="Nickname"
                      value={net.nickname}
                      onChange={(e) => net.setNickname(e.target.value)}
                      maxLength={20}
                      autoComplete="nickname"
                      placeholder="Your callsign"
                    />
                  </label>
                </div>
                <RoleCards
                  selected={net.selectedRole}
                  onSelect={net.setSelectedRole}
                />
                <ModeToggle mode={net.viewMode} onChange={net.changeViewMode} />
                <button className="ops-primary" onClick={net.joinLanGame}>
                  JOIN ROOM
                </button>
                <details className="party-advanced">
                  <summary>Find rooms on this server</summary>
                  <button onClick={net.discoverLanGames}>FIND ROOMS</button>
                  {net.discoveredRooms.map((r) => (
                    <button
                      key={r.roomCode}
                      onClick={() => net.setJoinCode(r.roomCode)}
                    >
                      {r.roomCode} · {r.players}/{r.maxPlayers}
                    </button>
                  ))}
                </details>
              </>
            )}
          </>
        ) : (
          <div className={host ? "party-host-grid" : ""}>
            {host && <PartyInvite net={net} />}
            <section>
              <div className="party-roster">
                <p className="ops-eyebrow">
                  ROOM {roomCode} · {players.length}/{net.lanMaxPlayers}{" "}
                  OPERATIVES · {net.displayCount} EXTRA DISPLAYS
                </p>
                {Array.from(
                  { length: net.lanMaxPlayers },
                  (_, i) => players[i] || { id: `empty-${i}` },
                ).map((p, i) => (
                  <div
                    key={p.id}
                    className={`party-slot ${p.ready ? "slot-ready" : ""} ${!p.connected && p.nickname ? "slot-disconnected" : ""}`}
                  >
                    <span className="slot-number">
                      {p.role
                        ? React.createElement(ROLE_ICONS[p.role], { size: 23 })
                        : `0${i + 1}`}
                    </span>
                    <span>
                      <b>
                        {p.nickname || "Waiting for a phone…"}
                        {p.id === myPlayerId ? " / YOU" : ""}
                        {p.id === hostId ? " · HOST" : ""}
                      </b>
                      <small>
                        {p.role || "Scan to join"}
                        {p.nickname
                          ? ` · ${p.connected ? "CONNECTED" : "DISCONNECTED"}`
                          : ""}
                      </small>
                    </span>
                    <strong className={p.ready ? "ops-live" : ""}>
                      {!p.nickname
                        ? "EMPTY"
                        : !p.connected
                          ? "RECONNECTING"
                          : p.ready
                            ? "READY"
                            : "CHOOSING"}
                    </strong>
                  </div>
                ))}
              </div>
              {me && (
                <>
                  <RoleCards
                    selected={me.role}
                    players={players}
                    onSelect={(role) => net.sendLobby("select_role", { role })}
                  />
                  <ModeToggle
                    mode={net.viewMode}
                    onChange={net.changeViewMode}
                  />
                  <button
                    className={me.ready ? "" : "ops-primary"}
                    onClick={() => net.sendLobby("ready", { ready: !me.ready })}
                  >
                    {me.ready ? "CANCEL READY" : "READY UP"}
                  </button>
                  <p className="ops-copy">
                    {me.ready
                      ? "Ready. Waiting for the host to deploy."
                      : "Choose a role and ready up. Role changes cancel ready status."}
                  </p>
                </>
              )}
              {kind === "display" && (
                <p className="ops-copy">
                  Read-only display · waiting for the host to deploy.
                </p>
              )}
              <MissionBriefing players={players} />
              {host && (
                <>
                  <p className="ops-copy">
                    Duo: Hacker + Assassin. Trio: add Scout OR Decoy. Full
                    Squad: all four unique roles. Each selected role unlocks a
                    required mission objective.
                  </p>
                  <button
                    className="ops-primary deploy-button"
                    disabled={!canStart}
                    onClick={() => net.sendLobby("host_start")}
                  >
                    DEPLOY SQUAD
                  </button>
                  {!canStart && (
                    <p className="ops-copy">
                      {!composition.valid
                        ? composition.message
                        : "Every operative must be connected and ready."}
                      {composition.missing.length > 0 &&
                        ` Missing: ${composition.missing.join(", ")}.`}
                      {composition.duplicates.length > 0 &&
                        ` Duplicate roles: ${composition.duplicates.join(", ")}.`}
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        )}
        <footer className="lobby-footer">
          <p role="status" className="ops-copy">
            {net.netStatus}
            {net.kind === "host"
              ? " · Host authorized · shared screen · no player slot"
              : ""}
          </p>
          {net.netError && (
            <p role="alert" className="ops-error">
              {net.netError}
            </p>
          )}
          <button onClick={onBack}>← LEAVE / MAIN MENU</button>
        </footer>
      </section>
    </main>
  );
}
export function ModeToggle({ mode, onChange }) {
  return (
    <div className="party-mode-toggle" aria-label="Phone play mode">
      <button
        aria-pressed={mode === "controller"}
        className={mode === "controller" ? "selected" : ""}
        onClick={() => onChange("controller")}
      >
        CONTROLLER MODE
      </button>
      <button
        aria-pressed={mode === "game"}
        className={mode === "game" ? "selected" : ""}
        onClick={() => onChange("game")}
      >
        PLAY ON THIS PHONE
      </button>
    </div>
  );
}
