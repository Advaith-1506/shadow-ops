import { describe, expect, it } from "vitest";
import { createShadowState } from "../../src/lib/game/mission.js";
import { LEVEL, walls as mapWalls } from "../../src/lib/game/mapData.js";
import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_R,
  GUARD_DETECT_R,
  CAM_DETECT_R,
  CAM_ARC_DEG,
  VAN_INTERACT_R,
} from "../../src/lib/game/constants.js";
import {
  circleOverlapsRect,
  lineBlockedByRects,
  lineIntersectsCircle,
  rectsOverlap,
} from "../../src/lib/game/collision.js";
import { computeGuardPath } from "../../src/lib/game/guardNav.js";
import { updateGuards } from "../../src/lib/game/entityLogic.js";

const GUARD_R = 11;
const STEP = 4;

const fresh = () =>
  createShadowState([
    { id: 1, role: "Hacker" },
    { id: 2, role: "Assassin" },
  ]);

function solidsFor(s, open = []) {
  return [
    ...s.walls,
    ...s.doors.filter((d) => !d.open && !open.includes(d.id)),
  ];
}

function standable(x, y, solids, r = PLAYER_R) {
  if (x < r || y < r || x > CANVAS_W - r || y > CANVAS_H - r) return false;
  return !solids.some((s) => circleOverlapsRect(x, y, r, s.x, s.y, s.w, s.h));
}

function flood(solids, start, { lasers = [] } = {}) {
  const cols = Math.floor(CANVAS_W / STEP);
  const rows = Math.floor(CANVAS_H / STEP);
  const free = (c, r) => {
    const x = c * STEP + STEP / 2;
    const y = r * STEP + STEP / 2;
    if (!standable(x, y, solids)) return false;
    return !lasers.some((l) => lineIntersectsCircle(l.x1, l.y1, l.x2, l.y2, x, y, PLAYER_R));
  };
  const seen = new Uint8Array(cols * rows);
  const sc = Math.floor(start.x / STEP);
  const sr = Math.floor(start.y / STEP);
  const queue = [[sc, sr]];
  seen[sr * cols + sc] = 1;
  while (queue.length) {
    const [c, r] = queue.pop();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const i = nr * cols + nc;
      if (seen[i] || !free(nc, nr)) continue;
      seen[i] = 1;
      queue.push([nc, nr]);
    }
  }
  return (p) => {
    // Reachable if any free cell within a couple of px of the point was reached.
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const c = Math.floor(p.x / STEP) + dx;
        const r = Math.floor(p.y / STEP) + dy;
        if (seen[r * cols + c]) return true;
      }
    }
    return false;
  };
}

