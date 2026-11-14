import { createGameState } from "./gameState.js";
import { dist, lineBlockedByRects } from "./collision.js";
export const ROLES = ["Assassin", "Hacker", "Scout"];
export const COOLDOWNS = { Assassin: 12, Hacker: 16, Scout: 18 };
export function createShadowState(roster) {
  const s = createGameState(roster.length);
  s.screen = "playing";
  s.tutorialTimer = 0;
  s.players.forEach((p, i) => {
    p.id = roster[i].id;
    p.role = roster[i].role;
    p.label = p.role;
    p.baseSpeed = 140;
    p.abilityCooldown = 0;
    p.scanTime = 0;
  });
  s.artifacts = s.artifacts.filter((a) => a.id === "art_crown");
  s.mission = {
    keys: [
      { id: "ALPHA", x: 320, y: 224, collected: false },
      { id: "BRAVO", x: 960, y: 200, collected: false },
    ],
    terminal: { x: 1100, y: 1000 },
    support: { x: 1200, y: 1000 },
    lock: { x: 1020, y: 510 },
    securityOff: false,
    message: "Collect ALPHA and BRAVO access keys",
  };
  return s;
}
function near(s, p, target, range = 52) {
  return (
    dist(p.x, p.y, target.x, target.y) <= range &&
    !lineBlockedByRects(p.x, p.y, target.x, target.y, s.walls)
  );
}
export function missionStage(s) {
  const m = s.mission;
  if (!m.keys.every((k) => k.collected)) return "Collect two access keys";
  if (!m.securityOff) return "Hacker: terminal + teammate: support pad";
  if (!s.vaultUnlocked) return "Unlock vault at entrance";
  if (!s.artifacts[0].pickedUp && !s.loot.length)
    return "Collect the Crown Jewel";
  return "Entire team: return to extraction van";
}
export function updateMissionPlayer(s, p, input, dt) {
  p.abilityCooldown = Math.max(0, (p.abilityCooldown || 0) - dt);
  p.scanTime = Math.max(0, (p.scanTime || 0) - dt);
  if (p.downed) return;
  const m = s.mission;
  p.nearPrompt = null;
  if (input.ability && p.abilityCooldown <= 0) {
    let used = false;
    if (p.role === "Assassin") {
      const g = s.guards.find((g) => near(s, p, g, 62) && !(g.stunned > 0));
      if (g) {
        g.stunned = 5;
        used = true;
      }
    }
    if (p.role === "Hacker") {
      const c = s.cameras.find((c) => near(s, p, c, 100) && !(c.disabled > 0));
      if (c) {
        c.disabled = 10;
        used = true;
      }
      const d = s.doors.find(
        (d) =>
          d.id !== "door_vault" &&
          !d.open &&
          near(s, p, { x: d.x + d.w / 2, y: d.y + d.h / 2 }, 65),
      );
      if (d) {
        d.open = true;
        d.requiredBy = null;
        used = true;
      }
    }
    if (p.role === "Scout") {
      p.scanTime = 6;
      used = true;
    }
    if (used) p.abilityCooldown = COOLDOWNS[p.role];
  }
  const downed = s.players.find(
    (q) => q.id !== p.id && q.downed && near(s, p, q, 38),
  );
  if (downed) {
    p.nearPrompt = { text: "Hold E: revive teammate", warn: false };
    if (input.interact) downed.reviveProgress += dt;
    if (downed.reviveProgress >= 2) {
      downed.downed = false;
      downed.custodyTimer = 0;
      downed.reviveProgress = 0;
      downed.detected = 0;
    }
    return;
  }
  let action = null,
    prompt = "";
  const key = m.keys.find((k) => !k.collected && near(s, p, k));
  if (key) {
    prompt = "Collect key " + key.id;
    action = () => {
      key.collected = true;
    };
  } else if (!m.securityOff && near(s, p, m.terminal)) {
    const helper = s.players.find(
      (q) =>
        q.id !== p.id &&
        q.role !== "Hacker" &&
        !q.downed &&
        near(s, q, m.support, 44),
    );
    const valid =
      p.role === "Hacker" && m.keys.every((k) => k.collected) && helper;
    prompt = valid
      ? "Disable security"
      : "Need two keys, Hacker + different role on support pad";
    if (valid)
      action = () => {
        m.securityOff = true;
      };
  } else if (!s.vaultUnlocked && near(s, p, m.lock)) {
    prompt = m.securityOff ? "Unlock vault" : "Disable security first";
    if (m.securityOff)
      action = () => {
        s.vaultUnlocked = true;
        s.doors.find((d) => d.id === "door_vault").open = true;
      };
  } else if (
    s.vaultUnlocked &&
    !s.artifacts[0].pickedUp &&
    near(s, p, s.artifacts[0], 38)
  ) {
    prompt = "Collect Crown Jewel";
    action = () => {
      s.artifacts[0].pickedUp = true;
      p.holding = { ...s.artifacts[0] };
    };
  } else if (p.atVan && p.holding) {
    prompt = "Secure artifact";
    action = () => {
      s.loot.push(p.holding);
      p.holding = null;
    };
  }
  if (prompt) p.nearPrompt = { text: "[E] " + prompt, warn: !action };
  if (input.interact && (p.missionCooldown || 0) <= 0 && action) {
    action();
    p.missionCooldown = 0.4;
  }
  p.missionCooldown = Math.max(0, (p.missionCooldown || 0) - dt);
  m.message = missionStage(s);
}
