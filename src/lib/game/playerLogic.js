/*
 * PLAYER LOGIC  –  Museum Break
 * Handles movement, wall collision, interaction detection & interactions.
 * Called once per player per frame from the game loop.
 */

import {
  CARRY_SLOW_NORMAL, CARRY_SLOW_HEAVY,
  INTERACT_R, VAN_INTERACT_R,
  CANVAS_W, CANVAS_H,
} from './constants';
import { moveCircleWithCollisions, dist, rectsOverlap } from './collision';
import { getSolids } from './gameState';

// ─── Main per-player update ───────────────────────────────────────────────────
export function updatePlayer(player, input, state, dt) {
  if (player.downed) {
    player.nearPrompt = null;
    player.atVan = false;
    return;
  }
  _move(player, input, state, dt);
  _clamp(player);
  if (player.interactCooldown > 0) player.interactCooldown -= dt;
  if (player.detected > 0)         player.detected         -= dt;
  _checkVan(player, state);
  _findPrompt(player, state, input, dt);

  if (input.interact && player.interactCooldown <= 0 && !_reviveNearby(player, state, dt)) {
    _interact(player, state);
    player.interactCooldown = 0.35;
  }
}

// ─── Movement + collision ─────────────────────────────────────────────────────
function _move(player, input, state, dt) {
  let dx = 0, dy = 0;
  if (input.up)    dy -= 1;
  if (input.down)  dy += 1;
  if (input.left)  dx -= 1;
  if (input.right) dx += 1;
  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; } // diagonal normalise

  // Speed with carry penalty
  let speed = player.baseSpeed;
  if (player.holding) {
    speed -= player.holding.type === 'heavy' ? CARRY_SLOW_HEAVY : CARRY_SLOW_NORMAL;
  }
  speed = Math.max(speed, 40);

  const solids = getSolids(state);
  const blockers = state.players
    .filter((p) => p.id !== player.id)
    .map((p) => ({ x: p.x, y: p.y, r: p.r }));
  const resolved = moveCircleWithCollisions(
    player.x, player.y, player.r,
    dx * speed * dt, dy * speed * dt,
    solids, blockers,
  );
  player.x = resolved.x;
  player.y = resolved.y;
}

function _clamp(player) {
  const r = player.r;
  player.x = Math.max(r, Math.min(CANVAS_W - r, player.x));
  player.y = Math.max(r, Math.min(CANVAS_H - r, player.y));
}

// ─── Van proximity check ──────────────────────────────────────────────────────
function _checkVan(player, state) {
  const v = state.van;
  player.atVan = dist(player.x, player.y, v.x + v.w / 2, v.y + v.h / 2) < VAN_INTERACT_R;
}

// ─── Nearby-interactable scan (sets player.nearPrompt) ────────────────────────
function _findPrompt(player, state, input, dt) {
  const keyMap = { 1: 'E', 2: 'Enter', 3: 'R', 4: 'O' };
  const key = keyMap[player.id] || 'E';
  const reviveTarget = _nearestDownedTeammate(player, state);
  if (reviveTarget) {
    const pct = Math.floor((reviveTarget.reviveProgress / 2) * 100);
    player.nearPrompt = {
      text: `[${key} Hold] Revive P${reviveTarget.id} (${Math.max(0, Math.min(100, pct))}%)`,
      warn: false,
    };
    if (!input?.interact) reviveTarget.reviveProgress = Math.max(0, reviveTarget.reviveProgress - dt * 1.5);
    return;
  }

  // Deposit at van takes top priority when holding something and near van
  if (player.holding && player.atVan) {
    player.nearPrompt = { text: `[${key}] Stash "${player.holding.name}"`, warn: false };
    return;
  }

  // Artifact pickup
  for (const art of state.artifacts) {
    if (art.pickedUp) continue;
    if (dist(player.x, player.y, art.x, art.y) > INTERACT_R) continue;
    if (player.holding) {
      player.nearPrompt = { text: 'Already carrying something!', warn: true };
      return;
    }
    if (art.type === 'heavy' && player.role !== 'strong') {
      player.nearPrompt = { text: 'Too heavy! (Strong Thief only)', warn: true };
      return;
    }
    player.nearPrompt = { text: `[${key}] Pick up ${art.name}`, warn: false };
    return;
  }

  // Switch
  for (const sw of state.switches) {
    if (dist(player.x, player.y, sw.x + sw.w / 2, sw.y + sw.h / 2) > INTERACT_R) continue;
    const action = sw.activated ? 'Release' : 'Hold';
    player.nearPrompt = { text: `[${key}] ${action} Switch`, warn: false };
    return;
  }

  // Vent
  for (const vent of state.vents) {
    const cx = vent.entryX + vent.entryW / 2;
    const cy = vent.entryY + vent.entryH / 2;
    if (dist(player.x, player.y, cx, cy) > INTERACT_R) continue;
    if (player.role !== 'fast') {
      player.nearPrompt = { text: "Can't fit! (Fast Thief only)", warn: true };
      return;
    }
    player.nearPrompt = { text: `[${key}] Enter Vent`, warn: false };
    return;
  }

  player.nearPrompt = null;
}

function _nearestDownedTeammate(player, state) {
  let best = null;
  let bestD = Infinity;
  for (const other of state.players) {
    if (other.id === player.id || !other.downed) continue;
    const d = dist(player.x, player.y, other.x, other.y);
    if (d <= INTERACT_R && d < bestD) {
      best = other;
      bestD = d;
    }
  }
  return best;
}

function _reviveNearby(player, state, dt) {
  const target = _nearestDownedTeammate(player, state);
  if (!target) return false;
  target.reviveProgress = (target.reviveProgress || 0) + dt;
  if (target.reviveProgress >= 2) {
    target.downed = false;
    target.custodyTimer = 0;
    target.reviveProgress = 0;
    target.detected = 0;
  }
  return true;
}

// ─── Execute interaction ───────────────────────────────────────────────────────
function _interact(player, state) {
  // Deposit at van
  if (player.holding && player.atVan) {
    state.loot.push({ ...player.holding });
    player.holding = null;
    return;
  }

  // Artifact pickup
  for (const art of state.artifacts) {
    if (art.pickedUp) continue;
    if (dist(player.x, player.y, art.x, art.y) > INTERACT_R) continue;
    if (player.holding) return;
    if (art.type === 'heavy' && player.role !== 'strong') return;
    art.pickedUp   = true;
    player.holding = { ...art };
    return;
  }

  // Switch toggle
  for (const sw of state.switches) {
    if (dist(player.x, player.y, sw.x + sw.w / 2, sw.y + sw.h / 2) > INTERACT_R) continue;
    sw.activated = !sw.activated;
    const door = state.doors.find(d => d.id === sw.doorId);
    if (door) door.open = sw.activated;
    return;
  }

  // Vent (Fast Thief only)
  for (const vent of state.vents) {
    const cx = vent.entryX + vent.entryW / 2;
    const cy = vent.entryY + vent.entryH / 2;
    if (dist(player.x, player.y, cx, cy) > INTERACT_R) continue;
    if (player.role !== 'fast') return;
    player.x = vent.exitX + vent.exitW / 2;
    player.y = vent.exitY + vent.exitH / 2;
    const door = state.doors.find(d => d.id === vent.unlocksDoor);
    if (door) door.open = true;
    return;
  }
}
