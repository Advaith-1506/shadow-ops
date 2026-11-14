/*
 * RENDERER
 * Pure canvas drawing; never mutates simulation state.
 * Layer order (back to front):
 *   1. exterior + floors + decor + drop shadows   (cached static layer)
 *   2. floor-level interactables (extraction, support pad, plates)
 *   3. guard / camera vision
 *   4. walls + furniture                           (cached static layer)
 *   5. doors, lasers, objectives, cameras
 *   6. characters, status effects, labels, prompts
 *   7. screen-space alarm vignette (HUD is drawn separately)
 */

import {
  GUARD_DETECT_R, GUARD_ARC_DEG, CAM_DETECT_R, CAM_ARC_DEG, VAN_INTERACT_R,
} from './constants.js';
import { LEVEL } from './mapData.js';
import { installRoundRect } from './canvasPolyfill.js';
import { buildStaticLayers } from './levelArt.js';
import { OBJECTIVE_COLORS, ROLE_GLYPH, missionStageId, playerColor } from './palette.js';

const OUTLINE = '#2a2019';
const SUPPORT_R = 44;      // matches mission support-pad range

let staticCache = { key: '', layers: null };
// Client-side presentation memory keyed by id (snapshots replace objects).
const facingMemory = new Map();

// ─── Master render call ───────────────────────────────────────────────────────
export function renderGame(ctx, state, tick, camera = { x: 0, y: 0 }, zoom = 1, view = {}) {
  installRoundRect();
  const canvas = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#18201c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(zoom, 0, 0, zoom, -camera.x * zoom, -camera.y * zoom);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const zoomCss = view.zoomCss || zoom;
  const labelScale = Math.max(1, Math.min(1.9, 1 / zoomCss));
  const stage = missionStageId(state);
  const layers = _staticLayers(state, zoom);
  const b = LEVEL.bounds;

  if (layers) ctx.drawImage(layers.floor, b.x, b.y, b.w, b.h);
  _renderExtraction(ctx, state, tick, stage);
  if (state.mission) _renderSupportPad(ctx, state, tick, stage);
  _renderPressurePlates(ctx, state, tick);
  _renderVision(ctx, state);
  if (layers) ctx.drawImage(layers.solids, b.x, b.y, b.w, b.h);
  _renderDoors(ctx, state, tick);
  _renderLasers(ctx, state, tick);
  _renderLegacyProps(ctx, state, tick);
  if (state.mission) _renderObjectives(ctx, state, tick, stage);
  _renderArtifacts(ctx, state, tick);
  _renderCameras(ctx, state, tick);
  _renderCharacters(ctx, state, tick);
  _renderScan(ctx, state, tick);
  _renderDistractions(ctx, state, tick, labelScale);
  _renderLabels(ctx, state, tick, stage, labelScale);
  _renderPrompts(ctx, state, labelScale);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  _renderAlarmVignette(ctx, state, tick);
}

