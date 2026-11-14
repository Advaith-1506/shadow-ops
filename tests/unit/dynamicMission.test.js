import { describe, expect, it } from "vitest";
import {
  createMissionConfig,
  validateComposition,
  requiredMissionsComplete,
} from "../../src/lib/game/missionConfig.js";
import {
  createShadowState,
  updateMissionPlayer,
  observeMissionEvents,
  updateMissionWorld,
  currentRolePrompt,
} from "../../src/lib/game/mission.js";
import { updateGuards } from "../../src/lib/game/entityLogic.js";
import { LEVEL } from "../../src/lib/game/mapData.js";
import { computeGuardPath } from "../../src/lib/game/guardNav.js";
import { circleOverlapsRect } from "../../src/lib/game/collision.js";
import {
  collectAccess,
  position,
  interact,
} from "../helpers/missionActions.js";
const roster = (roles) => roles.map((role, i) => ({ id: i + 1, role }));
const fresh = (extra) =>
  createShadowState(roster(["Hacker", "Assassin", ...extra]));
const objective = (s, id) => s.mission.objectives.find((o) => o.id === id);

describe("fixed composition and mission generation", () => {
  it.each([
    [["Hacker", "Assassin"], true],
    [["Hacker", "Scout"], false],
    [["Assassin", "Decoy"], false],
    [["Hacker", "Hacker"], false],
    [["Hacker", "Assassin", "Scout"], true],
    [["Hacker", "Assassin", "Decoy"], true],
    [["Hacker", "Scout", "Decoy"], false],
    [["Hacker", "Assassin", "Assassin"], false],
    [["Hacker", "Assassin", "Scout", "Decoy"], true],
    [["Hacker", "Assassin", "Scout", "Scout"], false],
    [[], false],
    [["Hacker"], false],
  ])("validates %j: %s", (roles, valid) =>
    expect(validateComposition(roles).valid).toBe(valid),
  );
  it("reports missing and duplicate roles", () => {
    expect(
      validateComposition(["Hacker", "Scout", "Scout", "Decoy"]),
    ).toMatchObject({ missing: ["Assassin"], duplicates: ["Scout"] });
  });
  it.each([[], ["Scout"], ["Decoy"], ["Scout", "Decoy"]])(
    "generates deterministic immutable config for extra roles %j",
    (...extra) => {
      // Vitest spreads array rows; normalize the parameterized extra roles.
      const roles = extra.filter(Boolean),
        r = roster(["Hacker", "Assassin", ...roles]);
      const a = createMissionConfig(r, LEVEL),
        b = createMissionConfig(r, LEVEL);
      expect(a).toEqual(b);
      expect(Object.isFrozen(a.anchors)).toBe(true);
      expect(() => a.objectives[0].prerequisites.push("forged")).toThrow();
      expect(a.mandatory.includes("recon")).toBe(roles.includes("Scout"));
      expect(a.mandatory.includes("checkpoint")).toBe(roles.includes("Decoy"));
      expect(!!a.anchors.reconZone).toBe(roles.includes("Scout"));
      expect(!!a.anchors.checkpoint).toBe(roles.includes("Decoy"));
      expect(
        a.objectives.every(
          (o) => o.condition && o.visibility && o.requiredRole,
        ),
      ).toBe(true);
    },
  );
  it("rejects duplicate participant IDs", () =>
    expect(() =>
      createMissionConfig(
        [
          { id: 1, role: "Hacker" },
          { id: 1, role: "Assassin" },
        ],
        LEVEL,
      ),
    ).toThrow(/identity/));
});

