import { describe, expect, it } from "vitest";
import { updatePressurePlates, updateLasers, updateGuards } from "../../src/lib/game/entityLogic";

function baseState() {
  return {
    alarm: 0,
    vaultUnlocked: false,
    walls: [],
    doors: [{ id: "door_vault", open: false, requiredBy: "vault_plate", x: 0, y: 0, w: 10, h: 10 }],
    crates: [],
    artifacts: [],
    pressurePlates: [{ id: "plate_vault", x: 10, y: 10, w: 20, h: 20, activated: false, group: "single" }],
    lasers: [{ id: "l1", x1: 0, y1: 0, x2: 100, y2: 0, active: true, disabledBy: "plate_vault" }],
    players: [{ id: 1, x: 20, y: 20, r: 10, downed: false, detected: 0, holding: null, nearPrompt: null, atVan: false }],
    guards: [],
    cameras: [],
    switches: [],
    vents: [],
  };
}

describe("entityLogic", () => {
  it("single-player vault plate latches unlock", () => {
    const s = baseState();
    updatePressurePlates(s); // player on plate
    expect(s.vaultUnlocked).toBe(true);
    expect(s.doors.find((d) => d.id === "door_vault").open).toBe(true);

    // move player off plate; latch remains in single-player
    s.players[0].x = 500;
    s.players[0].y = 500;
    updatePressurePlates(s);
    expect(s.vaultUnlocked).toBe(true);
    expect(s.doors.find((d) => d.id === "door_vault").open).toBe(true);
  });

  it("multiplayer vault is hold-based (no latch)", () => {
    const s = baseState();
    s.players.push({ id: 2, x: 200, y: 200, r: 10, downed: false, detected: 0, holding: null, nearPrompt: null, atVan: false });
    updatePressurePlates(s);
    expect(s.doors.find((d) => d.id === "door_vault").open).toBe(true);

    s.players[0].x = 500;
    s.players[0].y = 500;
    updatePressurePlates(s);
    expect(s.vaultUnlocked).toBe(false);
    expect(s.doors.find((d) => d.id === "door_vault").open).toBe(false);
  });

  it("single-player latched vault disables lasers permanently", () => {
    const s = baseState();
    updatePressurePlates(s);
    s.players[0].x = 500;
    s.players[0].y = 500;
    updateLasers(s, 0.1);
    expect(s.lasers[0].active).toBe(false);
  });

  it("guard can detect farther targets at high alarm", () => {
    const s = baseState();
    s.players[0] = { id: 1, x: 110, y: 100, r: 10, downed: false, detected: 0, holding: null, nearPrompt: null, atVan: false };
    s.guards = [{
      id: "g1",
      x: 0,
      y: 100,
      patrol: [{ x: 0, y: 100 }],
      patrolIdx: 0,
      mode: "patrol",
      alertTimer: 0,
      facing: 0,
    }];

    // low alarm -> out of base detect radius (~80), should not raise
    s.alarm = 0;
    updateGuards(s, 0.2);
    const lowAlarm = s.alarm;

    // high alarm -> dynamic radius increases, same target should raise alarm
    s.alarm = 90;
    s.guards[0].x = 0;
    s.guards[0].y = 100;
    updateGuards(s, 0.2);
    expect(s.alarm).toBeGreaterThan(90);
    expect(s.alarm).toBeGreaterThan(lowAlarm);
  });

  it("guard vision detects only in front, even at close range", () => {
    const s = baseState();
    s.players[0].x = 60;
    s.players[0].y = 100;
    s.guards = [{
      id: "g1",
      x: 100,
      y: 100,
      patrol: [{ x: 100, y: 100 }],
      patrolIdx: 0,
      mode: "patrol",
      alertTimer: 0,
      facing: 0,
    }];

    updateGuards(s, 0.1);
    expect(s.alarm).toBe(0);
    expect(s.players[0].detected).toBe(0);

    s.players[0].x = 140;
    updateGuards(s, 0.1);
    expect(s.alarm).toBeGreaterThan(0);
    expect(s.players[0].detected).toBeGreaterThan(0);
  });
});