function _staticLayers(state, zoom) {
  if (typeof document === 'undefined') return null;
  const scale = Math.max(0.25, Math.min(3, zoom));
  const key = `${LEVEL.id}:${scale.toFixed(3)}:${state.walls.length}`;
  if (staticCache.key !== key) {
    staticCache = { key, layers: buildStaticLayers(LEVEL, state.walls, scale) };
  }
  return staticCache.layers;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function pulse(tick, speed = 3) {
  return 0.5 + 0.5 * Math.sin(tick * speed);
}

function blockersFor(state) {
  return [...state.walls, ...state.doors.filter((d) => !d.open), ...(state.crates || [])];
}

/** Distance along a ray until it hits any rect (slab method). */
function castRay(ox, oy, ang, maxR, rects) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  let best = maxR;
  for (const r of rects) {
    let tmin = 0;
    let tmax = best;
    if (Math.abs(dx) < 1e-9) {
      if (ox < r.x || ox > r.x + r.w) continue;
    } else {
      let t1 = (r.x - ox) / dx;
      let t2 = (r.x + r.w - ox) / dx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (Math.abs(dy) < 1e-9) {
      if (oy < r.y || oy > r.y + r.h) continue;
    } else {
      let t1 = (r.y - oy) / dy;
      let t2 = (r.y + r.h - oy) / dy;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (tmin < best) best = tmin;
  }
  return best;
}

function label(ctx, text, x, y, color, scale = 1, { bg = 'rgba(28,22,18,0.82)', size = 11 } = {}) {
  ctx.save();
  ctx.font = `700 ${size * scale}px "Rajdhani", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 10 * scale;
  const h = 15 * scale;
  ctx.fillStyle = bg;
  rr(ctx, x - w / 2, y - h / 2, w, h, 4 * scale);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + 0.5 * scale);
  ctx.restore();
}

// ─── Floor-level interactables ────────────────────────────────────────────────
function _renderExtraction(ctx, state, tick, stage) {
  const v = state.van;
  const cx = v.x + v.w / 2;
  const cy = v.y + v.h / 2;
  const hot = stage === 'extract' || !state.mission;
  ctx.save();
  circle(ctx, cx, cy, VAN_INTERACT_R);
  ctx.fillStyle = hot ? `rgba(110,240,160,${0.18 + 0.12 * pulse(tick, 4)})` : 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.setLineDash([10, 7]);
  ctx.lineDashOffset = -tick * 12;
  ctx.lineWidth = 3;
  ctx.strokeStyle = hot ? '#7dffb0' : 'rgba(255,255,255,0.85)';
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = hot ? 'rgba(125,255,176,0.8)' : 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + s * 8 - 6);
    ctx.lineTo(cx, cy + s * 8 + 2);
    ctx.lineTo(cx + 10, cy + s * 8 - 6);
    ctx.stroke();
  }
  ctx.restore();
}

function _renderSupportPad(ctx, state, tick, stage) {
  const sp = state.mission.support;
  const occupied = state.players.some(
    (p) => p.role !== 'Hacker' && !p.downed && Math.hypot(p.x - sp.x, p.y - sp.y) <= SUPPORT_R,
  );
  const hot = stage === 'security';
  ctx.save();
  circle(ctx, sp.x, sp.y, SUPPORT_R);
  ctx.fillStyle = occupied ? 'rgba(180,140,255,0.42)' : `rgba(180,140,255,${hot ? 0.2 + 0.1 * pulse(tick) : 0.14})`;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OBJECTIVE_COLORS.support;
  ctx.stroke();
  circle(ctx, sp.x, sp.y, SUPPORT_R - 9);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  // Two-figure glyph: this pad needs a teammate.
  ctx.fillStyle = 'rgba(120,80,200,0.85)';
  circle(ctx, sp.x - 7, sp.y - 4, 4); ctx.fill();
  circle(ctx, sp.x + 7, sp.y - 4, 4); ctx.fill();
  rr(ctx, sp.x - 13, sp.y + 1, 12, 8, 4); ctx.fill();
  rr(ctx, sp.x + 1, sp.y + 1, 12, 8, 4); ctx.fill();
  ctx.restore();
}

function _renderPressurePlates(ctx, state, tick) {
  for (const p of state.pressurePlates || []) {
    ctx.save();
    ctx.fillStyle = OUTLINE;
    rr(ctx, p.x - 2, p.y - 2, p.w + 4, p.h + 4, 5); ctx.fill();
    ctx.fillStyle = p.activated ? '#6fe39a' : '#8e98a2';
    rr(ctx, p.x, p.y, p.w, p.h, 4); ctx.fill();
    ctx.fillStyle = p.activated ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)';
    rr(ctx, p.x + 5, p.y + 5, p.w - 10, p.h - 10, 3); ctx.fill();
    if (p.activated) {
      circle(ctx, p.x + p.w / 2, p.y + p.h / 2, p.w * 0.8 + 3 * pulse(tick, 6));
      ctx.strokeStyle = 'rgba(111,227,154,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ─── Vision ───────────────────────────────────────────────────────────────────
function _renderVision(ctx, state) {
  const blockers = blockersFor(state);
  const alarmFactor = Math.min(1, Math.max(0, (state.alarm || 0) / 100));
  const farR = GUARD_DETECT_R * (1 + 0.55 * alarmFactor);
  const half = (GUARD_ARC_DEG * Math.PI) / 180 / 2;

  for (const g of state.guards) {
    if (g.stunned > 0) continue;
    const f = Number.isFinite(g.facing) ? g.facing : 0;
    const pts = [[g.x, g.y]];
    const push = (a) => {
      const d = castRay(g.x, g.y, a, farR, blockers);
      pts.push([g.x + Math.cos(a) * d, g.y + Math.sin(a) * d]);
    };
    for (let i = 0; i <= 30; i += 1) push(f - half + (2 * half * i) / 30);

    const chasing = g.mode === 'chase';
    const grad = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, farR);
    if (chasing) {
      grad.addColorStop(0, 'rgba(255,80,60,0.55)');
      grad.addColorStop(1, 'rgba(255,80,60,0.16)');
    } else {
      grad.addColorStop(0, 'rgba(255,244,190,0.62)');
      grad.addColorStop(1, 'rgba(255,236,150,0.18)');
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = chasing ? 'rgba(220,50,40,0.55)' : 'rgba(200,160,60,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (state.mission?.securityOff) return;
  const camHalf = (CAM_ARC_DEG * Math.PI) / 180 / 2;
  for (const c of state.cameras) {
    if (c.disabled > 0) continue;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, CAM_DETECT_R, c.angle - camHalf, c.angle + camHalf);
    ctx.closePath();
    const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, CAM_DETECT_R);
    grad.addColorStop(0, 'rgba(255,150,60,0.5)');
    grad.addColorStop(1, 'rgba(255,150,60,0.14)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,110,30,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ─── Doors ────────────────────────────────────────────────────────────────────
function _renderDoors(ctx, state, tick) {
  for (const d of state.doors) {
    const horizontal = d.w > d.h;
    const isVault = d.id === 'door_vault';
    ctx.save();
    if (d.open) {
      ctx.fillStyle = isVault ? '#8d97a1' : '#b07c4c';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = 'rgba(70,40,20,0.25)';
      if (horizontal) for (let x = d.x + 8; x < d.x + d.w; x += 10) ctx.fillRect(x, d.y + 2, 1, d.h - 4);
      else for (let y = d.y + 8; y < d.y + d.h; y += 10) ctx.fillRect(d.x + 2, y, d.w - 4, 1);
      // Jamb caps make the opening read as a doorway.
      ctx.fillStyle = OUTLINE;
      if (horizontal) {
        ctx.fillRect(d.x - 1, d.y, 4, d.h);
        ctx.fillRect(d.x + d.w - 3, d.y, 4, d.h);
      } else {
        ctx.fillRect(d.x, d.y - 1, d.w, 4);
        ctx.fillRect(d.x, d.y + d.h - 3, d.w, 4);
      }
    } else {
      const depth = 7;
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(d.x - 1.5, d.y - 1.5, d.w + 3, d.h + 3);
      ctx.fillStyle = isVault ? '#5d6773' : '#6e4529';
      ctx.fillRect(d.x, d.y + d.h - depth, d.w, depth);
      ctx.fillStyle = isVault ? '#8f9aa6' : '#9a6538';
      ctx.fillRect(d.x, d.y, d.w, d.h - depth);
      if (isVault) {
        ctx.fillStyle = '#e2b84f';
        if (horizontal) for (let x = d.x + 10; x < d.x + d.w; x += 18) ctx.fillRect(x, d.y + 2, 4, d.h - depth - 4);
        else for (let y = d.y + 10; y < d.y + d.h - depth; y += 18) ctx.fillRect(d.x + 3, y, d.w - 6, 4);
        circle(ctx, d.x + d.w / 2, d.y + (d.h - depth) / 2, 6);
        ctx.fillStyle = state.mission?.securityOff ? '#6fe39a' : '#ff5a4a';
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(40,20,5,0.4)';
        if (horizontal) ctx.fillRect(d.x + d.w / 2 - 1, d.y + 2, 2, d.h - depth - 4);
        else ctx.fillRect(d.x + 2, d.y + d.h / 2 - 1, d.w - 4, 2);
        // Hacker-unlockable badge.
        const bx = d.x + d.w / 2;
        const by = d.y + (d.h - depth) / 2;
        circle(ctx, bx, by, 7 + pulse(tick, 3));
        ctx.fillStyle = OBJECTIVE_COLORS.terminal;
        ctx.fill();
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#10324a';
        ctx.font = '700 9px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', bx, by + 0.5);
      }
    }
    ctx.restore();
  }
}

// ─── Lasers ───────────────────────────────────────────────────────────────────
function _renderLasers(ctx, state, tick) {
  for (const l of state.lasers) {
    ctx.save();
    if (l.active) {
      const a = 0.7 + 0.3 * Math.sin(tick * 14 + l.y1);
      ctx.strokeStyle = `rgba(255,59,78,${0.28 * a})`;
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,90,100,${a})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,230,230,0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(80,60,60,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const [x, y] of [[l.x1, l.y1], [l.x2, l.y2]]) {
      ctx.fillStyle = OUTLINE;
      rr(ctx, x - 5, y - 5, 10, 10, 2); ctx.fill();
      ctx.fillStyle = l.active ? '#ff3b4e' : '#6b5d5d';
      circle(ctx, x, y, 2.8); ctx.fill();
    }
    ctx.restore();
  }
}

// ─── Objectives ───────────────────────────────────────────────────────────────
function _renderObjectives(ctx, state, tick, stage) {
  const m = state.mission;
  for (const k of m.keys) {
    if (k.collected) continue;
    const bob = Math.sin(tick * 3 + k.x) * 2;
    ctx.save();
    circle(ctx, k.x, k.y, 16 + 3 * pulse(tick, 4));
    ctx.fillStyle = `rgba(75,224,138,${stage === 'keys' ? 0.28 : 0.15})`;
    ctx.fill();
    ctx.translate(k.x, k.y + bob);
    ctx.rotate(-0.35);
    ctx.fillStyle = OUTLINE;
    rr(ctx, -11, -8, 22, 16, 3); ctx.fill();
    ctx.fillStyle = OBJECTIVE_COLORS.key;
    rr(ctx, -9.5, -6.5, 19, 13, 2); ctx.fill();
    ctx.fillStyle = '#1d5c3a';
    ctx.fillRect(-9.5, -3, 19, 3);
    ctx.fillStyle = '#e9fff1';
    ctx.fillRect(3, 2, 4, 3);
    ctx.restore();
  }

  const t = m.terminal;
  ctx.save();
  const termCol = m.securityOff ? '#6fe39a' : OBJECTIVE_COLORS.terminal;
  circle(ctx, t.x, t.y, 15);
  ctx.fillStyle = m.securityOff ? 'rgba(111,227,154,0.25)' : `rgba(88,198,255,${stage === 'security' ? 0.25 + 0.15 * pulse(tick, 4) : 0.18})`;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = termCol;
  ctx.stroke();
  ctx.fillStyle = termCol;
  ctx.beginPath();
  ctx.moveTo(t.x - 5, t.y + 3); ctx.lineTo(t.x + 5, t.y + 3); ctx.lineTo(t.x, t.y + 9); ctx.closePath();
  ctx.fill();
  ctx.font = '700 10px "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(m.securityOff ? 'OK' : 'H', t.x, t.y - 3);
  ctx.restore();

  const l = m.lock;
  ctx.save();
  ctx.translate(l.x, l.y);
  const open = state.vaultUnlocked;
  const lockHot = stage === 'vault';
  if (lockHot) {
    circle(ctx, 0, 0, 16 + 3 * pulse(tick, 4));
    ctx.fillStyle = 'rgba(242,193,78,0.3)';
    ctx.fill();
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(open ? 4 : 0, -4, 5.5, Math.PI, open ? Math.PI * 1.9 : 0);
  ctx.stroke();
  ctx.strokeStyle = open ? '#6fe39a' : '#d6dbe0';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  rr(ctx, -9, -4, 18, 14, 3); ctx.fill();
  ctx.fillStyle = open ? '#6fe39a' : OBJECTIVE_COLORS.lock;
  rr(ctx, -7.5, -2.5, 15, 11, 2); ctx.fill();
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-1, 0, 2, 5);
  ctx.restore();
}

function _drawDiamond(ctx, x, y, s, tick) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(-11, -4); ctx.lineTo(-6, -10); ctx.lineTo(6, -10); ctx.lineTo(11, -4); ctx.lineTo(0, 11); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9fe9ff';
  ctx.beginPath();
  ctx.moveTo(-9, -4); ctx.lineTo(-5, -8.5); ctx.lineTo(5, -8.5); ctx.lineTo(9, -4); ctx.lineTo(0, 8.5); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8fbff';
  ctx.beginPath();
  ctx.moveTo(-9, -4); ctx.lineTo(9, -4); ctx.lineTo(0, 8.5); ctx.closePath();
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-5, -8.5); ctx.lineTo(-2, -4); ctx.lineTo(2, -8.5); ctx.closePath();
  ctx.fill();
  const sp = pulse(tick, 5);
  ctx.strokeStyle = `rgba(255,255,255,${0.4 + 0.6 * sp})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, -13 - sp * 2); ctx.lineTo(8, -7 + sp * 2);
  ctx.moveTo(5 - sp * 2, -10); ctx.lineTo(11 + sp * 2, -10);
  ctx.stroke();
  ctx.restore();
}

function _renderArtifacts(ctx, state, tick) {
  for (const a of state.artifacts) {
    if (a.pickedUp) continue;
    if (a.type === 'high_value' || state.mission) {
      const g = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, 30);
      g.addColorStop(0, `rgba(190,245,255,${0.45 + 0.2 * pulse(tick, 3)})`);
      g.addColorStop(1, 'rgba(190,245,255,0)');
      ctx.fillStyle = g;
      circle(ctx, a.x, a.y, 30);
      ctx.fill();
      _drawDiamond(ctx, a.x, a.y - 2 + Math.sin(tick * 2) * 1.5, 1.15, tick);
    } else {
      ctx.fillStyle = '#ffd54f';
      circle(ctx, a.x, a.y, 8);
      ctx.fill();
    }
  }
}

