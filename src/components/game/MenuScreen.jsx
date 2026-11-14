import React from "react";
import {
  Shield,
  ArrowUpRight,
  Users,
  Crosshair,
  Cpu,
  Radar,
  Volume2,
} from "lucide-react";
export default function MenuScreen({
  onStart,
  onInstructions,
  onHost,
  onJoin,
}) {
  return (
    <main className="ops-shell">
      <div className="ops-grid" />
      <div className="ops-menu">
        <header className="ops-top">
          <span>
            <Shield size={18} /> THETA TAU / FIELD OPERATIONS
          </span>
          <span className="ops-live">● SYSTEM ONLINE</span>
        </header>
        <div className="ops-hero">
          <section>
            <p className="ops-eyebrow">
              COOPERATIVE STEALTH / 02–04 OPERATIVES
            </p>
            <h1>
              SHADOW
              <br />
              <em>OPS</em>
              <span className="ops-dot">.</span>
            </h1>
            <p className="ops-lead">Enter unseen. Leave together.</p>
            <p className="ops-copy">
              Two access keys. One protected artifact. A facility that never
              sleeps. Assemble your team and make every move count.
            </p>
            <div className="ops-actions">
              <button className="ops-primary" onClick={onHost}>
                HOST GAME <ArrowUpRight size={20} />
              </button>
              <button onClick={onJoin}>JOIN GAME</button>
              <button onClick={onStart}>LOCAL CO-OP</button>
            <label className="local-player-choice">LOCAL PLAYERS <select aria-label="Local player count" value={localPlayers} onChange={e=>setLocalPlayers(Number(e.target.value))}>{[2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>
              <button onClick={onInstructions}>BRIEFING</button>
            </div>
          </section>
          <aside className="ops-intel">
            <div className="ops-eyebrow">OPERATION 001 / CROWN JEWEL</div>
            <div className="ops-radar">
              <div />
              <Crosshair size={78} />
              <span>SECURE FACILITY</span>
            </div>
            <div className="ops-intel-row">
              <span>OBJECTIVE</span>
              <b>INFILTRATE & EXTRACT</b>
            </div>
            <div className="ops-intel-row">
              <span>THREAT LEVEL</span>
              <b className="ops-live">ELEVATED</b>
            </div>
            <p>
              All operatives must reach extraction. Nobody gets left behind.
            </p>
          </aside>
        </div>
        <footer className="ops-roles">
          {[
            [Crosshair, "ASSASSIN", "Close-range guard takedowns"],
            [Cpu, "HACKER", "Override facility security"],
            [Radar, "SCOUT", "Reveal threats around the team"],
            [Volume2, "DECOY", "Draw patrols away from the team"],
          ].map(([Icon, name, text]) => (
            <div key={name}>
              <Icon size={22} />
              <span>
                <b>{name}</b>
                <small>{text}</small>
              </span>
            </div>
          ))}
          <span className="ops-footer-note">
            <Users size={16} /> SCAN · JOIN · PLAY TOGETHER
          </span>
        </footer>
      </div>
    </main>
  );
}
