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
            Collect ALPHA in the Kitchen and BRAVO in the Study. Green markers
            show the keys on the full-level view.
          </li>
          <li>
            Bring a Hacker to the blue terminal in the Security room. A teammate
            with a different role must stand on the purple support pad beside
            it. Press E at the terminal to disable cameras and lasers.
          </li>
          <li>
            Interact with the vault lock in the Living Room, then enter and
            collect the Diamond.
          </li>
          <li>
            Return every operative and the artifact to the extraction van in the
            front yard.
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
          Enter / slash. P3 Scout uses T/F/G/H / R / Y. P4 Decoy uses I/J/K/L /
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
