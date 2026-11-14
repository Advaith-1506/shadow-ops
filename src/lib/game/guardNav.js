import PF from 'pathfinding';
import { CANVAS_W, CANVAS_H } from './constants.js';

const CELL = 24;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rasterizeBlocked(state) {
  const cols = Math.ceil(CANVAS_W / CELL);
  const rows = Math.ceil(CANVAS_H / CELL);
  const mat = Array.from({ length: rows }, () => Array(cols).fill(0));
  const solids = [...state.walls, ...state.doors.filter((d) => !d.open), ...state.crates];

  for (const r of solids) {
    const c0 = clamp(Math.floor(r.x / CELL), 0, cols - 1);
    const c1 = clamp(Math.floor((r.x + r.w) / CELL), 0, cols - 1);
    const r0 = clamp(Math.floor(r.y / CELL), 0, rows - 1);
    const r1 = clamp(Math.floor((r.y + r.h) / CELL), 0, rows - 1);
    for (let y = r0; y <= r1; y += 1) {
      for (let x = c0; x <= c1; x += 1) mat[y][x] = 1;
    }
  }
  return { mat, cols, rows };
}

function worldToCell(x, y, cols, rows) {
  return {
    c: clamp(Math.floor(x / CELL), 0, cols - 1),
    r: clamp(Math.floor(y / CELL), 0, rows - 1),
  };
}

function cellToWorld(c, r) {
  return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
}

const finder = new PF.AStarFinder({ allowDiagonal: true, dontCrossCorners: true });

export function computeGuardPath(state, fromX, fromY, toX, toY) {
  const { mat, cols, rows } = rasterizeBlocked(state);
  const grid = new PF.Grid(cols, rows, mat);
  const a = worldToCell(fromX, fromY, cols, rows);
  const b = worldToCell(toX, toY, cols, rows);
  const path = finder.findPath(a.c, a.r, b.c, b.r, grid);
  return path.map(([c, r]) => cellToWorld(c, r));
}
