/*
 * ENTITY LOGIC  –  Museum Break
 * Updates guards, cameras, lasers, pressure plates, and crates each frame.
 * All alarm modifications happen here.
 */

import {
  GUARD_SPEED, GUARD_DETECT_R, GUARD_TOUCH_R,
  GUARD_ALARM_RATE, GUARD_TOUCH_ALARM,
  CAM_DETECT_R, CAM_ARC_DEG, CAM_SWEEP_RAD_S, CAM_ALARM_RATE,
  LASER_ALARM_RATE, MAX_ALARM,
  CANVAS_W, CANVAS_H,
} from './constants.js';
import {
  dist, pointInCone, rectsOverlap,
  lineIntersectsCircle, circleOverlapsRect, moveCircleWithCollisions, moveRectWithCollisions, lineBlockedByRects,
} from './collision.js';
import { computeGuardPath } from './guardNav.js';

// ─── Guards ───────────────────────────────────────────────────────────────────
export function updateGuards(state, dt) {
  const solids = [...state.walls, ...state.doors.filter((d) => !d.open)];
  const blockers = [...solids, ...state.crates];
  for (const guard of state.guards) {
    if (guard.stunned > 0) { guard.stunned = Math.max(0, guard.stunned - dt); continue; }
    if (state.mission && guard.mode !== 'chase') {
      const noise=(state.distractions || []).find(d=>d.remaining>0 && dist(guard.x,guard.y,d.x,d.y)<=260);
      const current=(state.distractions || []).find(d=>d.id===guard.noiseId && d.remaining>0);
      if (noise && !current) {guard.mode='investigate';guard.noiseId=noise.id;guard.investigation={x:noise.x,y:noise.y};guard.path=null;}
      if (guard.mode==='investigate' && !noise && !current) {guard.mode='patrol';guard.investigation=null;guard.noiseId=null;guard.path=null;}
    }
    _patrolGuard(guard, dt, solids, state.crates);
    _separateGuardFromCrates(guard, state.crates, solids);
    _guardDetection(guard, state, dt, blockers);
  }
}

function _downPlayer(state, player) {
  if (player.downed) return;
  player.downed = true;
  player.custodyTimer = 20;
  player.reviveProgress = 0;
  player.detected = 1;
  player.nearPrompt = null;
  player.atVan = false;

  if (player.holding) {
    const src = state.artifacts.find((a) => a.id === player.holding.id);
    if (src) {
      src.pickedUp = false;
      src.x = player.x + 16;
      src.y = player.y + 8;
    }
    player.holding = null;
  }
}

function _separateGuardFromCrates(guard, crates, solids) {
  const gr = 11;
  let gx = guard.x;
  let gy = guard.y;
  let pushed = false;

  for (const c of crates) {
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    const nx = Math.max(c.x, Math.min(gx, c.x + c.w));
    const ny = Math.max(c.y, Math.min(gy, c.y + c.h));
    const dd = dist(gx, gy, nx, ny);
    if (dd >= gr + 2) continue;
    let ang = Math.atan2(gy - cy, gx - cx);
    if (!Number.isFinite(ang)) ang = 0;
    gx = cx + Math.cos(ang) * (Math.max(c.w, c.h) * 0.5 + gr + 4);
    gy = cy + Math.sin(ang) * (Math.max(c.w, c.h) * 0.5 + gr + 4);
    pushed = true;
  }

  if (pushed) {
    const settled = moveCircleWithCollisions(gx, gy, gr, 0, 0, solids, []);
    guard.x = settled.x;
    guard.y = settled.y;
  }
}

function _pointBlocked(x, y, rects, pad = 10) {
  for (const r of rects) {
    if (x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) return true;
  }
  return false;
}

function _chooseNextPatrolIdx(guard, crates) {
  const n = guard.patrol.length;
  if (!n) return 0;
  for (let k = 0; k < n; k += 1) {
    const idx = (guard.patrolIdx + 1 + k) % n;
    const wp = guard.patrol[idx];
    if (!_pointBlocked(wp.x, wp.y, crates, 14)) return idx;
  }
  return (guard.patrolIdx + 1) % n;
}

