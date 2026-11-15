import { it, expect } from "vitest";
import {
  createShadowState,
  updateMissionPlayer,
} from "../../src/lib/game/mission.js";
import { updateCameras } from "../../src/lib/game/entityLogic.js";
import { updatePlayer } from "../../src/lib/game/playerLogic.js";
import { getSolids } from "../../src/lib/game/gameState.js";
import {
  position,
  interact,
  collectAccess,
} from "../helpers/missionActions.js";
const fresh = () =>
  createShadowState(
    ["Hacker", "Assassin", "Scout", "Decoy"].map((role, i) => ({
      id: i + 1,
      role,
    })),
  );
it.each(["Hacker", "Assassin", "Scout", "Decoy"])(
  "%s collects either of exactly two shared keys without duplication",
  (role) => {
    const s = fresh(),
      p = s.players.find((p) => p.role === role);
    expect(s.mission.keys.map((k) => k.id)).toEqual(["ALPHA", "BRAVO"]);
    for (const k of s.mission.keys) {
      position(p, k);
      interact(s, p);
      expect(k.collected).toBe(true);
      interact(s, p);
    }
    expect(p.stats.keys).toBe(2);
    expect(
      s.mission.objectives.find((o) => o.id === "shared_keys").status,
    ).toBe("complete");
    expect(
      s.mission.objectives.find((o) => o.id === "credential").status,
    ).not.toBe("complete");
  },
);
it.each(["Assassin", "Scout", "Decoy"])(
  "%s cannot perform Hacker door/network actions",
  (role) => {
    const s = fresh(),
      p = s.players.find((p) => p.role === role),
      door = s.doors.find((d) => d.id === "door_pantry"),
      cam = s.cameras.find((c) => c.id === "cam_living");
    position(p, { x: 380, y: 350 });
    updateMissionPlayer(s, p, { ability: true, interact: true }, 0.01);
    expect(door.open).toBe(false);
    p.abilityCooldown = 0;
    position(p, { x: cam.x + 20, y: cam.y });
    updateMissionPlayer(s, p, { ability: true, interact: true }, 0.01);
    expect(s.mission.cameraNetworkOff).not.toBe(true);
  },
);
it("Hacker must really open the door and disable the designated network; effects persist", () => {
  const s = fresh(),
    p = s.players[0],
    door = s.doors.find((d) => d.id === "door_pantry");
  expect(getSolids(s)).toContain(door);
  position(p, { x: 380, y: 350 });
  for (let i = 0; i < 20; i++) updatePlayer(p, { up: true }, s, 1 / 30);
  expect(p.y).toBeGreaterThanOrEqual(334);
  position(p, { x: 380, y: 350 });
  updateMissionPlayer(s, p, { ability: true }, 0.01);
  expect(door.open).toBe(true);
  expect(getSolids(s)).not.toContain(door);
  for (let i = 0; i < 20; i++) updatePlayer(p, { up: true }, s, 1 / 30);
  expect(p.y).toBeLessThan(304);
  expect(
    s.mission.objectives.find((o) => o.id === "electronic_door").status,
  ).toBe("complete");
  expect(
    s.mission.objectives.find((o) => o.id === "camera_network").status,
  ).not.toBe("complete");
  p.abilityCooldown = 0;
  position(p, { x: 546, y: 300 });
  updateMissionPlayer(s, p, { ability: true }, 0.01);
  expect(s.mission.cameraNetworkOff).toBe(true);
  const alarm = s.alarm;
  updateCameras(s, 100);
  expect(s.alarm).toBe(alarm);
  expect(
    s.mission.objectives.find((o) => o.id === "camera_network").status,
  ).toBe("complete");
});
it("shared key completion alone cannot bypass Hacker, Assassin or selected optional roles", () => {
  const s = fresh();
  for (const k of s.mission.keys) {
    position(s.players[2], k);
    interact(s, s.players[2]);
  }
  position(s.players[0], s.mission.lock);
  interact(s, s.players[0]);
  expect(s.vaultUnlocked).toBe(false);
});

it.each(["electronic_door", "camera_network"])(
  "Hacker %s objective requires fresh in-range System Override",
  (id) => {
    const s = fresh(),
      p = s.players[0];
    updateMissionPlayer(s, p, { ability: true, interact: true }, 0.01);
    expect(s.mission.objectives.find((o) => o.id === id).status).toBe(
      "available",
    );
    position(
      p,
      id === "electronic_door" ? { x: 380, y: 350 } : { x: 546, y: 300 },
    );
    p.abilityCooldown = 1;
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(s.mission.objectives.find((o) => o.id === id).status).toBe(
      "available",
    );
    p.abilityCooldown = 0;
    updateMissionPlayer(s, p, { ability: true }, 0.01);
    expect(s.mission.objectives.find((o) => o.id === id).status).toBe(
      "complete",
    );
  },
);
