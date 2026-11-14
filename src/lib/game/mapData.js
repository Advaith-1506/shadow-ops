/*
 * MAP DATA  –  Museum Break
 * ─────────────────────────────────────────────────────────────────────────────
 * The museum is 960 × 640 px.  We keep the existing six-room layout but
 * clean it up so every room is reachable and every puzzle has a clear path.
 *
 * Layout (top-down):
 *
 *  ┌──────────┬────────────┬──────────┐
 *  │ Gallery A│  Gallery B │ Gallery C│  rows 0-6  (y 0-208)
 *  ├──────┬───┤            ├───┬──────┤
 *  │      │   corridor     │   │      │  rows 6-13 (y 208-432)
 *  │      │  ┌──────────┐  │   │      │
 *  │      │  │  VAULT   │  │   │      │
 *  ├──────┴──┤            ├──┴──┤     │
 *  │ Storage │   Lobby   │Archive│    │  rows 13-19 (y 432-624)
 *  └─────────┴────────────┴───────────┘
 *
 * Coordinate origin = top-left.  All values in pixels.
 */

// ─── OUTER BOUNDARY ───────────────────────────────────────────────────────────
// Outer walls (16 px thick).  Players spawn in the bottom-center lobby area.
export const outerWalls = [
  { x: 0,   y: 0,   w: 1120, h: 16  }, // top
  // south museum wall split with central entry gate to outside apron
  { x: 0,   y: 624, w: 450, h: 16  },
  { x: 670, y: 624, w: 450, h: 16  },
  { x: 0,   y: 0,   w: 16,  h: 640 }, // left
  { x: 1104, y: 0,  w: 16,  h: 640 }, // right
];

// ─── ROOM DIVIDERS ────────────────────────────────────────────────────────────
export const innerWalls = [
  // --- horizontal: top rooms → corridor ---
  // Gallery A south wall: x=16..288 (gap 288..352 for door_a_s and door_ab)
  { x: 16,  y: 208, w: 272, h: 16 },
  // Gallery B south wall: x=352..400 and x=464..560 (gap 400..464 for door_b_s)
  { x: 352, y: 208, w: 48,  h: 16 },
  { x: 464, y: 208, w: 96,  h: 16 },
  // Gallery C south wall: x=624..848 (gap 560..624 for door_c_s)
  { x: 624, y: 208, w: 320, h: 16 },
  // Annex (new gallery D) south wall
  { x: 960, y: 208, w: 144, h: 16 },

  // --- vertical: Gallery A|B, B|C separators ---
  // x=288, full height of top rooms except door gap (128..208)
  { x: 288, y: 16,  w: 16,  h: 112 },
  // x=560, same
  { x: 560, y: 16,  w: 16,  h: 112 },
  // x=944, divider to new annex
  { x: 944, y: 16,  w: 16,  h: 112 },

  // --- horizontal: corridor → bottom rooms ---
  // Storage north: x=16..208 (gap 208..240 = door_store_n)
  { x: 16,  y: 432, w: 192, h: 16 },
  // Solid between Storage door and Lobby
  { x: 240, y: 432, w: 128, h: 16 },
  // Lobby north: x=368..528 (gap 528..592 = door_lobby_n)
  { x: 368, y: 432, w: 160, h: 16 },
  // Solid between Lobby and Archive gap
  { x: 592, y: 432, w: 128, h: 16 },
  // Archive north: x=720..784 = door_archive_n (gap), x=784..944 solid
  { x: 784, y: 432, w: 160, h: 16 },
  // Records room north wall (new bottom-right room)
  { x: 960, y: 432, w: 144, h: 16 },

  // --- vertical: Storage|Lobby, Lobby|Archive ---
  // x=304, y=448..512 solid above vent door, gap 496..560 = door_vent_sl, then solid 560..608
  { x: 304, y: 448, w: 16,  h: 48  },
  { x: 304, y: 560, w: 16,  h: 64  },
  // x=640, gap 496..560 = door_switch_la
  { x: 640, y: 448, w: 16,  h: 48  },
  { x: 640, y: 560, w: 16,  h: 64  },
  // x=944, archive|records separator
  { x: 944, y: 448, w: 16,  h: 48  },
  { x: 944, y: 560, w: 16,  h: 64  },

  // --- VAULT (centre of corridor) ---
  { x: 396, y: 272, w: 16,  h: 96  }, // left wall
  { x: 548, y: 272, w: 16,  h: 96  }, // right wall
  { x: 396, y: 272, w: 76,  h: 16  }, // vault ceiling-left  (x=396..472)
  // gap x=472..548 = door_vault (open when plate_vault active)
  // vault ceiling-right covered by x=548 right-wall itself
  { x: 396, y: 352, w: 168, h: 16  }, // vault floor

  // --- decorative pillars for cover ---
  { x: 96,  y: 296, w: 16,  h: 16  },
  { x: 96,  y: 368, w: 16,  h: 16  },
  { x: 848, y: 296, w: 16,  h: 16  },
  { x: 848, y: 368, w: 16,  h: 16  },

  // --- enclosed artifact cases (with entry gap) ---
  // Gallery C enclosure around Ancient Coin Case
  { x: 760, y: 72,  w: 120, h: 12 },
  { x: 760, y: 72,  w: 12,  h: 96 },
  { x: 868, y: 72,  w: 12,  h: 96 },
  { x: 760, y: 156, w: 44,  h: 12 },
  { x: 836, y: 156, w: 44,  h: 12 },

  // Records enclosure around Royal Gem
  { x: 980, y: 470, w: 96, h: 12 },
  { x: 980, y: 470, w: 12, h: 88 },
  { x: 1064, y: 470, w: 12, h: 88 },
  { x: 980, y: 546, w: 36, h: 12 },
  { x: 1040, y: 546, w: 36, h: 12 },
];

