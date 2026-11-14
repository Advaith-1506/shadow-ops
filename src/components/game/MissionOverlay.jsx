import React from "react";
import { objectiveSummary } from "@/lib/game/mission";
export default function MissionOverlay({ state, shared = false }) {
  if (!state?.mission) return null;
  const latest = state.events?.at(-1);
  return (
    <aside className={`mission-overlay ${shared ? "shared-objectives" : ""}`}>
      <details>
        <summary>
          {state.mission.config?.variant || "MISSION PROGRESS"} ·{" "}
          {state.mission.objectives?.filter((o) => o.status === "complete")
            .length || 0}
          /{state.mission.objectives?.length || 0}
        </summary>
        <div className="objective-list">
          {objectiveSummary(state).map((o) => (
            <span key={o.id} className={o.status}>
              {o.status === "complete"
                ? "✓"
                : o.status === "blocked"
                  ? "○"
                  : "→"}{" "}
              {o.label}
              {o.phase === "locked"
                ? " · LOCKED"
                : o.phase === "in_progress"
                  ? " · IN PROGRESS"
                  : ""}
            </span>
          ))}
        </div>
      </details>
      {latest && state.timer > latest.at - 5 && (
        <p role="status" className="mission-toast">
          {latest.text} · {latest.by}
        </p>
      )}
    </aside>
  );
}
