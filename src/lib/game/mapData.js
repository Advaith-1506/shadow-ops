/*
 * MAP DATA
 * Adapter that exposes the active level definition in the shape the
 * simulation expects. All coordinates are used as-is (1× world pixels).
 *
 * Solid props are appended to `walls`, so every system that reads walls
 * (player collision, guard steering/pathfinding, guard sight, mission
 * interaction line of sight, server simulation) uses the same geometry
 * the renderer draws.
 */

import { ACTIVE_LEVEL } from './levels/index.js';

export const LEVEL = ACTIVE_LEVEL;

export const outerWalls = LEVEL.walls.filter((w) => w.kind === 'outer').map((w) => ({ ...w }));
export const innerWalls = LEVEL.walls.filter((w) => w.kind !== 'outer').map((w) => ({ ...w }));

export const solidProps = LEVEL.props
  .filter((p) => p.solid)
  .map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    kind: 'prop',
    prop: p.type,
    ...(p.facing ? { facing: p.facing } : {}),
  }));

export const walls = [...outerWalls, ...innerWalls, ...solidProps];

export const doors = LEVEL.doors.map((d) => ({ ...d }));

export const artifacts = [{ ...LEVEL.artifact }];

export const guards = LEVEL.guards.map((g) => {
  const [start, next = start] = g.patrol;
  return {
    id: g.id,
    x: start.x,
    y: start.y,
    patrol: g.patrol.map((p) => ({ ...p })),
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
    facing: Math.atan2(next.y - start.y, next.x - start.x),
  };
});

export const cameras = LEVEL.cameras.map((c) => ({ ...c }));
export const lasers = LEVEL.lasers.map((l) => ({ ...l }));
export const pressurePlates = LEVEL.pressurePlates.map((p) => ({ ...p }));

// Legacy puzzle collections (unused by this level).
export const switches = [];
export const vents = [];
export const crates = [];

// `van` is the extraction zone; its centre is the extraction point.
export const van = { ...LEVEL.extraction };

export const spawnPoints = LEVEL.spawns.map((s) => ({ ...s }));

export const missionLayout = LEVEL.mission;
