/*
 * LEVEL – Office (MEDIUM)
 * Enlarged corporate floor plan (larger than Easy house). Cool blue-gray
 * aesthetic. Clearances for PLAYER_R=10 (diameter 20).
 * TILE (32px) used as the furniture “unit” for layout tweaks.
 * Entry bottom-center; extraction upper-right loading bay.
 * Rooms are sealed — entry only through doors.
 */

const OUTER = 24;
const INNER = 20;
const U = 32; // one layout unit (matches TILE)

const outer = (id, x, y, w, h) => ({ id, x, y, w, h, kind: 'outer' });
const inner = (id, x, y, w, h) => ({ id, x, y, w, h, kind: 'inner' });

export const OFFICE = {
  id: 'meridian_office',
  name: 'Office',
  shortName: 'Office',
  difficulty: 'medium',
  campaignIndex: 2,
  campaignTotal: 3,
  theme: 'corporate',
  // Larger than Easy house — camera fits the whole floor like the house map.
  bounds: { x: 0, y: 0, w: 1760, h: 1080 },
  wallThickness: { outer: OUTER, inner: INNER },

  rooms: [
    { id: 'boardroom', name: 'Boardroom', x: 104, y: 72, w: 400, h: 260, floor: 'officeCarpet', label: { x: 304, y: 130 } },
    { id: 'executive', name: 'Executive Office', x: 544, y: 72, w: 340, h: 260, floor: 'officeCarpet', label: { x: 714, y: 130 } },
    { id: 'conference', name: 'Conference Room', x: 924, y: 72, w: 360, h: 260, floor: 'officeCarpet', label: { x: 1104, y: 130 } },
    { id: 'corridor_n', name: 'Main Corridor', x: 104, y: 360, w: 1180, h: 140, floor: 'terrazzo', label: { x: 520, y: 430 } },
    { id: 'break', name: 'Break Room', x: 104, y: 540, w: 320, h: 212, floor: 'breakTile', label: { x: 264, y: 588 } },
    { id: 'records', name: 'Records', x: 104, y: 792, w: 320, h: 180, floor: 'officeCarpet', label: { x: 264, y: 848 } },
    { id: 'open_office', name: 'Open Office', x: 464, y: 540, w: 520, h: 432, floor: 'officeCarpet', label: { x: 724, y: 760 } },
    { id: 'reception', name: 'Reception', x: 1024, y: 520, w: 360, h: 452, floor: 'terrazzo', label: { x: 1204, y: 700 } },
    { id: 'server', name: 'Server Room', x: 1424, y: 360, w: 260, h: 272, floor: 'serverFloor', label: { x: 1554, y: 440 } },
    { id: 'security', name: 'Security Control', x: 1424, y: 672, w: 260, h: 300, floor: 'securityTile', label: { x: 1554, y: 740 } },
    { id: 'archive', name: 'Secure Archive', x: 1480, y: 200, w: 200, h: 160, floor: 'steel', label: { x: 1580, y: 240 } },
    { id: 'service', name: 'Service Hall', x: 1324, y: 200, w: 120, h: 160, floor: 'terrazzo', label: null },
  ],

  footprint: [
    { x: 80, y: 48, w: 1324, h: 940 },
    { x: 1400, y: 360, w: 300, h: 628 },
    { x: 1300, y: 180, w: 400, h: 180 },
  ],

  walls: [
    // Outer shell — entry gap bottom center (1120..1280). No exterior side doors.
    outer('w_top_main', 80, 48, 1220, OUTER),
    outer('w_left', 80, 48, OUTER, 940),
    outer('w_bottom_l', 80, 964, 1040, OUTER),
    outer('w_bottom_r', 1280, 964, 420, OUTER),
    outer('w_right_wing', 1680, 360, OUTER, 628),
    outer('w_bay_step_h', 1300, 48, 380, OUTER),
    outer('w_bay_step_v', 1300, 48, OUTER, 152),
    outer('w_bay_east', 1680, 180, OUTER, 180),
    outer('w_wing_top_l', 1400, 360, 120, OUTER),
    outer('w_wing_top_r', 1620, 360, 60, OUTER),

    // Boardroom | Exec
    inner('w_be_a', 504, 72, INNER, 60),
    inner('w_be_b', 504, 220, INNER, 112),
    // Exec | Conference
    inner('w_ec_a', 884, 72, INNER, 60),
    inner('w_ec_b', 884, 220, INNER, 112),

    // North rooms | corridor — boardroom door only; exec + conference sealed
    inner('w_n_a', 104, 332, 140, INNER),
    // door_boardroom 244..340
    inner('w_n_b', 340, 332, 164, INNER),
    // Head office (executive) fully sealed from corridor
    inner('w_n_exec', 504, 332, 380, INNER),
    // Conference south wall sealed
    inner('w_n_d', 884, 332, 400, INNER),

    // Corridor south — break door gap, open-office door gap, reception FULLY WALLED
    inner('w_cs_a', 104, 500, 100, INNER),
    // door_break_n 204..300
    inner('w_cs_a2', 300, 500, 164, INNER),
    inner('w_cs_b', 464, 500, 160, INNER),
    // door_oo_n 624..720
    inner('w_cs_c', 720, 500, 304, INNER),
    // Wall between main corridor and reception (no door)
    inner('w_cs_rx', 1024, 500, 360, INNER),

    // Left spine break/records | open office
    inner('w_spine_a', 424, 540, INNER, 60),
    // door_break (hacker) 600..700
    inner('w_spine_b', 424, 700, INNER, 60),
    // door_hacker_records 780..860
    inner('w_spine_c', 424, 860, INNER, 112),

    // Break | Records
    inner('w_br_a', 104, 752, 100, INNER),
    inner('w_br_b', 300, 752, 124, INNER),

    // Open | Reception — one door only (north)
    inner('w_or_a', 984, 540, INNER, 100),
    // door_or_n 640..728
    inner('w_or_b', 984, 728, INNER, 244),

    // Reception | east wing — fully sealed from server; door only into security
    inner('w_re_server', 1384, 520, INNER, 260), // 520..780 solid wall vs server
    // door_rx_sec 780..880
    inner('w_re_c', 1384, 880, INNER, 84),

    // Corridor | Server
    inner('w_ce_a', 1384, 360, INNER, 48),
    inner('w_ce_b', 1384, 500, INNER, 80),

    // Server | Security
    inner('w_ss_a', 1424, 652, 80, INNER),
    inner('w_ss_b', 1600, 652, 84, INNER),

    // Service / archive
    inner('w_svc_w', 1304, 200, INNER, 100),
    inner('w_svc_e_a', 1444, 200, INNER, 40),
    inner('w_svc_e_b', 1444, 312, INNER, 48),
    inner('w_arch_n', 1480, 180, 200, INNER),
    inner('w_arch_e', 1656, 200, INNER, 160),

    // Conference east / service — open svc door + interior hacker door
    inner('w_conf_e', 1284, 72, INNER, 100),
    inner('w_conf_e_b', 1284, 240, INNER, 40),
    // door_hacker_conf 280..332
  ],

  props: [
    // Boardroom — big table centered; silver cabinet on top wall; plant against wall
    { id: 'br_table', type: 'conferenceTable', x: 224, y: 162, w: 160, h: 80, solid: true },
    { id: 'br_cab', type: 'filingCabinet', x: 120, y: 88, w: 100, h: 28, facing: 's', solid: true },
    { id: 'br_plant', type: 'planter', x: 468, y: 88, w: 32, h: 28, solid: true },
    // Executive (head office) — silver desk against top wall
    { id: 'ex_desk', type: 'execDesk', x: 640, y: 88, w: 120, h: 52, facing: 's', solid: true },
    { id: 'ex_shelf', type: 'bookshelf', x: 820, y: 88, w: 40, h: 100, facing: 'w', solid: true },
    { id: 'ex_plant', type: 'planter', x: 560, y: 88, w: 32, h: 28, solid: true },
    // Conference — white board top-left; conference table centered
    { id: 'cf_board', type: 'whiteboard', x: 940, y: 84, w: 120, h: 24, facing: 's', solid: true },
    { id: 'cf_table', type: 'conferenceTable', x: 1014, y: 162, w: 180, h: 80, solid: true },
    { id: 'cf_plant', type: 'planter', x: 1220, y: 280, w: 32, h: 28, solid: true },
    // Break — furniture up 1 unit; counter kept west of the new north door path
    { id: 'bk_counter', type: 'coffeeCounter', x: 120, y: 556 - U, w: 72, h: 36, facing: 's', solid: true },
    { id: 'bk_table', type: 'roundTable', x: 280, y: 648 - U, w: 64, h: 64, solid: true },
    // Records
    { id: 'rc_files_a', type: 'filingCabinet', x: 120, y: 812, w: 28, h: 140, facing: 'e', solid: true },
    { id: 'rc_files_b', type: 'filingCabinet', x: 380, y: 812, w: 28, h: 140, facing: 'w', solid: true },
    { id: 'rc_desk', type: 'desk', x: 200, y: 860, w: 100, h: 44, facing: 'n', solid: true },
    // Open office — desks + partitions one unit right
    { id: 'oo_a1', type: 'workstation', x: 520 + U, y: 610, w: 68, h: 44, facing: 'e', solid: true },
    { id: 'oo_a2', type: 'workstation', x: 520 + U, y: 710, w: 68, h: 44, facing: 'e', solid: true },
    { id: 'oo_a3', type: 'workstation', x: 520 + U, y: 810, w: 68, h: 44, facing: 'e', solid: true },
    { id: 'oo_b1', type: 'workstation', x: 780 + U, y: 650, w: 68, h: 44, facing: 'w', solid: true },
    { id: 'oo_b2', type: 'workstation', x: 780 + U, y: 750, w: 68, h: 44, facing: 'w', solid: true },
    { id: 'oo_b3', type: 'workstation', x: 780 + U, y: 850, w: 68, h: 44, facing: 'w', solid: true },
    { id: 'oo_part_a', type: 'partition', x: 620 + U, y: 590, w: 12, h: 100, solid: true },
    { id: 'oo_part_b', type: 'partition', x: 620 + U, y: 770, w: 12, h: 100, solid: true },
    { id: 'oo_part_c', type: 'partition', x: 740 + U, y: 630, w: 12, h: 100, solid: true },
    { id: 'oo_part_d', type: 'partition', x: 740 + U, y: 810, w: 12, h: 100, solid: true },
    // Reception — blue sofas up 5 units and closer together
    { id: 'rx_desk', type: 'receptionDesk', x: 1160, y: 640, w: 120, h: 44, facing: 's', solid: true },
    { id: 'rx_sofa_a', type: 'sofaBlue', x: 1120, y: 860 - 5 * U, w: 100, h: 36, facing: 'e', solid: true },
    { id: 'rx_sofa_b', type: 'sofaBlue', x: 1220, y: 860 - 5 * U, w: 100, h: 36, facing: 'w', solid: true },
    { id: 'rx_table', type: 'coffeeTable', x: 1188, y: 900 - 5 * U, w: 44, h: 28, solid: true },
    { id: 'rx_plant_a', type: 'planter', x: 1048, y: 548, w: 32, h: 28, solid: true },
    { id: 'rx_plant_b', type: 'planter', x: 1320, y: 548, w: 32, h: 28, solid: true },
    // Server — racks down 1 unit
    { id: 'sv_rack_a', type: 'servers', x: 1460, y: 410 + U, w: 40, h: 160, facing: 'e', solid: true },
    { id: 'sv_rack_b', type: 'servers', x: 1600, y: 410 + U, w: 40, h: 160, facing: 'w', solid: true },
    // Security
    { id: 'sc_console', type: 'console', x: 1520 - 2 * U, y: 900, w: 120, h: 48, facing: 'n', solid: true },
    { id: 'sc_cab_a', type: 'filingCabinet', x: 1440, y: 692, w: 100, h: 28, facing: 's', solid: true },
    { id: 'sc_cab_b', type: 'filingCabinet', x: 1636, y: 760, w: 28, h: 100, facing: 'w', solid: true },
    // Archive
    { id: 'ar_lockers', type: 'lockers', x: 1500, y: 208, w: 100, h: 24, facing: 's', solid: true },
    // Loading bay
    { id: 'bay_van', type: 'van', x: 1360, y: 64, w: 56, h: 100, facing: 's', solid: true },
    { id: 'bay_hvac_a', type: 'hvac', x: 1308, y: 64, w: 44, h: 40, solid: true },
    { id: 'bay_hvac_b', type: 'hvac', x: 1308, y: 112, w: 44, h: 36, solid: true },
    { id: 'bay_bollard_a', type: 'bollard', x: 1324, y: 200, w: 14, h: 14, solid: true },
    { id: 'bay_bollard_b', type: 'bollard', x: 1436, y: 200, w: 14, h: 14, solid: true },
    // Street
    { id: 'st_planter_a', type: 'planter', x: 140, y: 1000, w: 56, h: 32, solid: true },
    { id: 'st_planter_b', type: 'planter', x: 1520, y: 1000, w: 56, h: 32, solid: true },
    { id: 'st_car_a', type: 'parkedCar', x: 240, y: 1010, w: 110, h: 44, facing: 'e', solid: true },
    { id: 'st_car_b', type: 'parkedCar', x: 420, y: 1010, w: 110, h: 44, facing: 'e', solid: true },
    { id: 'st_car_c', type: 'parkedCar', x: 1360, y: 1010, w: 110, h: 44, facing: 'e', solid: true },
  ],

  decor: [
    { type: 'asphalt', x: 0, y: 0, w: 1760, h: 1080 },
    { type: 'sidewalk', x: 60, y: 988, w: 1640, h: 48 },
    { type: 'loadingBay', x: 1320, y: 52, w: 360, h: 200 },
    { type: 'extractMark', x: 1520, y: 80, w: 140, h: 90 },
    { type: 'parkingStripe', x: 220, y: 1000, w: 150, h: 64 },
    { type: 'parkingStripe', x: 400, y: 1000, w: 150, h: 64 },
    { type: 'parkingStripe', x: 1340, y: 1000, w: 150, h: 64 },
    { type: 'curbYellow', x: 1320, y: 232, w: 360, h: 10 },
    { type: 'rug', x: 640, y: 160, w: 140, h: 90, color: '#3d5a73', trim: '#8eb4c9' },
    { type: 'rug', x: 1040, y: 200, w: 140, h: 80, color: '#3a4f66', trim: '#7fa3b8' },
    { type: 'rug', x: 1120, y: 900 - 5 * U, w: 140, h: 60, color: '#3a4f66', trim: '#7fa3b8' },
    { type: 'mat', x: 1140, y: 920, w: 100, h: 28 },
    { type: 'hazard', x: 1540, y: 255, w: 80, h: 55 },
    { type: 'entryLabel', x: 1140, y: 1000, w: 100, h: 20 },
  ],

  doors: [
    { id: 'door_entry', x: 1120, y: 964, w: 160, h: OUTER, open: true, requiredBy: null },
    { id: 'door_boardroom', x: 244, y: 332, w: 96, h: INNER, open: true, requiredBy: null },
    // Head office sealed from corridor — enter via boardroom/conference doors
    { id: 'door_ec', x: 884, y: 132, w: INNER, h: 88, open: true, requiredBy: null },
    { id: 'door_conf_svc', x: 1284, y: 172, w: INNER, h: 68, open: true, requiredBy: null },
    { id: 'door_break_n', x: 204, y: 500, w: 96, h: INNER, open: true, requiredBy: null },
    // Records normal path via break
    { id: 'door_br_rec', x: 204, y: 752, w: 96, h: INNER, open: true, requiredBy: null },
    { id: 'door_or_n', x: 984, y: 640, w: INNER, h: 88, open: true, requiredBy: null },
    { id: 'door_oo_n', x: 624, y: 500, w: 96, h: INNER, open: true, requiredBy: null },
    { id: 'door_rx_sec', x: 1384, y: 780, w: INNER, h: 100, open: true, requiredBy: null },
    { id: 'door_server', x: 1384, y: 408, w: INNER, h: 80, open: true, requiredBy: null },
    { id: 'door_sv_sec', x: 1504, y: 652, w: 96, h: INNER, open: true, requiredBy: null },
    { id: 'door_bay', x: 1340, y: 180, w: 100, h: INNER, open: true, requiredBy: null },
    { id: 'door_vault', x: 1520, y: 360, w: 100, h: OUTER, open: false, requiredBy: 'vault_lock' },
    // Interior-only hacker shortcuts (no exterior side doors)
    { id: 'door_be', x: 504, y: 132, w: INNER, h: 88, open: false, requiredBy: 'hacker_lock' },
    { id: 'door_break', x: 424, y: 600, w: INNER, h: 100, open: false, requiredBy: 'hacker_lock' },
    { id: 'door_hacker_records', x: 424, y: 780, w: INNER, h: 80, open: false, requiredBy: 'hacker_lock' },
    { id: 'door_svc_arch', x: 1444, y: 240, w: INNER, h: 72, open: false, requiredBy: 'hacker_lock' },
    { id: 'door_hacker_conf', x: 1284, y: 280, w: INNER, h: 52, open: false, requiredBy: 'hacker_lock' },
  ],

  spawns: [
    { x: 1160, y: 1010 },
    { x: 1240, y: 1010 },
    { x: 1160, y: 1050 },
    { x: 1240, y: 1050 },
  ],

  extraction: { x: 1520, y: 80, w: 140, h: 90 },

  // patrol[0] = post; remaining points seed the home wander box
  guards: [
    { id: 'g1', patrol: [{ x: 160, y: 280 }, { x: 420, y: 280 }, { x: 420, y: 300 }, { x: 160, y: 300 }] },
    { id: 'g2', patrol: [{ x: 580, y: 220 }, { x: 780, y: 220 }, { x: 780, y: 300 }, { x: 580, y: 300 }] },
    { id: 'g3', patrol: [{ x: 980, y: 280 }, { x: 1180, y: 280 }, { x: 1180, y: 300 }, { x: 980, y: 300 }] },
    { id: 'g4', patrol: [{ x: 220, y: 430 }, { x: 700, y: 430 }, { x: 1000, y: 430 }, { x: 500, y: 430 }] },
    { id: 'g5', patrol: [{ x: 180, y: 620 }, { x: 220, y: 700 }, { x: 360, y: 700 }, { x: 180, y: 680 }] },
    { id: 'g6', patrol: [{ x: 720, y: 600 }, { x: 720, y: 900 }] },
    { id: 'g7', patrol: [{ x: 180, y: 860 }, { x: 340, y: 860 }, { x: 340, y: 920 }, { x: 180, y: 920 }] },
    { id: 'g8', patrol: [{ x: 1120, y: 600 }, { x: 1280, y: 600 }, { x: 1280, y: 780 }, { x: 1120, y: 780 }] },
    { id: 'g9', patrol: [{ x: 1540, y: 450 }, { x: 1540, y: 560 }] },
    { id: 'g10', patrol: [{ x: 1480, y: 740 }, { x: 1600, y: 740 }, { x: 1600, y: 840 }, { x: 1480, y: 840 }] },
  ],

  cameras: [
    // Front entrance — longer range
    { id: 'cam_entry', x: 1200, y: 940, angle: -Math.PI / 2, sweepA: -Math.PI / 2 - 0.55, sweepB: -Math.PI / 2 + 0.55, dir: 1, range: 150 },
    // Main corridor — mounted on walls, 180° sweep along the hall
    // North wall looking south (0..π)
    { id: 'cam_corridor_w', x: 280, y: 356, angle: Math.PI / 2, sweepA: 0, sweepB: Math.PI, dir: 1, range: 120 },
    // South wall looking north (-π..0)
    { id: 'cam_corridor_m', x: 720, y: 488, angle: -Math.PI / 2, sweepA: -Math.PI, sweepB: 0, dir: 1, range: 120 },
    // North wall looking south (0..π)
    { id: 'cam_corridor_e', x: 1100, y: 356, angle: Math.PI / 2, sweepA: 0, sweepB: Math.PI, dir: 1, range: 120 },
    // Server — longer range
    { id: 'cam_server', x: 1440, y: 620, angle: -0.25, sweepA: -0.7, sweepB: 0.55, dir: 1, range: 150 },
    { id: 'cam_records', x: 140, y: 880, angle: 0, sweepA: -0.4, sweepB: 0.5, dir: 1 },
    { id: 'cam_bay', x: 1650, y: 280, angle: Math.PI, sweepA: Math.PI - 0.4, sweepB: Math.PI + 0.55, dir: 1 },
  ],

  lasers: [
    { id: 'laser_arch_n', x1: 1480, y1: 300, x2: 1656, y2: 300, active: true, disabledBy: 'plate_override' },
    { id: 'laser_arch_s', x1: 1480, y1: 330, x2: 1656, y2: 330, active: true, disabledBy: 'plate_override' },
  ],
  pressurePlates: [],

  mission: {
    // Cooperative anchors reuse existing office guards, doors, and open floor.
    coop: {
      captainId: 'g6',
      electronicDoorId: 'door_be',
      networkCameraId: 'cam_corridor_m',
      reconZone: { x: 700, y: 700, room: 'Open Office' },
      hiddenNode: { x: 760, y: 640, room: 'Open Office' },
      checkpointGuardId: 'g4',
      checkpoint: { x: 700, y: 430, room: 'Main Corridor' },
      distractionZone: { x: 1200, y: 780, room: 'Reception' },
    },
    keys: [
      { id: 'ALPHA', x: 400, y: 290, room: 'Boardroom' },
      { id: 'BRAVO', x: 250, y: 920, room: 'Records' },
    ],
    terminal: { x: 1580 - 2 * U, y: 880, room: 'Security Control' },
    support: { x: 1480, y: 800, room: 'Security Control' },
    lock: { x: 1570, y: 405, room: 'Secure Archive' },
  },

  artifact: { id: 'art_crown', name: 'Diamond', x: 1580, y: 280, value: 500, type: 'high_value' },
};
