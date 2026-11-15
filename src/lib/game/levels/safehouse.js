/*
 * LEVEL – Maple Row Safehouse
 * ─────────────────────────────────────────────────────────────────────────────
 * A roofless, L-shaped residence seen from above. All coordinates are world
 * pixels in a single 1× coordinate system (no post-scaling).
 *
 *        96   120          500 520                920 940          1208 1232
 *   y=40  ┌────┬─────────────┬──────────────────────┬────────────────┐
 *         │    │  KITCHEN    D   LIVING ROOM        D   STUDY        │
 *         │    │  (ALPHA)    │   fireplace, sofa    │                │
 *   y=304 └────┴──[pantry]───┤                      ├──────────┬─hall┤
 *    YARD      │  GARAGE     D   bookshelf          V  VAULT   │laser│
 *    (van,     D  (car)      │                      │ (DIAMOND)│ hall│
 *    extract)  │             D   dining table       ├──────────┴─────┤
 *              │             │                      D   SECURITY     │
 *   y=760      └─────────────┴──────────────────────┴────────────────┘
 *
 * D = open doorway, [pantry] = locked side door (Hacker ability),
 * V = vault door (opened by the mission lock).
 *
 * Every entry in `props` with `solid: true` is merged into the collision walls,
 * so movement, guard navigation, guard line of sight, mission interaction line
 * of sight and the authoritative server all see the same geometry that is drawn.
 * `decor` is purely visual and never blocks.
 */

const OUTER = 24;
const INNER = 20;

const outer = (id, x, y, w, h) => ({ id, x, y, w, h, kind: 'outer' });
const inner = (id, x, y, w, h) => ({ id, x, y, w, h, kind: 'inner' });

