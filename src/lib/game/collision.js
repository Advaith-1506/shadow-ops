/*
 * COLLISION  –  Museum Break
 * Pure geometry utilities.  No game-state side-effects.
 */

// ─── AABB rect overlap ────────────────────────────────────────────────────────
export function rectsOverlap(a, b) {
  return (
    a.x         < b.x + b.w &&
    a.x + a.w   > b.x &&
    a.y         < b.y + b.h &&
    a.y + a.h   > b.y
  );
}

// ─── Distance ─────────────────────────────────────────────────────────────────
export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── Point-in-cone (camera vision) ───────────────────────────────────────────
// angle = facing direction (radians), arcDeg = full cone width (degrees)
export function pointInCone(px, py, cx, cy, angle, arcDeg, radius) {
  if (dist(px, py, cx, cy) > radius) return false;
  let diff = Math.atan2(py - cy, px - cx) - angle;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) < (arcDeg * Math.PI / 180) / 2;
}

// ─── Circle vs AABB ───────────────────────────────────────────────────────────
// True if circle (cx, cy, r) overlaps rectangle (rx, ry, rw, rh).
export function circleOverlapsRect(cx, cy, r, rx, ry, rw, rh) {
  const nearX = Math.max(rx, Math.min(cx, rx + rw));
  const nearY = Math.max(ry, Math.min(cy, ry + rh));
  return dist(cx, cy, nearX, nearY) < r;
}

// ─── Line segment vs circle (laser beam hitting player) ───────────────────────
// True if segment (x1,y1)→(x2,y2) passes within radius r of point (cx,cy).
export function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(x1, y1, cx, cy) < r;
  const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lenSq));
  return dist(x1 + t * dx, y1 + t * dy, cx, cy) < r;
}

// ─── Player wall resolution ───────────────────────────────────────────────────
/*
 * Moves a circle of radius `r` centred at (px, py) out of all solid rects.
 *
 * Strategy: two-pass axis-separated resolution.
 *   Pass 1 – resolve only X, keeping Y constant.
 *   Pass 2 – resolve only Y, using the corrected X.
 *
 * This gives stable sliding along walls and correct corner handling.
 * We iterate several times to handle multiple simultaneous overlaps.
 */
export function resolvePlayerWalls(px, py, r, solids) {
  const ITERATIONS = 3;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // X pass
    for (const s of solids) {
      if (!circleOverlapsRect(px, py, r, s.x, s.y, s.w, s.h)) continue;
      const overlapLeft  = (px + r) - s.x;          // how far we poke past left face
      const overlapRight = (s.x + s.w) - (px - r);  // how far left face pokes into us from right
      if (overlapLeft < overlapRight) px = s.x - r;           // push left
      else                             px = s.x + s.w + r;     // push right
    }
    // Y pass
    for (const s of solids) {
      if (!circleOverlapsRect(px, py, r, s.x, s.y, s.w, s.h)) continue;
      const overlapTop    = (py + r) - s.y;
      const overlapBottom = (s.y + s.h) - (py - r);
      if (overlapTop < overlapBottom) py = s.y - r;
      else                             py = s.y + s.h + r;
    }
  }
  return { x: px, y: py };
}

function circleVsCircle(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const rr = r1 + r2;
  return (dx * dx + dy * dy) < rr * rr;
}

function circleHitsAny(px, py, r, solids, blockers = []) {
  for (const s of solids) {
    if (circleOverlapsRect(px, py, r, s.x, s.y, s.w, s.h)) return true;
  }
  for (const b of blockers) {
    if (circleVsCircle(px, py, r, b.x, b.y, b.r)) return true;
  }
  return false;
}

// Robust movement with substeps + sliding along blocked axes.
export function moveCircleWithCollisions(px, py, r, vx, vy, solids, blockers = []) {
  const distMove = Math.hypot(vx, vy);
  const steps = Math.max(1, Math.ceil(distMove / Math.max(4, r * 0.65)));
  const sx = vx / steps;
  const sy = vy / steps;
  let x = px;
  let y = py;

  for (let i = 0; i < steps; i += 1) {
    const nx = x + sx;
    const ny = y + sy;
    if (!circleHitsAny(nx, ny, r, solids, blockers)) {
      x = nx;
      y = ny;
      continue;
    }
    const tryX = !circleHitsAny(nx, y, r, solids, blockers);
    const tryY = !circleHitsAny(x, ny, r, solids, blockers);
    if (tryX) x = nx;
    if (tryY) y = ny;
  }

  return resolvePlayerWalls(x, y, r, solids);
}

export function moveRectWithCollisions(rect, vx, vy, solids, otherRects = []) {
  const steps = Math.max(1, Math.ceil(Math.hypot(vx, vy) / 8));
  const sx = vx / steps;
  const sy = vy / steps;
  let x = rect.x;
  let y = rect.y;

  const collides = (rx, ry) => {
    const probe = { x: rx, y: ry, w: rect.w, h: rect.h };
    for (const s of solids) if (rectsOverlap(probe, s)) return true;
    for (const o of otherRects) if (rectsOverlap(probe, o)) return true;
    return false;
  };

  for (let i = 0; i < steps; i += 1) {
    const nx = x + sx;
    const ny = y + sy;
    if (!collides(nx, ny)) {
      x = nx; y = ny; continue;
    }
    if (!collides(nx, y)) x = nx;
    if (!collides(x, ny)) y = ny;
  }
  return { x, y };
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const ccw = (x1, y1, x2, y2, x3, y3) => (y3 - y1) * (x2 - x1) > (y2 - y1) * (x3 - x1);
  return ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
         ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy);
}

export function lineIntersectsRect(x1, y1, x2, y2, r) {
  const xMin = r.x, xMax = r.x + r.w, yMin = r.y, yMax = r.y + r.h;
  if (
    (x1 >= xMin && x1 <= xMax && y1 >= yMin && y1 <= yMax) ||
    (x2 >= xMin && x2 <= xMax && y2 >= yMin && y2 <= yMax)
  ) return true;

  return (
    segmentsIntersect(x1, y1, x2, y2, xMin, yMin, xMax, yMin) ||
    segmentsIntersect(x1, y1, x2, y2, xMax, yMin, xMax, yMax) ||
    segmentsIntersect(x1, y1, x2, y2, xMax, yMax, xMin, yMax) ||
    segmentsIntersect(x1, y1, x2, y2, xMin, yMax, xMin, yMin)
  );
}

export function lineBlockedByRects(x1, y1, x2, y2, rects) {
  for (const r of rects) {
    if (lineIntersectsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}
