import React, { useState } from "react";
import TouchControls from "./TouchControls";
import { ROLE_INFO } from "@/lib/game/roles";
import { objectiveSummary, currentRolePrompt } from "@/lib/game/mission";
export default function ControllerScreen({ net, onInput, onLeave }) {
  const [haptics, setHaptics] = useState(false);
  const s = net.liveState,
    p = s?.players.find((p) => p.id === net.myPlayerId),
    info = ROLE_INFO[p?.role];
  const online =
    net.netStatus === "Connected" && !net.networkRef.current.paused;
  return (
    <main
      className="phone-controller"
      style={{ "--role-color": info?.color || "#65d7ff" }}
    >
      <header className="controller-header">
        <div>
          <p className="ops-eyebrow">SHADOW OPS / PHONE CONTROLLER</p>
          <h1>
            {p?.nickname || "Operative"} <span>{p?.role}</span>
          </h1>
        </div>
        <span className={online ? "ops-live" : "ops-error"} role="status">
          {online ? "● CONNECTED" : `● ${net.netStatus.toUpperCase()}`}
        </span>
      </header>
      <section className="controller-mission">
        <b>{s && p ? currentRolePrompt(s, p) : "Awaiting mission"}</b>
        {s?.mission?.config && (
          <small className="ops-copy">{s.mission.config.variant}</small>
        )}
        <span>
          ALERT {Math.floor(s?.alarm || 0)}% ·{" "}
          {Math.floor((s?.timer || 0) / 60)}:
          {String(Math.floor((s?.timer || 0) % 60)).padStart(2, "0")}
        </span>
        <div className="controller-alert">
          <i style={{ width: `${s?.alarm || 0}%` }} />
        </div>
        {s?.events?.at(-1) && s.timer > s.events.at(-1).at - 5 && (
          <p role="status">{s.events.at(-1).text}</p>
        )}
        {p?.downed && (
          <p className="capture-warning">
            CAPTURED · teammate must revive you within{" "}
            {Math.ceil(p.custodyTimer)}s
          </p>
        )}
        {!online && (
          <p className="capture-warning">
            {net.netError ||
              "Inputs released. Mission waits for disconnected players."}
          </p>
        )}
      </section>
      <TouchControls
        onChange={onInput}
        player={p}
        haptics={haptics}
        enabled={online && !p?.downed}
      />
      <footer className="controller-footer">
        <p>{info?.description}</p>
        <div>
          <button onClick={() => net.changeViewMode("game")}>
            VIEW GAME ON PHONE
          </button>
          <button aria-pressed={haptics} onClick={() => setHaptics(!haptics)}>
            HAPTICS {haptics ? "ON" : "OFF"}
          </button>
          <button onClick={onLeave}>LEAVE</button>
        </div>
        <details>
          <summary>TEAM OBJECTIVES</summary>
          <div className="objective-list">
            {s &&
              objectiveSummary(s).map((o) => (
                <span key={o.id} className={o.status}>
                  {o.status === "complete"
                    ? "✓"
                    : o.status === "blocked"
                      ? "○"
                      : "→"}{" "}
                  {o.label}
                </span>
              ))}
          </div>
        </details>
      </footer>
    </main>
  );
}
