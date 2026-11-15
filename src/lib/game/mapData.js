/*
 * MAP DATA
 * Adapter that exposes the active level definition in the shape the
 * simulation expects. All coordinates are used as-is (1× world pixels).
 *
 * Solid props are appended to `walls`, so every system that reads walls
 * (player collision, guard steering/pathfinding, guard sight, mission
 * interaction line of sight, server simulation) uses the same geometry
 * the renderer draws.
 *
 * Call applyLevel(id) before createShadowState to switch maps for local play.
 */

import {
  getActiveLevel,
  setActiveLevel as setLevelId,
  listLevels,
  LEVELS,
} from './levels/index.js';
import { syncCanvasFromLevel } from './constants.js';

export { listLevels, LEVELS };

function buildFrom(level) {
  const outerWalls = level.walls.filter((w) => w.kind === 'outer').map((w) => ({ ...w }));
  const innerWalls = level.walls.filter((w) => w.kind !== 'outer').map((w) => ({ ...w }));
  const solidProps = level.props
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
  return {
    LEVEL: level,
    outerWalls,
    innerWalls,
    solidProps,
    walls: [...outerWalls, ...innerWalls, ...solidProps],
    doors: level.doors.map((d) => ({ ...d })),
    artifacts: [{ ...level.artifact }],
    guards: level.guards.map((g) => {
      const patrol = g.patrol.map((p) => ({ ...p }));
      const [start, next = start] = patrol;
      const xs = patrol.map((p) => p.x);
      const ys = patrol.map((p) => p.y);
      const pad = 48;
      return {
        id: g.id,
        x: start.x,
        y: start.y,
        patrol,
        patrolIdx: 0,
        patrolDir: 1,
        // Home post + box for in-room wander; roam visits other posts then returns.
        post: { x: start.x, y: start.y },
        home: {
          x0: Math.min(...xs) - pad,
          y0: Math.min(...ys) - pad,
          x1: Math.max(...xs) + pad,
          y1: Math.max(...ys) + pad,
        },
        mode: 'wander',
        wanderTarget: null,
        pauseTimer: 0.2 + Math.random() * 0.8,
        roamCooldown: 5 + Math.random() * 7,
        lookTimer: 0,
        alertTimer: 0,
        facing: Math.atan2(next.y - start.y, next.x - start.x),
      };
    }),
    cameras: level.cameras.map((c) => ({ ...c })),
    lasers: level.lasers.map((l) => ({ ...l })),
    pressurePlates: level.pressurePlates.map((p) => ({ ...p })),
    switches: [],
    vents: [],
    crates: [],
    van: { ...level.extraction },
    spawnPoints: level.spawns.map((s) => ({ ...s })),
    missionLayout: level.mission,
  };
}

let built = buildFrom(getActiveLevel());

export let LEVEL = built.LEVEL;
export let outerWalls = built.outerWalls;
export let innerWalls = built.innerWalls;
export let solidProps = built.solidProps;
export let walls = built.walls;
export let doors = built.doors;
export let artifacts = built.artifacts;
export let guards = built.guards;
export let cameras = built.cameras;
export let lasers = built.lasers;
export let pressurePlates = built.pressurePlates;
export let switches = built.switches;
export let vents = built.vents;
export let crates = built.crates;
export let van = built.van;
export let spawnPoints = built.spawnPoints;
export let missionLayout = built.missionLayout;

function publish(next) {
  built = next;
  LEVEL = next.LEVEL;
  outerWalls = next.outerWalls;
  innerWalls = next.innerWalls;
  solidProps = next.solidProps;
  walls = next.walls;
  doors = next.doors;
  artifacts = next.artifacts;
  guards = next.guards;
  cameras = next.cameras;
  lasers = next.lasers;
  pressurePlates = next.pressurePlates;
  switches = next.switches;
  vents = next.vents;
  crates = next.crates;
  van = next.van;
  spawnPoints = next.spawnPoints;
  missionLayout = next.missionLayout;
  syncCanvasFromLevel(next.LEVEL);
  return next.LEVEL;
}

/** Switch the active level template and refresh all map exports. */
export function applyLevel(id) {
  setLevelId(id);
  return publish(buildFrom(getActiveLevel()));
}

export function refreshMapData() {
  return publish(buildFrom(getActiveLevel()));
}

export const setActiveLevel = applyLevel;