// Legacy puzzle objects (only drawn if a level defines them).
function _renderLegacyProps(ctx, state) {
  for (const c of state.crates || []) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(c.x - 1.5, c.y - 1.5, c.w + 3, c.h + 3);
    ctx.fillStyle = '#d49b56';
    ctx.fillRect(c.x, c.y, c.w, c.h);
  }
  for (const sw of state.switches || []) {
    ctx.fillStyle = sw.activated ? '#7e57c2' : '#4527a0';
    ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
  }
  for (const v of state.vents || []) {
    ctx.fillStyle = '#56636b';
    ctx.fillRect(v.entryX, v.entryY, v.entryW, v.entryH);
    ctx.fillRect(v.exitX, v.exitY, v.exitW, v.exitH);
  }
}

// ─── Cameras ──────────────────────────────────────────────────────────────────
function _renderCameras(ctx, state, tick) {
  for (const c of state.cameras) {
    const off = state.mission?.securityOff || c.disabled > 0;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = OUTLINE;
    rr(ctx, -6, -6.5, 16, 13, 3); ctx.fill();
    ctx.fillStyle = off ? '#8d9399' : '#e8ecef';
    rr(ctx, -4.5, -5, 13, 10, 2); ctx.fill();
    ctx.fillStyle = off ? '#5b6167' : '#26323d';
    circle(ctx, 8, 0, 3.5); ctx.fill();
    ctx.restore();
    if (!off && Math.sin(tick * 6) > 0) {
      ctx.fillStyle = '#ff3b30';
      circle(ctx, c.x, c.y, 2.2); ctx.fill();
    }
  }
}

