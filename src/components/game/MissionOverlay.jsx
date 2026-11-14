import React from "react";
import { objectiveSummary } from "@/lib/game/mission";
export default function MissionOverlay({ state, shared = false }) {
  if (!state?.mission) return null;
  const latest = state.events?.at(-1);
  return (
    <aside className={`mission-overlay ${shared ? "shared-objectives" : ""}`}>
      <details open={shared}>
        <summary>MISSION PROGRESS</summary>
        <div className="objective-list">
          {objectiveSummary(state).map((o) => (
            <span key={o.id} className={o.status}>
              {o.status === "complete"
                ? "✓"
                : o.status === "blocked"
                  ? "○"
                  : "→"}{" "}
              {o.label}
            </span>
          ))}
        </div>
      </details>
      {latest && state.elapsedTime - latest.at < 5 && (
        <p role="status" className="mission-toast">
          {latest.text} · {latest.by}
        </p>
      )}
    </aside>
  );
}
