/*
 * GAME STATE FACTORY  –  Museum Break
 * Creates a fresh, deep-cloned game state from the map data templates.
 * All mutable game objects live here; the game loop modifies them in-place
 * and the React component re-renders by spreading the top-level object.
 */

import {
  P1_BASE_SPEED,
  P2_BASE_SPEED,
  PLAYER_R,
  REQUIRED_ARTIFACTS,
  REQUIRED_HIGH_VALUE,
} from "./constants.js";
import * as MAP from "./mapData.js";

// Deep-clone helper (works for plain JSON-serialisable objects)
function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createGameState(playerCount = 2) {
  const spawnRoles = [
    { role: "fast", label: "Fast Thief" },
    { role: "strong", label: "Strong Thief" },
    { role: "fast", label: "Scout Thief" },
    { role: "strong", label: "Bruiser Thief" },
  ];
  const baseSpawnPoints = spawnRoles.map((r, i) => ({
    x: MAP.spawnPoints[i].x,
    y: MAP.spawnPoints[i].y,
    ...r,
  }));
  const clampedCount = Math.max(1, Math.min(playerCount, 4));
  const spawnPoints =
    clampedCount === 1
      ? [baseSpawnPoints[Math.random() < 0.5 ? 0 : 1]]
      : baseSpawnPoints.slice(0, clampedCount);
  const players = spawnPoints.map((sp, idx) => ({
    id: idx + 1,
    role: sp.role,
    label: sp.label,
    x: sp.x,
    y: sp.y,
    baseSpeed: sp.role === "fast" ? P1_BASE_SPEED : P2_BASE_SPEED,
    r: PLAYER_R,
    holding: null,
    interactCooldown: 0,
    nearPrompt: null,
    detected: 0,
    atVan: false,
    downed: false,
    custodyTimer: 0,
    reviveProgress: 0,
  }));

  return {
    // ── Meta ────────────────────────────────────────────────────────────────
    screen: "menu", // 'menu' | 'instructions' | 'playing' | 'paused' | 'win' | 'loss'
    lossReason: "",

    // ── HUD data ────────────────────────────────────────────────────────────
    elapsedTime: 0,
    alarm: 0,
    loot: [], // artifacts deposited at van
    score: 0,

    // Tutorial overlay timer (show for first 5 seconds)
    tutorialTimer: 5,
    vaultUnlocked: false,

    // ── Players ─────────────────────────────────────────────────────────────
    players,

    // ── Map objects (all cloned so mutations don't corrupt template) ─────────
    walls: clone(MAP.walls),
    doors: clone(MAP.doors),
    artifacts: clone(MAP.artifacts).map((a) => ({ ...a, pickedUp: false })),
    guards: clone(MAP.guards),
    cameras: clone(MAP.cameras),
    lasers: clone(MAP.lasers),
    pressurePlates: clone(MAP.pressurePlates),
    switches: clone(MAP.switches),
    vents: clone(MAP.vents),
    crates: clone(MAP.crates),
    van: clone(MAP.van),
  };
}

// ─── Helpers used by multiple modules ────────────────────────────────────────

/** Returns all rects that block movement (walls + closed doors + crates). */
export function getSolids(state) {
  const out = [...state.walls];
  for (const d of state.doors) {
    if (!d.open) out.push(d);
  }
  for (const c of state.crates) {
    out.push(c);
  }
  return out;
}

/** Returns true when win conditions are met. */
export function isWinConditionMet(state) {
  if (state.mission)
    return (
      state.mission.securityOff &&
      state.vaultUnlocked &&
      (state.loot.some((a) => a.id === "art_crown") ||
        state.players.some((p) => p.holding?.id === "art_crown")) &&
      state.players.length >= 2 &&
      state.players.every((p) => p.atVan && !p.downed)
    );
  const highValue = state.loot.filter((a) => a.type === "high_value").length;
  return (
    state.loot.length >= REQUIRED_ARTIFACTS &&
    highValue >= REQUIRED_HIGH_VALUE &&
    state.players.every((p) => p.atVan)
  );
}

/** Final score formula. */
export function calculateScore(state) {
  const carried = state.mission
    ? state.players.filter((p) => p.holding).map((p) => p.holding)
    : [];
  const lootVal = [...state.loot, ...carried].reduce((s, a) => s + a.value, 0);
  const alarmPen = Math.floor(state.alarm * 1.5);
  return Math.max(0, lootVal - alarmPen);
}
