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
            Hacker activates ALPHA in the Kitchen. Assassin uses Silent Takedown
            on the marked security captain in the Garage to recover BRAVO.
          </li>
          <li>
            If Scout is selected, pulse from the Garage recon zone. If Decoy is
            selected, use Noise Maker in the marked zone after access
            objectives, move away, and have Hacker/Assassin interact at the
            checkpoint during the opening. Then bring Hacker to the blue
            terminal in Security. A teammate with a different role must stand on
            the purple support pad beside it. Press E at the terminal to disable
            cameras and lasers.
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
          role ability. Assassin stuns a nearby guard for 10s (captain: 20s; 12s
          cooldown). Hacker disables a nearby camera for 10s or unlocks a side
          door (16s cooldown). Scout discovers the hidden node and highlights
          threats for 6s (18s cooldown). Decoy noise lasts 5s normally or 12s at
          an active checkpoint (16s cooldown).
        </p>
        <p className="ops-copy">
          Local co-op: P1 Hacker uses WASD / E / Q. P2 Assassin uses arrows /
          Enter / slash. P3 Scout uses T/F/G/H / R / Y. P4 Decoy uses I/J/K/L /
          O / P. ESC pauses local play. LAN play runs continuously on the
          server. Touch controls operate your LAN player or local P1.
        </p>
        <p className="ops-copy">
          Avoid vision cones, use walls for cover, and revive captured teammates
          before 20 seconds elapse. Lockdown at 100% alert ends the mission. A
          disconnected teammate freezes LAN play for up to 30 seconds.
        </p>
        <button onClick={onBack}>← RETURN TO COMMAND</button>
      </section>
    </main>
  );
}
