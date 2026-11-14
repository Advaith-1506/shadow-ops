import { updateMissionPlayer } from "../../src/lib/game/mission.js";

// Unit-test setup only. Full route tests use movement inputs from spawn instead.
export function position(p, target) {
  Object.assign(p, { x: target.x, y: target.y, missionCooldown: 0 });
}
export function interact(s, p) {
  updateMissionPlayer(s, p, { interact: true }, 0.05);
}
export function collectAccess(s) {
  const hacker = s.players.find((p) => p.role === "Hacker");
  const assassin = s.players.find((p) => p.role === "Assassin");
  const captain = s.guards.find(
    (g) => g.id === s.mission.config.anchors.captainId,
  );
  position(assassin, captain);
  updateMissionPlayer(s, assassin, { ability: true }, 0.05);
  position(hacker, s.mission.keys[0]);
  interact(s, hacker);
}
