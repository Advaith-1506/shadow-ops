import React, { useState } from "react";
import {
  Cpu,
  Crosshair,
  Radar,
  Volume2,
  Target,
  Keyboard,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { CommandHeader, ROLE_ICONS, commandKeyCapture } from "./CommandUI";
import { ROLE_INFO } from "@/lib/game/roles";
const tabs = [
  ["Overview", Target],
  ["Roles", Cpu],
  ["Objectives", Crosshair],
  ["Controls", Keyboard],
  ["Tips", Lightbulb],
];
const steps = [
  "Collect both keys — ALPHA in the Kitchen, BRAVO in the Study. Any operative can collect either.",
  "Complete every active role objective. Hacker unlocks the Garage pantry door and disables the Living Room camera network; Assassin incapacitates the marked captain.",
  "With Scout selected, perform one valid Garage-zone Recon Pulse. With Decoy selected, lure the marked sentry and have Hacker or Assassin release the relay during its opening.",
  "Hacker presses Interact at TERMINAL while a different teammate stays on SUPPORT PAD.",
  "Unlock the vault, retrieve the Diamond, and extract every operative together.",
];
export default function InstructionsScreen({ onBack }) {
  const [tab, setTab] = useState("Overview");
  return (
    <main
      onKeyDownCapture={commandKeyCapture}
      className="ops-shell command-ui command-help"
    >
      <section className="command-frame">
        <CommandHeader
          title="HOW TO PLAY"
          subtitle="FIELD MANUAL / MAPLE ROW SAFEHOUSE"
          onBack={onBack}
        />
        <div className="manual-layout">
          <nav aria-label="Field manual sections" className="manual-tabs">
            {tabs.map(([name, Icon]) => (
              <button
                key={name}
                aria-pressed={tab === name}
                onClick={() => setTab(name)}
                className={tab === name ? "selected" : ""}
              >
                <Icon size={19} />
                {name}
                <ChevronRight size={15} />
              </button>
            ))}
          </nav>
          <section className="manual-content tactical-card" aria-live="polite">
            <p className="ops-eyebrow">
              SQUAD TRAINING /{" "}
              {String(tabs.findIndex((t) => t[0] === tab) + 1).padStart(2, "0")}
            </p>
            <h2>
              {tab === "Overview"
                ? "ONE MISSION. EVERY ROLE MATTERS."
                : tab.toUpperCase()}
            </h2>
            {tab === "Overview" && (
              <>
                <p className="manual-lead">
                  Work together to infiltrate the safehouse, complete role
                  objectives, retrieve the Diamond, and extract as a team.
                </p>
                <div className="manual-role-strip">
                  {[
                    ["Hacker", Cpu],
                    ["Assassin", Crosshair],
                    ["Scout", Radar],
                    ["Decoy", Volume2],
                  ].map(([name, Icon]) => (
                    <div key={name}>
                      <Icon size={30} />
                      <b>{name}</b>
                    </div>
                  ))}
                </div>
                <p className="ops-copy">
                  Duo: Hacker + Assassin. Trio: add Scout or Decoy. Full Squad:
                  all four unique roles. Party hosts and authorized displays use
                  no player slots.
                </p>
                <div className="manual-callout">
                  Two keys. One Diamond. Nobody gets left behind.
                </div>
              </>
            )}
            {tab === "Roles" && (
              <div className="manual-roles">
                {Object.entries(ROLE_INFO).map(([role, info]) => (
                  <article key={role} style={{ "--role": info.color }}>
                    <div>
                      {React.createElement(ROLE_ICONS[role], { size: 26 })}
                      <h3>{role}</h3>
                    </div>
                    <b>{info.ability}</b>
                    <p>{info.description}</p>
                    <small>{info.cooldown}s cooldown</small>
                  </article>
                ))}
              </div>
            )}
            {tab === "Objectives" && (
              <ol className="manual-objectives">
                {steps.map((text, i) => (
                  <li key={text}>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            )}
            {tab === "Controls" && (
              <>
                <div className="control-table">
                  <div>
                    <b>MODE</b>
                    <b>MOVE</b>
                    <b>INTERACT / ABILITY</b>
                  </div>
                  {[
                    ["LAN keyboard", "WASD / arrows", "E, Enter or Space / Q"],
                    ["Local P1 · Hacker", "WASD", "E / Q"],
                    [
                      "Local P2 · Assassin",
                      "Arrow keys",
                      "Enter or Space / slash",
                    ],
                    ["Local P3 · Scout", "T F G H", "R / Y"],
                    ["Local P4 · Decoy", "I J K L", "O / P"],
                    ["Phone", "Touch joystick", "Interact / Ability buttons"],
                  ].map((row) => (
                    <div key={row[0]}>
                      {row.map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="ops-copy">
                  Hold Interact near a captured teammate to revive. Escape
                  pauses local play only. Switch phone controller and full-game
                  views without changing your player slot.
                </p>
              </>
            )}
            {tab === "Tips" && (
              <ul className="manual-tips">
                {[
                  "Coordinate abilities before entering protected areas.",
                  "Watch patrols, use cover, and stay aware of cameras.",
                  "Decoy: make noise, then move away. A chase or stun cancels the relay opening.",
                  "Call out readiness before Hacker uses the terminal. The helper stays on SUPPORT PAD.",
                  "Revive within 20 seconds. At 100% alert, the mission fails.",
                  "There is no mission deadline. A disconnected player pauses LAN play for up to 30 seconds.",
                ].map((t) => (
                  <li key={t}>
                    <Lightbulb size={18} />
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <footer className="manual-footer">
          <span>FIELD MANUAL / {tab.toUpperCase()}</span>
          <button
            onClick={() =>
              setTab(
                tabs[
                  (tabs.findIndex((t) => t[0] === tab) + 1) % tabs.length
                ][0],
              )
            }
          >
            NEXT SECTION <ChevronRight size={16} />
          </button>
        </footer>
      </section>
    </main>
  );
}
