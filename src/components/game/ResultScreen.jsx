import React from "react";
import { objectiveSummary } from "@/lib/game/mission";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  Clock,
  Diamond,
  Shield,
} from "lucide-react";
import { CommandHeader, ROLE_ICONS, commandKeyCapture } from "./CommandUI";
const contributionNames = {
  keys: "Keys collected",
  security: "Terminal overrides",
  vault: "Vaults opened",
  artifact: "Artifacts recovered",
  revives: "Teammates revived",
  takedowns: "Guards incapacitated",
  overrides: "Device overrides",
  scans: "Recon pulses",
  distractions: "Noise makers",
  credentials: "Captain takedowns",
  networks: "Camera networks disabled",
  doors: "Electronic doors unlocked",
  keySets: "Team key sets",
  recon: "Recon discoveries",
  lures: "Sentry lures",
  checkpoint: "Relay contributions",
  extractions: "Team extractions",
};
export default function ResultScreen({
  state,
  onRestart,
  onMenu,
  networked = false,
  isHost = false,
}) {
  const win = state.screen === "win",
    players = state.players || [],
    completed =
      state.mission?.objectives?.filter((o) => o.status === "complete") || [],
    objectives = state.mission ? objectiveSummary(state) : [];
  const time = Math.max(0, Math.floor(state.elapsedTime || 0));
  const secured = [
    ...state.loot,
    ...players.filter((p) => p.holding).map((p) => p.holding),
  ];
  return (
    <main
      onKeyDownCapture={commandKeyCapture}
      className={`ops-shell command-ui command-results ${win ? "result-success" : "result-failure"}`}
    >
      <section className="command-frame">
        <CommandHeader
          title="MISSION RESULT"
          subtitle={state.mission?.config?.variant || "OPERATION DEBRIEF"}
        />
        <header className="result-heading">
          {win ? <CheckCircle2 size={38} /> : <XCircle size={38} />}
          <p className="ops-eyebrow">FIELD REPORT / MAPLE ROW SAFEHOUSE</p>
          <h1>{win ? "MISSION SUCCESS" : "MISSION FAILED"}</h1>
          <p>
            {win
              ? "Artifact Secured. Team Extracted."
              : state.lossReason || "The operation has ended."}
          </p>
        </header>
        <div className="result-stats">
          {[
            [Shield, "TEAM SCORE", state.score.toLocaleString()],
            [
              Clock,
              "ELAPSED",
              `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`,
            ],
            [Diamond, "ARTIFACTS SECURED", secured.length],
            [
              CheckCircle2,
              "OBJECTIVES",
              `${completed.length}/${objectives.length}`,
            ],
          ].map(([Icon, label, value]) => (
            <div key={label} className="tactical-card">
              <Icon size={19} />
              <small>{label}</small>
              <b>{value}</b>
            </div>
          ))}
        </div>
        <div className="debrief-columns">
          <section className="tactical-card">
            <div className="section-label">SQUAD CONTRIBUTIONS</div>
            {players.map((p) => (
              <article key={p.id} className="debrief-player">
                {ROLE_ICONS[p.role] &&
                  React.createElement(ROLE_ICONS[p.role], { size: 23 })}
                <div>
                  <b>{p.nickname || `Operative ${p.id}`}</b>
                  <small>
                    {p.role} ·{" "}
                    {p.downed
                      ? "CAPTURED"
                      : p.atVan
                        ? "AT EXTRACTION"
                        : "IN FIELD"}
                  </small>
                  <p>
                    {Object.entries(p.stats || {})
                      .filter(([, n]) => n > 0)
                      .map(
                        ([key, n]) =>
                          `${contributionNames[key] || key.replace(/([A-Z])/g, " $1")}: ${n}`,
                      )
                      .join(" · ") ||
                      "No recorded objective or ability actions"}
                  </p>
                </div>
              </article>
            ))}
          </section>
          <section className="tactical-card">
            <div className="section-label">OBJECTIVE RECORD</div>
            <ul className="debrief-objectives">
              {objectives.map((o) => (
                <li
                  key={o.id}
                  className={o.status === "complete" ? "done" : ""}
                >
                  <span>{o.status === "complete" ? "✓" : "○"}</span>
                  {o.label}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <footer className="result-actions">
          <button
            className="ops-primary"
            disabled={networked && !isHost}
            onClick={onRestart}
          >
            <RotateCcw size={19} />
            {networked
              ? "RETURN TO LOBBY / PLAY AGAIN"
              : win
                ? "PLAY AGAIN"
                : "TRY AGAIN"}
          </button>
          <button onClick={onMenu}>
            <Home size={18} />
            RETURN TO MENU
          </button>
        </footer>
        {networked && !isHost && (
          <p className="result-wait" role="status">
            Waiting for the host to return the squad to the lobby.
          </p>
        )}
      </section>
    </main>
  );
}