describe("authoritative role events and gates", () => {
  it("requires an assigned Assassin, real target, valid range and fresh cooldown", () => {
    const s = fresh([]),
      [h, a] = s.players,
      g = s.guards.find((g) => g.id === "g6");
    position(h, g);
    updateMissionPlayer(s, h, { ability: true, interact: true }, 0.01);
    expect(objective(s, "credential").status).toBe("available");
    position(a, { x: g.x - 100, y: g.y });
    updateMissionPlayer(s, a, { ability: true }, 0.01);
    expect(g.stunned || 0).toBe(0);
    position(a, g);
    a.abilityCooldown = 1;
    updateMissionPlayer(s, a, { ability: true }, 0.01);
    expect(objective(s, "credential").status).toBe("available");
    a.abilityCooldown = 0;
    updateMissionPlayer(s, a, { ability: true }, 0.01);
    expect(g.stunned).toBe(20);
    expect(objective(s, "credential")).toMatchObject({
      status: "complete",
      completedBy: a.id,
    });
    expect(s.mission.keys[1].collected).toBe(true);
  });
  it("does not award captain credentials for a different guard or ordinary pickup", () => {
    const s = fresh([]),
      a = s.players[1],
      other = s.guards.find((g) => g.id === "g3");
    position(a, s.mission.keys[1]);
    interact(s, a);
    expect(s.mission.keys[1].collected).toBe(false);
    position(a, other);
    updateMissionPlayer(s, a, { ability: true }, 0.01);
    expect(other.stunned).toBe(10);
    expect(objective(s, "credential").status).toBe("available");
  });
  it("requires assigned Hacker for electronic access and rejects role mutation", () => {
    const s = fresh([]),
      [h, a] = s.players;
    position(a, s.mission.keys[0]);
    interact(s, a);
    expect(s.mission.keys[0].collected).toBe(false);
    a.role = "Hacker";
    interact(s, a);
    expect(s.mission.keys[0].collected).toBe(false);
    position(h, s.mission.keys[0]);
    interact(s, h);
    expect(objective(s, "electronic_key").completedBy).toBe(h.id);
    expect(requiredMissionsComplete(s)).toBe(false);
  });
  it("requires Scout pulse in the real zone, radius, LOS and cooldown", () => {
    const s = fresh(["Scout"]),
      p = s.players[2],
      h = s.players[0];
    position(h, s.mission.config.anchors.reconZone);
    interact(s, h);
    expect(s.mission.recon.discovered).toBe(false);
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(p.scanTime).toBe(6);
    expect(s.mission.recon.discovered).toBe(false);
    position(p, s.mission.config.anchors.reconZone);
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(s.mission.recon.discovered).toBe(false);
    p.abilityCooldown = 0;
    position(p, { x: 257, y: 380 });
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(s.mission.recon.discovered).toBe(false); // node is >120px away
    p.abilityCooldown = 0;
    position(p, s.mission.config.anchors.reconZone);
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(s.mission.recon.discovered).toBe(true);
    expect(objective(s, "recon")).toMatchObject({
      status: "complete",
      completedBy: p.id,
      visibility: "visible",
    });
    expect(s.mission.objectives.find((o) => o.id === "security").status).toBe(
      "locked",
    );
  });
  it("blocks vault, terminal and forged legacy key flags until selected roles contribute", () => {
    const s = fresh(["Scout", "Decoy"]),
      [h, a] = s.players;
    collectAccess(s);
    position(h, s.mission.terminal);
    position(a, s.mission.support);
    interact(s, h);
    expect(s.mission.securityOff).toBe(false);
    position(h, s.mission.lock);
    interact(s, h);
    expect(s.vaultUnlocked).toBe(false);
    expect(currentRolePrompt(s, s.players[2])).toMatch(/Scout/);
    expect(objective(s, "checkpoint").status).toBe("locked");
  });
  it("uses actual sentry investigation/path movement and two contributors for checkpoint", () => {
    const s = fresh(["Decoy"]),
      [h, a, d] = s.players;
    collectAccess(s);
    position(h, { x: 128, y: 708 });
    position(a, { x: 176, y: 708 });
    position(d, { x: 840, y: 430 });
    updateMissionPlayer(s, d, { ability: true }, 0.01);
    position(d, { x: 840, y: 560 }); // unit fixture: Decoy leaves the noise; live routes move with inputs
    const g = s.guards.find((g) => g.id === "g2"),
      origin = { x: g.x, y: g.y };
    for (let i = 0; i < 100 && !s.mission.checkpoint.windowRemaining; i++) {
      updateMissionWorld(s, 1 / 30);
      updateGuards(s, 1 / 30);
      observeMissionEvents(s, 1 / 30);
    }
    expect(g.mode).toBe("investigate");
    expect(g.path.length).toBeGreaterThan(1);
    expect(Math.hypot(g.x - origin.x, g.y - origin.y)).toBeGreaterThanOrEqual(
      28,
    );
    expect(s.mission.checkpoint.windowRemaining).toBeGreaterThan(0);
    expect(currentRolePrompt(s, h)).toMatch(/RELAY OPEN.*INTERACT/);
    position(h, s.mission.config.anchors.checkpoint);
    g.stunned = 1;
    interact(s, h);
    expect(s.mission.checkpoint.cleared).toBe(false);
    g.stunned = 0;
    interact(s, h);
    expect(s.mission.checkpoint.cleared).toBe(true);
    expect(objective(s, "checkpoint").completedBy).toBe(d.id);
    expect(
      objective(s, "checkpoint").contributions.map((c) => c.playerId),
    ).toEqual([d.id, h.id]);
  });
  it("cannot complete checkpoint by stunning sentry, using remote noise or faking window alone", () => {
    const s = fresh(["Decoy"]),
      [h, , d] = s.players;
    collectAccess(s);
    updateMissionPlayer(s, d, { ability: true }, 0.01);
    expect(s.distractions[0].checkpointAttempt).toBe(false);
    position(h, s.mission.config.anchors.checkpoint);
    interact(s, h);
    expect(s.mission.checkpoint.cleared).toBe(false);
    s.mission.checkpoint.windowRemaining = 10;
    interact(s, h);
    expect(s.mission.checkpoint.cleared).toBe(false);
  });
  it("keeps all objective anchors on reachable floor with original patrols", () => {
    const s = fresh(["Scout", "Decoy"]),
      anchors = s.mission.config.anchors;
    for (const point of [
      anchors.reconZone,
      anchors.hiddenNode,
      anchors.checkpoint,
      anchors.distractionZone,
      s.mission.terminal,
      s.mission.support,
    ]) {
      expect(
        s.walls.some((r) =>
          circleOverlapsRect(point.x, point.y, 10, r.x, r.y, r.w, r.h),
        ),
      ).toBe(false);
      expect(
        computeGuardPath(s, 128, 708, point.x, point.y).length,
      ).toBeGreaterThan(1);
    }
    for (const id of [anchors.captainId, anchors.checkpointGuardId])
      expect(s.guards.find((g) => g.id === id).patrol.length).toBeGreaterThan(
        1,
      );
  });
});
