import { ACTIVE_LEVEL } from './levels/index.js';

// ─── World bounds (from the active level) ─────────────────────────────────────
export const CANVAS_W = ACTIVE_LEVEL.bounds.w;
export const CANVAS_H = ACTIVE_LEVEL.bounds.h;
export const TILE = 32;

// ─── Game rules ───────────────────────────────────────────────────────────────
export const GAME_TIME = 600;        // seconds (10 minutes)
export const MAX_ALARM = 100;
export const REQUIRED_ARTIFACTS = 3;
export const REQUIRED_HIGH_VALUE = 1;

// ─── Player ───────────────────────────────────────────────────────────────────
export const P1_BASE_SPEED = 140;    // px / sec  (Fast Thief)
export const P2_BASE_SPEED = 105;    // px / sec  (Strong Thief)
export const PLAYER_R = 10;          // collision radius (px)

// Carry penalties (px/sec reduction)
export const CARRY_SLOW_NORMAL = 20;
export const CARRY_SLOW_HEAVY  = 45;

// ─── Guards ───────────────────────────────────────────────────────────────────
export const GUARD_SPEED         = 78;   // px / sec
export const GUARD_DETECT_R      = 80;   // px – sight radius
export const GUARD_TOUCH_R       = 18;   // px – contact radius
export const GUARD_ALARM_RATE    = 18;   // alarm / sec while in sight
export const GUARD_TOUCH_ALARM   = 35;   // instant alarm on touch

// ─── Cameras ──────────────────────────────────────────────────────────────────
export const CAM_DETECT_R     = 96;     // px – vision cone length
export const CAM_ARC_DEG      = 80;     // cone full-angle in degrees
export const CAM_SWEEP_RAD_S  = 0.55;   // radians swept per second
export const CAM_ALARM_RATE   = 12;     // alarm / sec while in cone

// ─── Lasers ───────────────────────────────────────────────────────────────────
export const LASER_ALARM_RATE = 22;     // alarm / sec while crossing beam

// ─── Interaction ──────────────────────────────────────────────────────────────
export const INTERACT_R    = 38;   // px – pickup / switch / vent range
export const VAN_INTERACT_R = 58;  // px – deposit range at van

// ─── Render colours ───────────────────────────────────────────────────────────
export const C = {
  bg:           '#0d1117',
  wall:         '#1c2333',
  wallEdge:     '#2d3f5e',
  floor:        '#141b27',
  floorAlt:     '#111822',
  door:         '#3a4a6b',
  doorOpen:     '#0f1923',
  p1:           '#4fc3f7',
  p2:           '#ff8a65',
  p1Dark:       '#1a6a8a',
  p2Dark:       '#8a3c1a',
  guard:        '#e53935',
  guardVision:  'rgba(229,57,53,0.10)',
  camera:       '#ff6f00',
  cameraVision: 'rgba(255,111,0,0.09)',
  laserOn:      '#ff1744',
  laserOff:     '#333',
  artifact:     '#ffd54f',
  artifactHigh: '#ffab00',
  artifactHeavy:'#8d6e63',
  plate:        '#2e7d32',
  plateOn:      '#66bb6a',
  sw:           '#4527a0',
  swOn:         '#7e57c2',
  vent:         '#37474f',
  crate:        '#4e342e',
  van:          '#00695c',
  vanBorder:    '#1de9b6',
  gold:         '#ffd54f',
  glass:        'rgba(160,210,255,0.10)',
  glassBorder:  'rgba(160,210,255,0.22)',
};
