import { describe, it, expect } from "vitest";
import {
  createShadowState,
  updateMissionPlayer,
  missionStage,
} from "../../src/lib/game/mission.js";
import { updateGame } from "../../src/lib/game/gameLoop.js";
import { isWinConditionMet } from "../../src/lib/game/gameState.js";
import { updatePlayer } from "../../src/lib/game/playerLogic.js";
import {
  updateGuards,
  updateCameras,
  updateLasers,
} from "../../src/lib/game/entityLogic.js";
import {
  registerInputProvider,
  getLanInput,
} from "../../src/lib/game/input.js";
const fresh = () =>
  createShadowState([
    { id: 1, role: "Hacker" },
    { id: 2, role: "Assassin" },
  ]);
const interact = (s, p) => updateMissionPlayer(s, p, { interact: true }, 0.05);
const at = (p, o) => {
  p.x = o.x;
  p.y = o.y;
  p.missionCooldown = 0;
};
describe("Shadow Ops mission and authority", () => {
  it("rejects remote key collection and vault shortcut", () => {
    const s = fresh(),
      p = s.players[0];
    interact(s, p);
    expect(s.mission.keys.every((k) => !k.collected)).toBe(true);
    at(p, s.artifacts[0]);
    interact(s, p);
    expect(p.holding).toBeNull();
    at(p, s.mission.lock);
    interact(s, p);
    expect(s.vaultUnlocked).toBe(false);
  });
  it("requires both keys and different roles at terminal and support pad", () => {
    const s = fresh(),
      [p, q] = s.players;
    at(p, s.mission.terminal);
    at(q, s.mission.support);
    interact(s, p);
    expect(s.mission.securityOff).toBe(false);
    s.mission.keys.forEach((k) => (k.collected = true));
    q.role = "Hacker";
    interact(s, p);
    expect(s.mission.securityOff).toBe(false);
    q.role = "Assassin";
    q.x += 100;
    interact(s, p);
    expect(s.mission.securityOff).toBe(false);
    at(q, s.mission.support);
    interact(s, p);
    expect(s.mission.securityOff).toBe(true);
  });
  it("progresses through complete cooperative mission and all-player extraction", () => {
    const s = fresh(),
      [p, q] = s.players;
    for (const k of s.mission.keys) {
      at(p, k);
      interact(s, p);
      expect(k.collected).toBe(true);
    }
    at(p, s.mission.terminal);
    at(q, s.mission.support);
    interact(s, p);
    expect(s.mission.securityOff).toBe(true);
    at(p, s.mission.lock);
    interact(s, p);
    expect(s.vaultUnlocked).toBe(true);
    at(p, s.artifacts[0]);
    interact(s, p);
    expect(p.holding.id).toBe("art_crown");
    p.atVan = true;
    q.atVan = false;
    expect(isWinConditionMet(s)).toBe(false);
    q.atVan = true;
    expect(isWinConditionMet(s)).toBe(true);
    q.downed = true;
    expect(isWinConditionMet(s)).toBe(false);
    q.downed = false;
    at(p, { x: s.van.x + s.van.w / 2, y: s.van.y + s.van.h / 2 });
    interact(s, p);
    expect(s.loot).toHaveLength(1);
    expect(isWinConditionMet(s)).toBe(true);
  });
  it("never allows interaction through walls", () => {
    const s = fresh(),
      p = s.players[0],
      k = s.mission.keys[0];
    at(p, { x: k.x + 30, y: k.y });
    s.walls.push({ x: k.x + 10, y: k.y - 50, w: 10, h: 100 });
    interact(s, p);
    expect(k.collected).toBe(false);
  });
  it("enforces assassin range and cooldown while preserving guard patrols", () => {
    const s = fresh(),
      p = s.players[1],
      g = s.guards[0];
    s.guards = [g];
    at(p, { x: 300, y: 600 });
    g.x = 400;
    g.y = 600;
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(p.abilityCooldown).toBe(0);
    g.x = 330;
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(g.stunned).toBe(10);
    g.stunned = 0;
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(g.stunned).toBe(0);
    p.abilityCooldown = 0;
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(g.stunned).toBe(10);
    const x = g.x;
    updateGuards(s, 1);
    expect(g.x).toBe(x);
    expect(g.stunned).toBe(9);
  });
  it("hacker camera suppression expires and cannot spam", () => {
    const s = fresh(),
      p = s.players[0];
    s.walls = [];
    s.cameras = [{ ...s.cameras[0], x: 100, y: 100 }];
    at(p, { x: 120, y: 100 });
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(s.cameras[0].disabled).toBe(10);
    updateCameras(s, 1);
    expect(s.cameras[0].disabled).toBe(9);
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(s.cameras[0].disabled).toBe(9);
  });
  it("scout scanning has finite duration and cooldown", () => {
    const s = fresh(),
      p = s.players[0];
    p.role = "Scout";
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(p.scanTime).toBe(6);
    expect(p.abilityCooldown).toBe(18);
    updateMissionPlayer(s, p, { ability: true }, 1);
    expect(p.scanTime).toBe(5);
    expect(p.abilityCooldown).toBe(17);
  });
  it("security shutdown disables cameras and lasers", () => {
    const s = fresh();
    s.mission.securityOff = true;
    const a = s.alarm;
    updateCameras(s, 1);
    updateLasers(s, 1);
    expect(s.alarm).toBe(a);
    expect(s.lasers.every((l) => !l.active)).toBe(true);
  });
  it("movement is normalized and never exceeds configured speed", () => {
    const s = fresh(),
      p = s.players[0];
    s.walls = [];
    s.doors = [];
    s.crates = [];
    s.players = [p];
    at(p, { x: 100, y: 100 });
    updatePlayer(
      p,
      { right: true, down: true, speed: 99999, x: 5000 },
      s,
      1 / 30,
    );
    expect(Math.hypot(p.x - 100, p.y - 100)).toBeLessThanOrEqual(
      p.baseSpeed / 30,
    );
  });
  it("the simulation declares victory and scores a carried artifact at extraction", () => {
    const s = fresh();
    s.mission.keys.forEach((k) => (k.collected = true));
    s.mission.securityOff = true;
    s.vaultUnlocked = true;
    s.artifacts[0].pickedUp = true;
    s.players[0].holding = { ...s.artifacts[0] };
    s.players.forEach((p, i) => {
      p.x = s.van.x + s.van.w / 2 + (i ? 18 : -18);
      p.y = s.van.y + s.van.h / 2;
    });
    updateGame(s, 1 / 30, { 1: {}, 2: {} });
    expect(s.screen).toBe("win");
    expect(s.score).toBe(500);
  });
  it("alert causes loss independently of elapsed mission time", () => {
    const s = fresh();
    s.elapsedTime = 60 * 60;
    updateGame(s, 1 / 30, {});
    expect(s.screen).toBe("playing");
    s.alarm = 100;
    updateGame(s, 1 / 30, {});
    expect(s.screen).toBe("loss");
  });
  it("supports duplicate roles for four players", () => {
    const s = createShadowState([
      { id: 1, role: "Hacker" },
      { id: 2, role: "Assassin" },
      { id: 3, role: "Scout" },
      { id: 4, role: "Scout" },
    ]);
    expect(s.players.map((p) => p.role)).toEqual([
      "Hacker",
      "Assassin",
      "Scout",
      "Scout",
    ]);
    expect(missionStage(s)).toMatch(/keys/);
  });
  it("revives close teammates but not remote ones", () => {
    const s = fresh(),
      [p, q] = s.players;
    s.walls = [];
    q.downed = true;
    q.reviveProgress = 0;
    at(p, { x: 100, y: 100 });
    at(q, { x: 200, y: 100 });
    updateMissionPlayer(s, p, { interact: true }, 2);
    expect(q.downed).toBe(true);
    q.x = 120;
    updateMissionPlayer(s, p, { interact: true }, 2);
    expect(q.downed).toBe(false);
  });
  it("revives a teammate captured on the live safehouse floor", () => {
    const s = fresh(),
      [p, q] = s.players;
    // Capture in the open living-room lane: clear LOS, no furniture between.
    at(q, { x: 560, y: 250 });
    q.downed = true;
    q.custodyTimer = 20;
    q.reviveProgress = 0;
    at(p, { x: 560, y: 268 });
    updateMissionPlayer(s, p, { interact: true }, 1);
    expect(q.downed).toBe(true);
    expect(q.reviveProgress).toBeGreaterThan(0);
    updateMissionPlayer(s, p, { interact: true }, 1.1);
    expect(q.downed).toBe(false);
    expect(q.custodyTimer).toBe(0);
  });
  it("accepts removable gesture input without a webcam dependency", () => {
    const remove = registerInputProvider("gesture", () => ({
      left: true,
      ability: true,
    }));
    expect(getLanInput().left).toBe(true);
    expect(getLanInput().ability).toBe(true);
    remove();
    expect(!!getLanInput().left).toBe(false);
  });
});
