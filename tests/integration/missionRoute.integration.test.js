import { describe, expect, it } from "vitest";
import { runLiveMission } from "../helpers/liveMissionDriver.js";

describe("complete dynamic missions with active guards and real button inputs", () => {
  it.each([
    [["Hacker", "Assassin"]],
    [["Hacker", "Assassin", "Scout"]],
    [["Hacker", "Assassin", "Decoy"]],
    [["Hacker", "Assassin", "Scout", "Decoy"]],
  ])(
    "wins with %j from spawn to all-player extraction",
    (roles) => {
      const s = runLiveMission(roles);
      expect(s.screen).toBe("win");
      expect(s.alarm).toBeLessThan(100);
      expect(s.timer).toBeGreaterThan(0);
      expect(s.players.every((p) => p.atVan && !p.downed)).toBe(true);
      expect(s.mission.objectives.every((o) => o.status === "complete")).toBe(
        true,
      );
      expect(
        s.mission.objectives.find((o) => o.id === "security").contributions,
      ).toHaveLength(2);
      expect(s.guards).toHaveLength(6);
      expect(
        s.players.find((p) => p.role === "Assassin").stats.takedowns,
      ).toBeGreaterThan(0);
      if (roles.includes("Scout"))
        expect(s.mission.recon.discovered).toBe(true);
      if (roles.includes("Decoy")) {
        expect(s.mission.checkpoint.observedMovement).toBeGreaterThanOrEqual(
          28,
        );
        expect(
          s.mission.objectives.find((o) => o.id === "checkpoint").contributions,
        ).toHaveLength(2);
      }
    },
    120000,
  );
});
