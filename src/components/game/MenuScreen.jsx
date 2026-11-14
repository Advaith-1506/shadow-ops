import React from "react";
import {
  Shield,
  ArrowUpRight,
  Users,
  Crosshair,
  Cpu,
  Radar,
} from "lucide-react";
export default function MenuScreen({ onStart, onInstructions, onLan }) {
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
              <button className="ops-primary" onClick={onLan}>
                ASSEMBLE SQUAD <ArrowUpRight size={20} />
              </button>
              <button onClick={onStart}>LOCAL CO-OP</button>
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
            <Users size={16} /> BUILT FOR LAN CO-OP
          </span>
        </footer>
      </div>
    </main>
  );
}