// ─── Characters ───────────────────────────────────────────────────────────────
function _playerFacing(p) {
  const mem = facingMemory.get(p.id) || { x: p.x, y: p.y, facing: -Math.PI / 2, moving: 0 };
  const dx = p.x - mem.x;
  const dy = p.y - mem.y;
  if (Math.hypot(dx, dy) > 0.3) {
    mem.facing = Math.atan2(dy, dx);
    mem.moving = 0.15;
  } else {
    mem.moving = Math.max(0, mem.moving - 1 / 60);
  }
  mem.x = p.x;
  mem.y = p.y;
  facingMemory.set(p.id, mem);
  return mem;
}

function _drawPerson(ctx, x, y, facing, { body, dark, head, hat, size = 1, walk = 0, tick = 0 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(30,20,10,0.32)';
  ctx.beginPath();
  ctx.ellipse(1.5, 4, 13 * size, 9 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(facing);
  ctx.scale(size, size);
  const swing = walk ? Math.sin(tick * 14) * 3 : 0;
  // Hands
  ctx.fillStyle = OUTLINE;
  circle(ctx, 4 + swing, -10, 3.6); ctx.fill();
  circle(ctx, 4 - swing, 10, 3.6); ctx.fill();
  ctx.fillStyle = head;
  circle(ctx, 4 + swing, -10, 2.4); ctx.fill();
  circle(ctx, 4 - swing, 10, 2.4); ctx.fill();
  // Shoulders
  ctx.fillStyle = OUTLINE;
  ctx.beginPath(); ctx.ellipse(0, 0, 9.5, 13.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(-3.5, 0, 4, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = OUTLINE;
  circle(ctx, 1.5, 0, 7.2); ctx.fill();
  ctx.fillStyle = head;
  circle(ctx, 1.5, 0, 5.8); ctx.fill();
  ctx.fillStyle = hat;
  ctx.beginPath(); ctx.arc(1.5, 0, 5.8, Math.PI * 0.55, Math.PI * 1.45); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-0.5, 0, 3.6, 5.6, 0, 0, Math.PI * 2); ctx.fill();
  // Facing nub
  ctx.fillStyle = OUTLINE;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(10, -3.5); ctx.lineTo(10, 3.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function _renderCharacters(ctx, state, tick) {
  const actors = [
    ...state.guards.map((g) => ({ kind: 'guard', o: g })),
    ...state.players.map((p) => ({ kind: 'player', o: p })),
  ].sort((a, b) => a.o.y - b.o.y);
  for (const a of actors) {
    if (a.kind === 'guard') _drawGuard(ctx, a.o, tick);
    else _drawPlayer(ctx, a.o, tick);
  }
}

function _drawGuard(ctx, g, tick) {
  const stunned = g.stunned > 0;
  const facing = Number.isFinite(g.facing) ? g.facing : 0;
  _drawPerson(ctx, g.x, g.y, facing, {
    body: stunned ? '#7d8590' : '#2f4370',
    dark: stunned ? '#636a73' : '#1f2d4d',
    head: '#e5b48f',
    hat: stunned ? '#8d6e6a' : '#d8423a',
    size: 1.05,
    walk: !stunned,
    tick,
  });
  if (!stunned) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(facing);
    ctx.fillStyle = OUTLINE;
    rr(ctx, 6, 8, 10, 5, 1.5); ctx.fill();
    ctx.fillStyle = '#ffe58a';
    ctx.fillRect(14, 9, 2.5, 3);
    ctx.restore();
  }
  if (stunned) {
    ctx.save();
    for (let i = 0; i < 3; i += 1) {
      const a = tick * 4 + (i * Math.PI * 2) / 3;
      ctx.fillStyle = '#ffe066';
      circle(ctx, g.x + Math.cos(a) * 12, g.y - 4 + Math.sin(a) * 5, 2.5);
      ctx.fill();
    }
    ctx.restore();
  }
}

function _drawPlayer(ctx, p, tick) {
  const mem = _playerFacing(p);
  const col = playerColor(p.id);
  if (p.detected > 0 && !p.downed) {
    circle(ctx, p.x, p.y, p.r + 9 + Math.sin(tick * 14) * 2);
    ctx.strokeStyle = `rgba(255,40,60,${Math.min(1, p.detected * 2)})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // Identity ring under the character.
  circle(ctx, p.x, p.y, p.r + 5);
  ctx.fillStyle = `${col}55`;
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (p.downed) {
    _drawPerson(ctx, p.x, p.y, mem.facing, { body: '#8a8f96', dark: '#6b7077', head: '#d9b8a0', hat: '#555b62', tick });
    const frac = Math.max(0, Math.min(1, (p.custodyTimer || 0) / 20));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.strokeStyle = '#ff5a5a';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    if (p.reviveProgress > 0) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p.reviveProgress / 2));
      ctx.strokeStyle = '#6fe39a';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    return;
  }
  _drawPerson(ctx, p.x, p.y, mem.facing, {
    body: col,
    dark: 'rgba(0,0,0,0.28)',
    head: '#f0c39a',
    hat: '#2b2b33',
    walk: mem.moving > 0,
    tick,
  });
  if (p.holding) _drawDiamond(ctx, p.x + 12, p.y - 14, 0.7, tick);
}

function _renderScan(ctx, state, tick) {
  for (const p of state.players) {
    if (!(p.scanTime > 0)) continue;
    ctx.save();
    circle(ctx, p.x, p.y, 360);
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = tick * 20;
    ctx.strokeStyle = 'rgba(99,231,255,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    const threats = [
      ...state.guards.map((g) => ({ x: g.x, y: g.y })),
      ...state.cameras.map((c) => ({ x: c.x, y: c.y })),
      ...state.lasers.filter((l) => l.active).map((l) => ({ x: l.x1, y: l.y1 })),
    ];
    ctx.strokeStyle = '#63e7ff';
    ctx.lineWidth = 2.5;
    for (const t of threats) {
      if (Math.hypot(t.x - p.x, t.y - p.y) > 360) continue;
      const s = 17 + 2 * pulse(tick, 6);
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(t.x + sx * s, t.y + sy * (s - 6));
        ctx.lineTo(t.x + sx * s, t.y + sy * s);
        ctx.lineTo(t.x + sx * (s - 6), t.y + sy * s);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// ─── Labels and prompts ───────────────────────────────────────────────────────
function _renderLabels(ctx, state, tick, stage, scale) {
  const m = state.mission;
  const v = state.van;
  label(ctx, 'EXTRACTION', v.x + v.w / 2, v.y + v.h / 2 - VAN_INTERACT_R - 10 * scale,
    stage === 'extract' ? '#7dffb0' : '#ffffff', scale);

  if (m) {
    for (const k of m.keys) {
      if (!k.collected) label(ctx, `KEY ${k.id}`, k.x, k.y - 24 * scale, OBJECTIVE_COLORS.key, scale);
    }
    label(ctx, m.securityOff ? 'SECURITY OFF' : 'TERMINAL', m.terminal.x, m.terminal.y - 24 * scale,
      m.securityOff ? '#6fe39a' : OBJECTIVE_COLORS.terminal, scale);
    if (!m.securityOff) {
      label(ctx, 'SUPPORT PAD', m.support.x, m.support.y - 52 * scale, OBJECTIVE_COLORS.support, scale);
    }
    label(ctx, state.vaultUnlocked ? 'VAULT OPEN' : 'VAULT LOCK', m.lock.x - 24 * scale, m.lock.y - 24 * scale,
      state.vaultUnlocked ? '#6fe39a' : OBJECTIVE_COLORS.lock, scale);
    const a = state.artifacts[0];
    if (a && !a.pickedUp) label(ctx, 'DIAMOND', a.x, a.y + 30 * scale, OBJECTIVE_COLORS.diamond, scale);
    for (const p of state.pressurePlates || []) {
      if (!m.securityOff) label(ctx, p.label || 'PLATE', p.x + p.w / 2, p.y + p.h + 12 * scale, p.activated ? '#6fe39a' : '#d6dbe0', scale * 0.85);
    }
    for (const d of state.doors) {
      if (!d.open && d.id !== 'door_vault') {
        label(ctx, 'HACKER DOOR', d.x + d.w / 2, d.y - 14 * scale, OBJECTIVE_COLORS.terminal, scale * 0.85);
      }
    }
  }

  for (const c of state.cameras) {
    if (c.disabled > 0 && !m?.securityOff) {
      label(ctx, `CAM OFF ${Math.ceil(c.disabled)}s`, c.x, c.y - 16 * scale, '#6fe39a', scale * 0.85);
    }
  }
  for (const g of state.guards) {
    if (g.stunned > 0) label(ctx, `STUNNED ${Math.ceil(g.stunned)}s`, g.x, g.y - 24 * scale, '#ffe066', scale * 0.85);
    else if (g.mode === 'chase') label(ctx, '!', g.x, g.y - 24 * scale, '#ffffff', scale * 1.1, { bg: '#d8423a' });
    else if (g.alertTimer > 0) label(ctx, '?', g.x, g.y - 24 * scale, '#2a2019', scale, { bg: '#ffd166' });
  }
  for (const p of state.players) {
    const col = playerColor(p.id);
    const glyph = ROLE_GLYPH[p.role] || '';
    const who = p.nickname ? p.nickname : `P${p.id}`;
    const text = p.downed
      ? `${who} DOWN ${Math.ceil(p.custodyTimer || 0)}s`
      : `${who} ${glyph}`;
    label(ctx, text, p.x, p.y - 25 * scale, p.downed ? '#ffb3b3' : col, scale * 0.9);
  }
}

function _renderDistractions(ctx, state, tick, scale) {
  for (const d of state.distractions || []) {
    const pulse = 0.55 + 0.45 * Math.sin(tick * 8);
    ctx.save();
    ctx.strokeStyle = `rgba(209,162,255,${0.25 + 0.2 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 260, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(209,162,255,${0.18 + 0.12 * pulse})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 18 + 4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    label(ctx, `NOISE ${Math.ceil(d.remaining)}s`, d.x, d.y - 28 * scale, '#d1a2ff', scale);
  }
}

function _renderPrompts(ctx, state, scale) {
  for (const p of state.players) {
    const pr = p.nearPrompt;
    if (!pr || p.downed) continue;
    label(ctx, pr.text, p.x, p.y + 28 * scale, pr.warn ? '#ffd0d0' : '#ffe08a', scale * 0.95, {
      bg: pr.warn ? 'rgba(150,30,30,0.9)' : 'rgba(28,22,18,0.9)',
    });
  }
}

// ─── Screen-space alarm vignette ──────────────────────────────────────────────
function _renderAlarmVignette(ctx, state, tick) {
  if (state.screen !== 'playing' || (state.alarm || 0) < 40) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const frac = (state.alarm - 40) / 60;
  const alpha = frac * 0.45 * (0.75 + 0.25 * Math.sin(tick * 8));
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(255,30,50,0)');
  g.addColorStop(1, `rgba(255,30,50,${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}