function _patrolGuard(guard, dt, solids, crates) {
  const target = guard.mode === 'investigate' && guard.investigation ? guard.investigation : guard.mode === 'chase' && guard.chaseTarget ? guard.chaseTarget : guard.patrol[guard.patrolIdx];
  if (!target) return;
  guard.repathTimer = Math.max(0, (guard.repathTimer || 0) - dt);
  const needRepath = !guard.path || guard.path.length < 2 || guard.repathTimer <= 0;
  if (needRepath) {
    guard.path = computeGuardPath(
      {
        walls: solids.filter((s) => !s.id || !String(s.id).startsWith('door_')),
        doors: solids.filter((s) => s.id && String(s.id).startsWith('door_')).map((d) => ({ ...d, open: false })),
        crates,
      },
      guard.x, guard.y, target.x, target.y
    );
    guard.pathIdx = 1;
    guard.repathTimer = guard.mode === 'chase' ? 0.35 : 0.9;
  }

  const next = guard.path?.[guard.pathIdx] || target;
  const dx = next.x - guard.x;
  const dy = next.y - guard.y;
  const d = Math.hypot(dx, dy);

  if (d < 6) {
    if (guard.path && guard.pathIdx < guard.path.length - 1) {
      guard.pathIdx += 1;
      return;
    }
    if (guard.mode === 'investigate') return;
    if (guard.mode === 'chase') {
      guard.mode = 'patrol';
      guard.chaseTarget = null;
    }
    guard.patrolIdx = _chooseNextPatrolIdx(guard, crates);
  } else {
    const speedMul = guard.mode === 'chase' ? 1.45 : 1;
    const step = GUARD_SPEED * speedMul * dt;
    const ang = Math.atan2(dy, dx);
    const prevX = guard.x;
    const prevY = guard.y;
    const moved = moveCircleWithCollisions(
      prevX, prevY, 11,
      Math.cos(ang) * step, Math.sin(ang) * step,
      solids, [],
    );
    guard.x = moved.x;
    guard.y = moved.y;
    guard.facing = ang;

    const movedDist = dist(prevX, prevY, moved.x, moved.y);
    if (movedDist < 0.2) {
      guard.stuckTimer = (guard.stuckTimer || 0) + dt;
      if (guard.stuckTimer > 0.15) {
        if (guard.mode === 'investigate') { guard.path=null; guard.repathTimer=0;guard.stuckTimer=0;return; }
        if (guard.mode === 'chase') {
          guard.mode = 'patrol';
          guard.chaseTarget = null;
        }
        guard.patrolIdx = _chooseNextPatrolIdx(guard, crates);
        guard.path = null;
        guard.stuckTimer = 0;
      }
    } else {
      guard.stuckTimer = 0;
    }
  }
}

function _guardDetection(guard, state, dt, blockers) {
  guard.alertTimer = Math.max(0, guard.alertTimer - dt);
  let bestVisible = null;
  let bestDist = Infinity;
  const facing = Number.isFinite(guard.facing) ? guard.facing : 0;
  const guardArcDeg = 110;
  const alarmFactor = Math.min(1, Math.max(0, (state.alarm || 0) / 100));
  const dynamicDetectR = GUARD_DETECT_R * (1 + 0.55 * alarmFactor); // up to +55%
  const closeNoticeR = Math.max(52, GUARD_TOUCH_R + 24) + 18 * alarmFactor;

  for (const player of state.players) {
    const d = dist(guard.x, guard.y, player.x, player.y);

    if (player.downed) continue;
    if (d < GUARD_TOUCH_R + player.r) {
      // Physical contact → heavy alarm burst
      state.alarm = Math.min(MAX_ALARM, state.alarm + GUARD_TOUCH_ALARM);
      _downPlayer(state, player);
      guard.alertTimer = 1.0;
    } else if (
      d < dynamicDetectR &&
      !lineBlockedByRects(guard.x, guard.y, player.x, player.y, blockers) &&
      (
        d <= closeNoticeR ||
        pointInCone(player.x, player.y, guard.x, guard.y, facing, guardArcDeg, dynamicDetectR)
      )
    ) {
      // In sight radius → gradual alarm
      state.alarm = Math.min(MAX_ALARM, state.alarm + GUARD_ALARM_RATE * dt);
      player.detected  = 0.4;
      guard.alertTimer = 0.5;
      if (d < bestDist) {
        bestDist = d;
        bestVisible = player;
      }
    }
  }

  if (bestVisible) {
    if (guard.mode !== 'chase') guard.path=null;
    guard.investigation=null;guard.noiseId=null;
    guard.mode = 'chase';
    guard.chaseTarget = { x: bestVisible.x, y: bestVisible.y };
  } else if (guard.mode === 'chase' && guard.alertTimer <= 0) {
    guard.mode = 'patrol';
    guard.chaseTarget = null;
  }
}

// ─── Cameras ──────────────────────────────────────────────────────────────────
export function updateCameras(state, dt) {
  if (state.mission?.securityOff) return;
  for (const cam of state.cameras) {
    if (cam.disabled > 0) { cam.disabled = Math.max(0, cam.disabled - dt); continue; }
    _sweepCamera(cam, dt);
    _cameraDetection(cam, state, dt);
  }
}

function _sweepCamera(cam, dt) {
  cam.angle += cam.dir * CAM_SWEEP_RAD_S * dt;
  if (cam.angle >= cam.sweepB) { cam.angle = cam.sweepB; cam.dir = -1; }
  if (cam.angle <= cam.sweepA) { cam.angle = cam.sweepA; cam.dir  =  1; }
}