export const SAFEHOUSE = {
  id: 'maple_row_safehouse',
  name: 'Maple Row Safehouse',
  shortName: 'House',
  difficulty: 'easy',
  campaignIndex: 1,
  campaignTotal: 3,
  theme: 'residential',
  bounds: { x: 0, y: 0, w: 1280, h: 800 },
  wallThickness: { outer: OUTER, inner: INNER },

  // Floor regions. Drawn under walls; `floor` selects the material.
  rooms: [
    { id: 'kitchen',  name: 'Kitchen',      x: 120, y: 64,  w: 380, h: 240, floor: 'kitchenTile', label: { x: 302, y: 130 } },
    { id: 'garage',   name: 'Garage',       x: 256, y: 324, w: 244, h: 412, floor: 'concrete',    label: { x: 382, y: 666 } },
    { id: 'living',   name: 'Living Room',  x: 520, y: 64,  w: 400, h: 672, floor: 'wood',        label: { x: 720, y: 300 } },
    { id: 'study',    name: 'Study',        x: 940, y: 64,  w: 268, h: 236, floor: 'carpet',      label: { x: 1012, y: 132 } },
    { id: 'vault',    name: 'Vault',        x: 940, y: 320, w: 180, h: 200, floor: 'steel',       label: { x: 1030, y: 494 } },
    { id: 'hall',     name: 'Service Hall', x: 1140, y: 300, w: 68, h: 240, floor: 'runner',      label: null },
    { id: 'security', name: 'Security',     x: 940, y: 540, w: 268, h: 196, floor: 'securityTile', label: { x: 1160, y: 588 } },
  ],

  // Building footprint (outer edges), used for the exterior shadow and outline.
  footprint: [
    { x: 96,  y: 40,  w: 1136, h: 288 },
    { x: 232, y: 304, w: 1000, h: 456 },
  ],

  walls: [
    outer('w_top',          96,   40,  1136, OUTER),
    outer('w_right',        1208, 40,  OUTER, 720),
    outer('w_bottom',       232,  736, 1000, OUTER),
    outer('w_kitchen_west', 96,   40,  OUTER, 288),
    outer('w_step',         96,   304, 160,  OUTER),
    outer('w_garage_west_n', 232, 304, OUTER, 272),
    outer('w_garage_west_s', 232, 664, OUTER, 96),

    // West | Living divider (x 500..520)
    inner('w_v1_a', 500, 64,  INNER, 68),
    inner('w_v1_b', 500, 220, INNER, 180),
    inner('w_v1_c', 500, 488, INNER, 132),
    inner('w_v1_d', 500, 708, INNER, 28),
    // Kitchen | Garage divider (y 304..324)
    inner('w_h1_a', 256, 304, 80, INNER),
    inner('w_h1_b', 424, 304, 76, INNER),
    // Living | East wing divider (x 920..940)
    inner('w_v2_a', 920, 64,  INNER, 86),
    inner('w_v2_b', 920, 238, INNER, 134),
    inner('w_v2_c', 920, 452, INNER, 138),
    inner('w_v2_d', 920, 678, INNER, 58),
    // Study | Vault (hall stays open)
    inner('w_h2', 940, 300, 200, INNER),
    // Vault | Security (hall stays open)
    inner('w_h3', 940, 520, 200, INNER),
    // Vault | Service hall
    inner('w_v3', 1120, 320, INNER, 200),
  ],

  // Furniture and fixtures. `solid` props collide and block sight.
  props: [
    // Kitchen
    { id: 'kitchen_counter', type: 'counter',     x: 120, y: 64,  w: 220, h: 36, facing: 's', solid: true },
    { id: 'kitchen_fridge',  type: 'fridge',      x: 440, y: 64,  w: 52,  h: 44, facing: 's', solid: true },
    { id: 'kitchen_island',  type: 'island',      x: 236, y: 168, w: 132, h: 48, solid: true },
    // Garage
    { id: 'garage_car',      type: 'car',         x: 340, y: 452, w: 84,  h: 156, facing: 'n', solid: true },
    { id: 'garage_bench',    type: 'workbench',   x: 256, y: 340, w: 40,  h: 96,  facing: 'e', solid: true },
    { id: 'garage_crates',   type: 'crates',      x: 268, y: 680, w: 64,  h: 48,  solid: true },
    // Living room
    { id: 'living_fireplace', type: 'fireplace',  x: 672, y: 64,  w: 96,  h: 24,  facing: 's', solid: true },
    { id: 'living_sofa',      type: 'sofa',       x: 616, y: 176, w: 168, h: 40,  facing: 'n', solid: true },
    { id: 'living_shelf',     type: 'bookshelf',  x: 600, y: 360, w: 220, h: 28,  solid: true },
    { id: 'living_dining',    type: 'diningTable', x: 624, y: 540, w: 152, h: 72, solid: true },
    { id: 'living_cabinet',   type: 'cabinet',    x: 780, y: 700, w: 96,  h: 36,  facing: 'n', solid: true },
    // Study
    { id: 'study_desk',       type: 'desk',       x: 960, y: 64,  w: 96,  h: 52,  facing: 's', solid: true },
    { id: 'study_bed',        type: 'bed',        x: 1108, y: 64, w: 92,  h: 120, facing: 's', solid: true },
    // Vault
    { id: 'vault_lockers',    type: 'lockers',    x: 948, y: 320, w: 164, h: 28,  facing: 's', solid: true },
    // Security
    { id: 'security_servers', type: 'servers',    x: 956, y: 548, w: 100, h: 32,  facing: 's', solid: true },
    { id: 'security_console', type: 'console',    x: 1052, y: 692, w: 140, h: 44, facing: 'n', solid: true },
    // Exterior
    { id: 'yard_van',         type: 'van',        x: 28,  y: 540, w: 60,  h: 124, facing: 'n', solid: true },
    { id: 'yard_shrub_a',     type: 'shrub',      x: 22,  y: 84,  w: 44,  h: 44,  solid: true },
    { id: 'yard_shrub_b',     type: 'shrub',      x: 22,  y: 214, w: 44,  h: 44,  solid: true },
    { id: 'yard_shrub_c',     type: 'shrub',      x: 176, y: 384, w: 40,  h: 40,  solid: true },
  ],

  // Non-blocking floor dressing.
  decor: [
    { type: 'driveway', x: 0,   y: 520, w: 232, h: 280 },
    { type: 'path',     x: 140, y: 590, w: 92,  h: 60 },
    { type: 'flowerbed', x: 110, y: 340, w: 60, h: 24 },
    { type: 'flowerbed', x: 1060, y: 4,  w: 120, h: 24 },
    { type: 'flowerbed', x: 300, y: 768, w: 160, h: 24 },
    { type: 'flowerbed', x: 700, y: 768, w: 160, h: 24 },
    { type: 'rug', x: 600, y: 96,  w: 200, h: 140, color: '#b5523b', trim: '#e7c27d' },
    { type: 'rug', x: 596, y: 508, w: 208, h: 136, color: '#4f7a68', trim: '#d9c9a3' },
    { type: 'rug', x: 976, y: 140, w: 116, h: 140, color: '#6d5a8e', trim: '#d8c8e8' },
    { type: 'mat', x: 260, y: 590, w: 28,  h: 60 },
    { type: 'parking', x: 332, y: 444, w: 100, h: 172 },
    { type: 'oil', x: 300, y: 640, w: 30, h: 20 },
    { type: 'hazard', x: 990, y: 380, w: 80, h: 80 },
  ],

  // Doorways. open:false doors are solid until opened.
  doors: [
    { id: 'door_front',        x: 232, y: 576, w: OUTER, h: 88, open: true,  requiredBy: null },
    { id: 'door_kitchen',      x: 500, y: 132, w: INNER, h: 88, open: true,  requiredBy: null },
    { id: 'door_garage_n',     x: 500, y: 400, w: INNER, h: 88, open: true,  requiredBy: null },
    { id: 'door_garage_s',     x: 500, y: 620, w: INNER, h: 88, open: true,  requiredBy: null },
    { id: 'door_pantry',       x: 336, y: 304, w: 88,  h: INNER, open: false, requiredBy: 'hacker_lock' },
    { id: 'door_study',        x: 920, y: 150, w: INNER, h: 88, open: true,  requiredBy: null },
    { id: 'door_vault',        x: 920, y: 372, w: INNER, h: 80, open: false, requiredBy: 'vault_lock' },
    { id: 'door_security',     x: 920, y: 590, w: INNER, h: 88, open: true,  requiredBy: null },
    { id: 'door_hall_n',       x: 1140, y: 300, w: 68, h: INNER, open: true,  requiredBy: null },
    { id: 'door_hall_s',       x: 1140, y: 520, w: 68, h: INNER, open: true,  requiredBy: null },
  ],

  // Player spawns in the yard beside the getaway van (P1..P4).
  spawns: [
    { x: 128, y: 708 },
    { x: 176, y: 708 },
    { x: 128, y: 752 },
    { x: 176, y: 752 },
  ],

  // Extraction zone. Its centre is the extraction point (VAN_INTERACT_R).
  extraction: { x: 102, y: 572, w: 96, h: 96 },

  guards: [
    { id: 'g1', patrol: [{ x: 548, y: 108 }, { x: 892, y: 108 }, { x: 892, y: 300 }, { x: 548, y: 300 }] },
    { id: 'g2', patrol: [{ x: 892, y: 470 }, { x: 892, y: 684 }, { x: 548, y: 684 }, { x: 548, y: 470 }] },
    { id: 'g3', patrol: [{ x: 160, y: 260 }, { x: 460, y: 260 }, { x: 460, y: 132 }] },
    { id: 'g4', patrol: [{ x: 972, y: 156 }, { x: 972, y: 268 }, { x: 1176, y: 268 }] },
    { id: 'g5', patrol: [{ x: 968, y: 620 }, { x: 1176, y: 640 }, { x: 1174, y: 476 }] },
    { id: 'g6', patrol: [{ x: 462, y: 372 }, { x: 462, y: 668 }] },
  ],

  // Sweeping security cameras (no wall occlusion in the simulation, so each
  // cone is placed to stay inside its room; see tests/unit/levelLayout.test.js).
  cameras: [
    { id: 'cam_vault',    x: 912,  y: 330, angle: 2.4,          sweepA: 2.27,          sweepB: 3.3,           dir: 1 },
    { id: 'cam_living',   x: 526,  y: 300, angle: 0,            sweepA: -0.5,          sweepB: 0.5,           dir: 1 },
    { id: 'cam_security', x: 1202, y: 640, angle: Math.PI,      sweepA: Math.PI - 0.3, sweepB: Math.PI + 0.5, dir: 1 },
  ],

  // Tripwires across the service hall. The override plate in the study
  // suppresses them while a teammate stands on it.
  lasers: [
    { id: 'laser_hall_n', x1: 1140, y1: 380, x2: 1208, y2: 380, active: true, disabledBy: 'plate_vault' },
    { id: 'laser_hall_s', x1: 1140, y1: 460, x2: 1208, y2: 460, active: true, disabledBy: 'plate_vault' },
  ],
  pressurePlates: [
    { id: 'plate_vault', x: 1056, y: 236, w: 32, h: 32, activated: false, group: 'single', label: 'LASER OVERRIDE' },
  ],

  mission: {
    // Role objectives reuse reachable open floor and existing guards. No wall,
    // furniture, spawn, extraction, camera or patrol geometry is replaced.
    coop: {
      captainId: 'g6',
      electronicDoorId: 'door_pantry',
      networkCameraId: 'cam_living',
      reconZone: { x: 312, y: 380, room: 'Garage' },
      hiddenNode: { x: 400, y: 360, room: 'Garage' },
      checkpointGuardId: 'g2',
      checkpoint: { x: 560, y: 430, room: 'Living Room' },
      distractionZone: { x: 840, y: 430, room: 'Living Room' },
    },
    keys: [
      { id: 'ALPHA', x: 164,  y: 136, room: 'Kitchen' },
      { id: 'BRAVO', x: 1170, y: 230, room: 'Study' },
    ],
    terminal: { x: 1122, y: 668, room: 'Security' },
    support:  { x: 1000, y: 668, room: 'Security' },
    lock:     { x: 896,  y: 412, room: 'Living Room' },
  },

  artifact: { id: 'art_crown', name: 'Diamond', x: 1030, y: 420, value: 500, type: 'high_value' },
};