export const walls = [...outerWalls, ...innerWalls];

// ─── DOORS ────────────────────────────────────────────────────────────────────
// Each door fills a gap in a wall.  open:false = solid obstacle.
export const doors = [
  // Gallery A ↔ B  (gap in x=288 vertical wall, y=128..208)
  { id: 'door_ab',       x: 288, y: 128, w: 16, h: 80,  open: true,  requiredBy: null         },
  // Gallery B ↔ C  (gap in x=560 vertical wall)
  { id: 'door_bc',       x: 560, y: 128, w: 16, h: 80,  open: true,  requiredBy: null         },

  // Gallery south gaps → corridor  (horizontal gaps in y=208 wall)
  { id: 'door_a_s',      x: 288, y: 208, w: 64, h: 16,  open: true,  requiredBy: null         },
  { id: 'door_b_s',      x: 400, y: 208, w: 64, h: 16,  open: true,  requiredBy: null         },
  { id: 'door_c_s',      x: 560, y: 208, w: 64, h: 16,  open: true,  requiredBy: null         },
  { id: 'door_d_s',      x: 944, y: 208, w: 64, h: 16,  open: true,  requiredBy: null         },

  // Bottom room north gaps
  { id: 'door_store_n',  x: 208, y: 432, w: 32, h: 16,  open: true,  requiredBy: null         },
  { id: 'door_lobby_n',  x: 528, y: 432, w: 64, h: 16,  open: true,  requiredBy: null         },
  { id: 'door_archive_n',x: 720, y: 432, w: 64, h: 16,  open: false, requiredBy: 'double_plate'},
  { id: 'door_records_n',x: 944, y: 432, w: 64, h: 16,  open: true,  requiredBy: null         },
  { id: 'door_cd',       x: 944, y: 128, w: 16, h: 80,  open: true,  requiredBy: null         },

  // Storage ↔ Lobby  – vent-unlocked  (vertical gap in x=304 wall)
  { id: 'door_vent_sl',  x: 304, y: 496, w: 16, h: 64,  open: false, requiredBy: 'vent_unlock'},

  // Lobby ↔ Archive  – switch-controlled (vertical gap in x=640 wall)
  { id: 'door_switch_la',x: 640, y: 496, w: 16, h: 64,  open: false, requiredBy: 'switch_hold'},

  // Vault door  (horizontal gap in vault ceiling, opened by vault pressure plate)
  { id: 'door_vault',    x: 472, y: 272, w: 76, h: 16,  open: false, requiredBy: 'vault_plate'},
  // South gate to outside spawn apron
  { id: 'door_south_gate', x: 450, y: 624, w: 220, h: 16, open: true, requiredBy: null },
];