describe("Maple Row Safehouse layout", () => {
  it("uses one unscaled coordinate system inside the level bounds", () => {
    expect(CANVAS_W).toBe(LEVEL.bounds.w);
    expect(CANVAS_H).toBe(LEVEL.bounds.h);
    const rects = [...LEVEL.walls, ...LEVEL.props, ...LEVEL.doors, ...LEVEL.rooms, ...LEVEL.pressurePlates];
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(CANVAS_W);
      expect(r.y + r.h).toBeLessThanOrEqual(CANVAS_H);
    }
    const s = fresh();
    expect(s.mission.terminal).toEqual({ x: LEVEL.mission.terminal.x, y: LEVEL.mission.terminal.y });
    expect(s.artifacts[0]).toMatchObject({ id: "art_crown", x: LEVEL.artifact.x, y: LEVEL.artifact.y });
  });

  it("merges every solid prop into the shared collision walls exactly once", () => {
    const s = fresh();
    for (const p of LEVEL.props.filter((q) => q.solid)) {
      const hits = s.walls.filter((w) => w.id === p.id);
      expect(hits).toHaveLength(1);
      expect(hits[0]).toMatchObject({ x: p.x, y: p.y, w: p.w, h: p.h });
    }
    expect(s.walls).toEqual(mapWalls);
    for (const d of LEVEL.decor) expect(s.walls.some((w) => w.x === d.x && w.y === d.y && w.w === d.w)).toBe(false);
  });

  it("spawns are standable, non-overlapping and out of initial guard and camera sight", () => {
    const s = fresh();
    const solids = solidsFor(s);
    for (const [i, a] of LEVEL.spawns.entries()) {
      expect(standable(a.x, a.y, solids)).toBe(true);
      for (const b of LEVEL.spawns.slice(i + 1)) {
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(PLAYER_R * 2 + 8);
      }
      for (const g of s.guards) {
        expect(Math.hypot(a.x - g.x, a.y - g.y)).toBeGreaterThan(GUARD_DETECT_R * 1.55 + 40);
      }
      for (const c of s.cameras) {
        expect(Math.hypot(a.x - c.x, a.y - c.y)).toBeGreaterThan(CAM_DETECT_R + 20);
      }
    }
  });

  it("every mandatory objective is reachable in dependency order", () => {
    const s = fresh();
    const spawn = LEVEL.spawns[0];
    const m = s.mission;
    const extraction = { x: s.van.x + s.van.w / 2, y: s.van.y + s.van.h / 2 };

    // Before security is off: pantry (Hacker door) and vault both closed, and
    // the laser hall treated as impassable so nothing depends on crossing it.
    const closed = solidsFor(s);
    const pre = flood(closed, spawn, { lasers: s.lasers });
    for (const p of [...m.keys, m.terminal, m.support, m.lock, extraction]) {
      expect(standable(p.x, p.y, closed)).toBe(true);
      expect(pre(p)).toBe(true);
    }
    // Every spawn shares the same connected region.
    for (const sp of LEVEL.spawns) expect(pre(sp)).toBe(true);

    // The diamond is sealed until the vault opens…
    expect(pre(s.artifacts[0])).toBe(false);
    // …and reachable afterwards, with a route back to extraction.
    const vaultOpen = solidsFor(s, ["door_vault"]);
    const post = flood(vaultOpen, spawn);
    expect(standable(s.artifacts[0].x, s.artifacts[0].y, vaultOpen)).toBe(true);
    expect(post(s.artifacts[0])).toBe(true);
    const back = flood(vaultOpen, s.artifacts[0]);
    expect(back(extraction)).toBe(true);
  });

  it("support pad and terminal allow two operatives without overlap", () => {
    const { terminal, support } = LEVEL.mission;
    expect(Math.hypot(terminal.x - support.x, terminal.y - support.y)).toBeGreaterThanOrEqual(PLAYER_R * 2 + 40);
    // Extraction fits a full squad of four.
    expect(VAN_INTERACT_R - PLAYER_R).toBeGreaterThan(PLAYER_R * 2);
  });

  it("doorways fit players and guard pathfinding, and furniture never plugs them", () => {
    const s = fresh();
    const props = s.walls.filter((w) => w.kind === "prop");
    for (const d of LEVEL.doors) {
      const span = Math.max(d.w, d.h);
      expect(span).toBeGreaterThanOrEqual(PLAYER_R * 2 + 40);
      const horizontal = d.w > d.h;
      const approach = horizontal
        ? { x: d.x, y: d.y - 30, w: d.w, h: d.h + 60 }
        : { x: d.x - 30, y: d.y, w: d.w + 60, h: d.h };
      for (const p of props) expect(rectsOverlap(approach, p), `${p.id} blocks ${d.id}`).toBe(false);

      if (!d.open) continue;
      const a = horizontal ? { x: d.x + d.w / 2, y: d.y - 36 } : { x: d.x - 36, y: d.y + d.h / 2 };
      const b = horizontal ? { x: d.x + d.w / 2, y: d.y + d.h + 36 } : { x: d.x + d.w + 36, y: d.y + d.h / 2 };
      const path = computeGuardPath(
        { walls: s.walls, doors: s.doors, crates: s.crates },
        a.x, a.y, b.x, b.y,
      );
      expect(path.length, `guard path through ${d.id}`).toBeGreaterThan(1);
    }
  });

  it("guard patrol waypoints are open floor and consecutive waypoints connect", () => {
    const s = fresh();
    const solids = solidsFor(s);
    for (const g of s.guards) {
      for (let i = 0; i < g.patrol.length; i += 1) {
        const a = g.patrol[i];
        const b = g.patrol[(i + 1) % g.patrol.length];
        expect(standable(a.x, a.y, solids, GUARD_R + 2), `${g.id} waypoint ${i}`).toBe(true);
        const path = computeGuardPath(
          { walls: s.walls, doors: s.doors.filter((d) => !d.open), crates: s.crates },
          a.x, a.y, b.x, b.y,
        );
        expect(path.length, `${g.id} ${i}->${(i + 1) % g.patrol.length}`).toBeGreaterThan(1);
      }
    }
  });

  it("guards roam and look around without getting stuck in walls", () => {
    const s = fresh();
    s.players = [];
    const start = new Map(s.guards.map((g) => [g.id, { x: g.x, y: g.y }]));
    const modes = new Map(s.guards.map((g) => [g.id, new Set([g.mode])]));
    for (let t = 0; t < 120 * 30; t += 1) {
      updateGuards(s, 1 / 30);
      for (const g of s.guards) modes.get(g.id).add(g.mode);
    }
    const solids = solidsFor(s);
    for (const g of s.guards) {
      // Should leave the exact spawn and use wander/roam/return behavior.
      const moved = Math.hypot(g.x - start.get(g.id).x, g.y - start.get(g.id).y);
      expect(moved, g.id).toBeGreaterThan(8);
      expect([...modes.get(g.id)].some((m) => ["wander", "roam", "return", "patrol"].includes(m))).toBe(true);
      expect(solids.some((w) => circleOverlapsRect(g.x, g.y, GUARD_R - 2, w.x, w.y, w.w, w.h))).toBe(false);
    }
  });

  it("camera cones never reach through walls or furniture", () => {
    const s = fresh();
    const solids = solidsFor(s);
    const half = (CAM_ARC_DEG * Math.PI) / 180 / 2;
    for (const c of s.cameras) {
      expect(solids.some((w) => circleOverlapsRect(c.x, c.y, 1, w.x, w.y, w.w, w.h)), `${c.id} mount`).toBe(false);
      for (let a = c.sweepA - half; a <= c.sweepB + half + 1e-6; a += 0.05) {
        for (let d = 8; d < CAM_DETECT_R; d += 4) {
          const x = c.x + Math.cos(a) * d;
          const y = c.y + Math.sin(a) * d;
          if (!standable(x, y, solids, 1)) continue;
          expect(lineBlockedByRects(c.x, c.y, x, y, solids), `${c.id} sees (${x | 0},${y | 0})`).toBe(false);
        }
      }
    }
  });

  it("laser beams span wall to wall", () => {
    const s = fresh();
    const onWall = (x, y) => s.walls.some((w) => x >= w.x - 1 && x <= w.x + w.w + 1 && y >= w.y - 1 && y <= w.y + w.h + 1);
    for (const l of s.lasers) {
      expect(onWall(l.x1, l.y1)).toBe(true);
      expect(onWall(l.x2, l.y2)).toBe(true);
    }
  });
});
