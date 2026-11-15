import React from "react";
import {
  createMissionConfig,
  validateComposition,
} from "@/lib/game/missionConfig";
import { LEVEL } from "@/lib/game/mapData";
export default function MissionBriefing({ players }) {
  const valid = validateComposition(players).valid;
  const config = valid ? createMissionConfig(players, LEVEL) : null;
  return (
    <section
      className="mission-briefing tactical-card"
      aria-label="Mission briefing"
    >
      <div className="section-label">
        <span>MISSION BRIEFING</span>
        <span>{players.length} OPERATIVES</span>
      </div>
      <h2>{config?.variant || "BUILD YOUR SQUAD"}</h2>
      <p className="ops-copy">
        Maple Row Safehouse · Recover the Diamond. Every operative extracts.
      </p>
      <div className="briefing-roles">
        {players.map((p) => (
          <span key={p.id}>{p.role}</span>
        ))}
      </div>
      {config ? (
        <details>
          <summary>VIEW MISSION OBJECTIVES</summary>
          <ol>
            {config.objectives.map((o) => (
              <li key={o.id}>
                <span aria-hidden="true">◇</span>
                {o.label.replace(
                  "Team: collect both keys (0/2)",
                  "Collect ALPHA (Kitchen) + BRAVO (Study)",
                )}
              </li>
            ))}
          </ol>
        </details>
      ) : (
        <p className="ops-copy">
          Choose Hacker + Assassin for Duo. Add Scout or Decoy for Trio, or both
          for Full Squad.
        </p>
      )}
    </section>
  );
}
