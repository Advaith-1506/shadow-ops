import React from "react";
import {
  Users,
  ScanLine,
  Monitor,
  BookOpen,
  ArrowRight,
  Radio,
} from "lucide-react";
import Logo from "./Logo";
import { MissionIntel, commandKeyCapture } from "./CommandUI";
export default function MenuScreen({
  onStart,
  onInstructions,
  onHost,
  onJoin,
  localPlayers = 4,
  setLocalPlayers,
}) {
  return (
    <main
      onKeyDownCapture={commandKeyCapture}
      className="ops-shell command-ui command-landing"
    >
      <div className="ops-grid" />
      <div className="command-frame">
        <header className="landing-top">
          <span>THETA TAU / HACKATHON OPERATIONS</span>
          <span>
            <Radio size={14} /> COOPERATIVE STEALTH / 02–04
          </span>
        </header>
        <div className="landing-grid">
          <section className="landing-hero">
            <div className="hero-identity">
              <Logo hero />
              <p className="ops-eyebrow">ENTER UNSEEN. LEAVE TOGETHER.</p>
            </div>
            <h1 className="landing-tagline">
              Assemble your squad.
              <br />
              Breach the safehouse.
              <br />
              <em>Extract together.</em>
            </h1>
            <nav className="command-navigation" aria-label="Main navigation">
              {[
                [Users, "HOST GAME", onHost, true],
                [ScanLine, "JOIN GAME", onJoin],
                [Monitor, "LOCAL PLAY", onStart],
                [BookOpen, "HOW TO PLAY", onInstructions],
              ].map(([Icon, text, action, primary]) => (
                <button
                  key={text}
                  className={primary ? "ops-primary" : ""}
                  onClick={action}
                >
                  <Icon size={24} />
                  <span>{text}</span>
                  <ArrowRight className="nav-arrow" size={20} />
                </button>
              ))}
            </nav>
            <label className="local-player-choice">
              LOCAL SQUAD SIZE{" "}
              <select
                aria-label="Local player count"
                value={localPlayers}
                onChange={(e) => setLocalPlayers(Number(e.target.value))}
              >
                {[2, 3, 4].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <span>One keyboard · shared screen</span>
            </label>
          </section>
          <MissionIntel />
        </div>
        <footer className="landing-footer">
          <span>
            <i /> PARTY MODE READY
          </span>
          <span>SCAN. JOIN. COORDINATE.</span>
          <span>ALL OPERATIVES EXTRACT TOGETHER ↗</span>
        </footer>
      </div>
    </main>
  );
}