// ─── ARTIFACTS ────────────────────────────────────────────────────────────────
// Five artifacts per brief.
// type: 'small' | 'heavy' | 'high_value'
export const artifacts = [
  // Gallery A
  { id: 'art_vase',   x: 160,  y: 112, name: 'Small Vase',       value: 80,  type: 'small'      },
  // Gallery B
  { id: 'art_mask',   x: 480,  y: 100, name: 'Golden Mask',      value: 150, type: 'small'      },
  // Gallery C
  { id: 'art_coins',  x: 800,  y: 112, name: 'Ancient Coin Case',value: 100, type: 'small'      },
  // Storage (bottom-left) – heavy, only Strong Thief
  { id: 'art_statue', x: 152,  y: 520, name: 'Marble Statue',    value: 220, type: 'heavy'      },
  // Inside VAULT – high-value, behind laser puzzle
  { id: 'art_crown',  x: 480,  y: 318, name: 'Crown Jewel',      value: 500, type: 'high_value' },
  // Extra spread-out targets for bigger run
  { id: 'art_scroll', x: 640,  y: 108, name: 'Imperial Scroll',  value: 130, type: 'small'      },
  { id: 'art_orb',    x: 868,  y: 514, name: 'Crystal Orb',      value: 140, type: 'small'      },
  { id: 'art_relic',  x: 340,  y: 530, name: 'Bronze Relic',     value: 120, type: 'small'      },
  { id: 'art_tablet', x: 1032, y: 104, name: 'Rune Tablet',      value: 160, type: 'small'      },
  { id: 'art_gem',    x: 1028, y: 516, name: 'Royal Gem',        value: 170, type: 'small'      },
];

