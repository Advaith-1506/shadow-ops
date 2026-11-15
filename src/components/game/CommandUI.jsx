import React from "react";
import {
  Cpu,
  Crosshair,
  Radar,
  Volume2,
  ShieldCheck,
  Users,
  Radio,
  Diamond,
  ArrowUpRight,
} from "lucide-react";
import Logo from "./Logo";
import "./command-ui.css";
export const ROLE_ICONS = {
  Hacker: Cpu,
  Assassin: Crosshair,
  Scout: Radar,
  Decoy: Volume2,
};
export function CommandHeader({ title, subtitle, onBack }) {
  return (
    <header className="command-header">
      {onBack && (
        <button
          className="command-back"
          onClick={onBack}
          aria-label="Back to main menu"
        >
          ←
        </button>
      )}
      <Logo />
      <div>
        <p className="ops-eyebrow">THETA TAU / FIELD OPERATIONS</p>
        <h1>{title}</h1>
        {subtitle && <p className="command-subtitle">{subtitle}</p>}
      </div>
      <span className="command-header-mark" aria-hidden="true">
        ///
      </span>
    </header>
  );
}
export function MissionIntel() {
  return (
    <aside className="command-intel tactical-card">
      <div className="section-label">
        <span>OPERATION / 001</span>
        <span>RESIDENTIAL INFILTRATION</span>
      </div>
      <h2>
        MAPLE ROW <span>SAFEHOUSE</span>
      </h2>
      <div className="command-mission-graphic" aria-hidden="true">
        <div className="intel-crosshair" />
        <Diamond size={54} />
        <span>DIAMOND / PRIORITY ASSET</span>
        <i>EXTRACTION ◇</i>
      </div>
      <p>
        Infiltrate the safehouse, bypass security, secure the Diamond, and
        extract as a squad.
      </p>
      <ul className="intel-features">
        {[
          [Users, "2–4 player co-op"],
          [Cpu, "Hacker · Assassin · Scout · Decoy"],
          [Radio, "LAN / QR phone controllers"],
          [ShieldCheck, "Server-authoritative multiplayer"],
        ].map(([Icon, text]) => (
          <li key={text}>
            <Icon size={18} />
            {text}
          </li>
        ))}
      </ul>
      <div className="intel-footer">
        <span>MAPLE ROW / FIELD INTELLIGENCE</span>
        <ArrowUpRight size={18} />
      </div>
    </aside>
  );
}

// Menu controls keep their native keyboard behavior without changing the
// game's global movement/ability keyboard listener. Never prevent default.
export function commandKeyCapture(event) {
  if (event.target.closest("button,a,input,select,textarea,summary"))
    event.stopPropagation();
}