function _cameraDetection(cam, state, dt) {
  for (const player of state.players) {
    if (player.downed) continue;
    if (pointInCone(player.x, player.y, cam.x, cam.y, cam.angle, CAM_ARC_DEG, CAM_DETECT_R)) {
      state.alarm = Math.min(MAX_ALARM, state.alarm + CAM_ALARM_RATE * dt);
      player.detected = 0.4;
    }
  }
}

// ─── Lasers ───────────────────────────────────────────────────────────────────
export function updateLasers(state, dt) {
  if (state.mission?.securityOff) { for (const l of state.lasers) l.active = false; return; }
  const singlePlayer = (state.players?.length || 0) <= 1;
  for (const laser of state.lasers) {
    if (singlePlayer && state.vaultUnlocked && laser.disabledBy === 'plate_vault') {
      laser.active = false;
      continue;
    }
    // A single pressure plate with matching id disables this laser
    if (laser.disabledBy) {
      const plate = state.pressurePlates.find(p => p.id === laser.disabledBy);
      laser.active = !(plate && plate.activated);
    }
    if (!laser.active) continue;

    for (const player of state.players) {
      if (player.downed) continue;
      if (lineIntersectsCircle(laser.x1, laser.y1, laser.x2, laser.y2, player.x, player.y, player.r)) {
        state.alarm = Math.min(MAX_ALARM, state.alarm + LASER_ALARM_RATE * dt);
        player.detected = 0.4;
      }
    }
  }
}

// ─── Pressure plates ──────────────────────────────────────────────────────────
export function updatePressurePlates(state) {
  const singlePlayer = (state.players?.length || 0) <= 1;
  // Reset activated state each frame
  for (const plate of state.pressurePlates) plate.activated = false;

  // Players
  for (const player of state.players) {
    const pr = { x: player.x - player.r, y: player.y - player.r, w: player.r*2, h: player.r*2 };
    for (const plate of state.pressurePlates) {
      if (rectsOverlap(pr, plate)) plate.activated = true;
    }
  }

  // Crates can also hold plates down
  for (const crate of state.crates) {
    for (const plate of state.pressurePlates) {
      if (rectsOverlap(crate, plate)) plate.activated = true;
    }
  }

  // Group logic: named groups → open door when ALL plates in group active
  const groups = {};
  for (const plate of state.pressurePlates) {
    if (!plate.group || plate.group === 'single') continue;
    if (!groups[plate.group]) groups[plate.group] = [];
    groups[plate.group].push(plate);
  }
  for (const [groupId, plates] of Object.entries(groups)) {
    const allOn = plates.every(p => p.activated);
    const door  = state.doors.find(d => d.requiredBy === groupId);
    if (door) door.open = allOn;
  }

  // Vault plate (group:'single') → also opens the vault door directly
  const vaultPlate = state.pressurePlates.find(p => p.id === 'plate_vault');
  const vaultDoor  = state.doors.find(d => d.id === 'door_vault');
  if (state.mission) { if (vaultDoor) vaultDoor.open = !!state.vaultUnlocked; return; }
  if (vaultPlate && vaultDoor) {
    if (singlePlayer) {
      if (vaultPlate.activated) state.vaultUnlocked = true;
      vaultDoor.open = !!state.vaultUnlocked || vaultPlate.activated;
    } else {
      state.vaultUnlocked = false;
      vaultDoor.open = vaultPlate.activated;
    }
  }
}

// ─── Crates (Strong Thief / P2 only) ─────────────────────────────────────────
export function updateCrates(state, dt) {
  const strong = state.players.find(p => p.role === 'strong');
  if (!strong) return;

  const mapSolids = [...state.walls, ...state.doors.filter((d) => !d.open)];
  for (const crate of state.crates) {
    // Test if strong player is touching crate
    if (!circleOverlapsRect(strong.x, strong.y, strong.r + 3, crate.x, crate.y, crate.w, crate.h)) continue;

    // Push direction = from player centre toward crate centre
    const cx = crate.x + crate.w / 2;
    const cy = crate.y + crate.h / 2;
    const dx = cx - strong.x;
    const dy = cy - strong.y;

    const pushSpeed = 55; // px / sec
    let vx = 0;
    let vy = 0;
    if (Math.abs(dx) > Math.abs(dy)) vx = Math.sign(dx) * pushSpeed * dt;
    else vy = Math.sign(dy) * pushSpeed * dt;

    const otherCrates = state.crates
      .filter((c) => c.id !== crate.id)
      .map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
    const moved = moveRectWithCollisions(crate, vx, vy, mapSolids, otherCrates);
    crate.x = moved.x;
    crate.y = moved.y;

    // Keep on canvas
    crate.x = Math.max(16, Math.min(CANVAS_W - 16 - crate.w, crate.x));
    crate.y = Math.max(16, Math.min(CANVAS_H - 16 - crate.h, crate.y));
  }
}