// ─── GUARDS ───────────────────────────────────────────────────────────────────
export const guards = [
  {
    id: 'g1',
    x: 240, y: 310,
    patrol: [{ x: 112, y: 310 }, { x: 580, y: 310 }, { x: 480, y: 180 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0, // seconds player has been in range (for render flash)
  },
  {
    id: 'g2',
    x: 700, y: 380,
    patrol: [{ x: 400, y: 380 }, { x: 880, y: 380 }, { x: 780, y: 540 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
  {
    id: 'g3',
    x: 150, y: 520,
    patrol: [{ x: 120, y: 520 }, { x: 280, y: 520 }, { x: 240, y: 340 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
  {
    id: 'g4',
    x: 840, y: 520,
    patrol: [{ x: 700, y: 520 }, { x: 900, y: 520 }, { x: 860, y: 340 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
  {
    id: 'g5',
    x: 480, y: 120,
    patrol: [{ x: 360, y: 120 }, { x: 600, y: 120 }, { x: 480, y: 300 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
  {
    id: 'g6',
    x: 480,
    y: 580,
    patrol: [{ x: 360, y: 580 }, { x: 620, y: 580 }, { x: 520, y: 420 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
  {
    id: 'g7',
    x: 640, y: 256,
    patrol: [{ x: 576, y: 256 }, { x: 736, y: 256 }, { x: 696, y: 392 }, { x: 560, y: 360 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
  {
    id: 'g8',
    x: 280, y: 210,
    patrol: [{ x: 176, y: 210 }, { x: 448, y: 210 }, { x: 360, y: 126 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
  {
    id: 'g9',
    x: 1020, y: 168,
    patrol: [{ x: 980, y: 168 }, { x: 1080, y: 168 }, { x: 1040, y: 300 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
  {
    id: 'g10',
    x: 1020, y: 520,
    patrol: [{ x: 980, y: 520 }, { x: 1080, y: 520 }, { x: 1000, y: 380 }],
    patrolIdx: 0,
    patrolDir: 1,
    mode: 'patrol',
    alertTimer: 0,
  },
];

// ─── CAMERAS ──────────────────────────────────────────────────────────────────
// Each camera sweeps between sweepA and sweepB (radians).
// dir: +1 or -1 (current sweep direction)
export const cameras = [
  {
    id: 'cam1',
    x: 16, y: 320,            // mounted on left wall, watching corridor
    angle: 0,                  // current facing angle (radians)
    sweepA: -0.6,
    sweepB:  0.6,
    dir: 1,
  },
  {
    id: 'cam2',
    x: 944, y: 320,           // mounted on right wall
    angle: Math.PI,
    sweepA: Math.PI - 0.6,
    sweepB: Math.PI + 0.6,
    dir: 1,
  },
  {
    id: 'cam3',
    x: 480, y: 16,
    angle: Math.PI / 2,
    sweepA: Math.PI / 2 - 0.55,
    sweepB: Math.PI / 2 + 0.55,
    dir: 1,
  },
  {
    id: 'cam4',
    x: 1104, y: 320,
    angle: Math.PI,
    sweepA: Math.PI - 0.5,
    sweepB: Math.PI + 0.5,
    dir: 1,
  },
  {
    id: 'cam5',
    x: 304, y: 432, // storage-lobby corridor choke
    angle: -Math.PI / 2,
    sweepA: -Math.PI / 2 - 0.45,
    sweepB: -Math.PI / 2 + 0.45,
    dir: 1,
  },
  {
    id: 'cam6',
    x: 640, y: 432, // lobby-archive lane
    angle: -Math.PI / 2,
    sweepA: -Math.PI / 2 - 0.45,
    sweepB: -Math.PI / 2 + 0.45,
    dir: 1,
  },
  {
    id: 'cam7',
    x: 560, y: 272, // vault entrance watch
    angle: Math.PI,
    sweepA: Math.PI - 0.55,
    sweepB: Math.PI + 0.2,
    dir: 1,
  },
  {
    id: 'cam8',
    x: 944, y: 432, // records wing entrance
    angle: Math.PI,
    sweepA: Math.PI - 0.45,
    sweepB: Math.PI + 0.45,
    dir: 1,
  },
];

// ─── LASERS ───────────────────────────────────────────────────────────────────
// Lasers guard the vault entrance.  Disabled when 'disabledBy' plate is active.
export const lasers = [
  { id: 'laser1', x1: 412, y1: 290, x2: 548, y2: 290, active: true, disabledBy: 'plate_vault' },
  { id: 'laser2', x1: 412, y1: 334, x2: 548, y2: 334, active: true, disabledBy: 'plate_vault' },
];

// ─── PRESSURE PLATES ──────────────────────────────────────────────────────────
// group = door/puzzle they control
export const pressurePlates = [
  // Double-plate puzzle → opens Archive north door
  { id: 'dplate1',    x: 752, y: 490, w: 28, h: 28, activated: false, group: 'double_plate' },
  { id: 'dplate2',    x: 840, y: 490, w: 28, h: 28, activated: false, group: 'double_plate' },
  // Single plate in Storage → disables vault lasers (checked per-laser in entityLogic)
  { id: 'plate_vault', x: 148, y: 490, w: 28, h: 28, activated: false, group: 'single' },
];

// ─── SWITCHES ─────────────────────────────────────────────────────────────────
export const switches = [
  // In the corridor, east side – opens the Lobby↔Archive switch door
  { id: 'sw1', x: 620, y: 340, w: 20, h: 20, activated: false, doorId: 'door_switch_la' },
];

// ─── VENTS ────────────────────────────────────────────────────────────────────
// Fast Thief only.  Teleports from entry to exit, unlocks door.
export const vents = [
  {
    id: 'vent1',
    // Entry: on the Storage side of the x=304 wall
    entryX: 270, entryY: 510,
    entryW: 24, entryH: 24,
    // Exit: Lobby side (just right of the wall)
    exitX: 328, exitY: 510,
    exitW: 24, exitH: 24,
    unlocksDoor: 'door_vent_sl',
  },
  {
    id: 'vent2',
    entryX: 720, entryY: 510,
    entryW: 24, entryH: 24,
    exitX: 574, exitY: 146,
    exitW: 24, exitH: 24,
    unlocksDoor: 'door_bc',
  },
];

// ─── CRATES ───────────────────────────────────────────────────────────────────
// Only Strong Thief can push.  Act as solid obstacles.
// Starting position: blocking left camera cone in corridor.
export const crates = [
  { id: 'crate1', x: 80, y: 296, w: 30, h: 30 },
  { id: 'crate2', x: 820, y: 296, w: 30, h: 30 },
  { id: 'crate3', x: 160, y: 420, w: 30, h: 30 },
  { id: 'crate4', x: 980, y: 300, w: 30, h: 30 },
  { id: 'crate5', x: 260, y: 300, w: 30, h: 30 },
  { id: 'crate6', x: 560, y: 360, w: 30, h: 30 },
  { id: 'crate7', x: 760, y: 500, w: 30, h: 30 },
  { id: 'crate8', x: 1040, y: 420, w: 30, h: 30 },
];

// ─── GETAWAY VAN ──────────────────────────────────────────────────────────────
// Sits at the bottom-centre of the lobby, partially outside the south wall.
export const van = { x: 470, y: 700, w: 180, h: 40 };

const SCALE = 2.0;
function scaleValue(v) {
  return typeof v === 'number' ? Math.round(v * SCALE * 100) / 100 : v;
}
const COORD_KEYS = new Set([
  'x', 'y', 'w', 'h', 'x1', 'y1', 'x2', 'y2',
  'entryX', 'entryY', 'entryW', 'entryH', 'exitX', 'exitY', 'exitW', 'exitH',
]);
function scaleObject(obj) {
  for (const key of Object.keys(obj)) {
    if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map((it) => (typeof it === 'object' && it !== null ? scaleObject(it) : it));
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      obj[key] = scaleObject(obj[key]);
    } else {
      obj[key] = COORD_KEYS.has(key) ? scaleValue(obj[key]) : obj[key];
    }
  }
  return obj;
}
for (const arr of [outerWalls, innerWalls, doors, artifacts, guards, cameras, lasers, pressurePlates, switches, vents, crates]) {
  for (const item of arr) scaleObject(item);
}
scaleObject(van);

// ─── DISPLAY CASES (visual only) ─────────────────────────────────────────────
// Generated around artifact positions for decoration.
export const displayCases = artifacts.map(a => ({
  x: a.x - 18, y: a.y - 18, w: 36, h: 36,
}));

// ─── ROOM LABELS ──────────────────────────────────────────────────────────────
export const roomLabels = [
  { x: 152, y: 48,  text: 'GALLERY A' },
  { x: 480, y: 48,  text: 'GALLERY B' },
  { x: 800, y: 48,  text: 'GALLERY C' },
  { x: 1032, y: 48, text: 'GALLERY D' },
  { x: 176, y: 570, text: 'STORAGE'   },
  { x: 480, y: 570, text: 'LOBBY'     },
  { x: 784, y: 570, text: 'ARCHIVE'   },
  { x: 1032, y: 570, text: 'RECORDS'  },
  { x: 480, y: 316, text: 'VAULT'     },
  { x: 560, y: 700, text: 'COURTYARD' },
];

for (const lbl of roomLabels) {
  lbl.x = scaleValue(lbl.x);
  lbl.y = scaleValue(lbl.y);
}
