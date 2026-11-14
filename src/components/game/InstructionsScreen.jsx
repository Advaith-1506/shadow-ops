import React from "react";
export default function InstructionsScreen({ onBack }) {
  return (
    <main className="ops-shell ops-lobby">
      <section className="ops-panel">
        <p className="ops-eyebrow">SHADOW OPS / MISSION BRIEFING</p>
        <h1>ENTER UNSEEN. LEAVE TOGETHER.</h1>
        <ol
          className="ops-copy"
          style={{ listStyle: "decimal", paddingLeft: 20 }}
        >
          <li>
            Collect ALPHA in Gallery A and BRAVO in Gallery B. Green markers on
            the overview show keys.
          </li>
          <li>
            Bring a Hacker to the blue terminal in the lobby. A teammate with a
            different role must stand on the purple support pad beside it. Press
            E at the terminal to disable cameras and lasers.
          </li>
          <li>
            Interact with the vault lock at its north entrance, then enter and
            collect the Crown Jewel.
          </li>
          <li>
            Return every operative and the artifact to the extraction van in the
            south courtyard.
          </li>
        </ol>
        <p className="ops-copy">
          Move with WASD or arrows. E / Enter: interact or hold to revive. Q:
          role ability. Assassin stuns a nearby guard for 5s (12s cooldown).
          Hacker disables a nearby camera for 10s or unlocks a side door (16s
          cooldown). Scout highlights nearby threats for 6s (18s cooldown).
        </p>
        <p className="ops-copy">
          Local co-op: P1 Hacker uses WASD / E / Q. P2 Assassin uses arrows /
          Enter / slash. P3 Scout uses T/F/G/H / R / Y. P4 Hacker uses I/J/K/L /
          O / P. ESC pauses local play. LAN play runs continuously on the
          server. Touch controls operate your LAN player or local P1.
        </p>
        <p className="ops-copy">
          Avoid vision cones, use walls for cover, and revive captured teammates
          before 20 seconds elapse. Lockdown at 100% alert or the ten-minute
          deadline ends the mission. A disconnected teammate freezes LAN play
          for up to 30 seconds.
        </p>
        <button onClick={onBack}>← RETURN TO COMMAND</button>
      </section>
    </main>
  );
}
