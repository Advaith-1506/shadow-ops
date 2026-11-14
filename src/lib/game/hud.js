/*
 * HUD
 * Screen-space status around the fixed level view: a top status bar
 * (objective, alert, time, connection state) and a player panel (role,
 * status, ability readiness). Never drawn over the gameplay rectangle.
 */

import { MAX_ALARM } from './constants.js';
import { missionStage, objectiveSummary } from './mission.js';
import { COOLDOWNS } from './mission.js';
import { LEVEL } from './mapData.js';
import { LEAVE_BUTTON_W } from './viewLayout.js';
import { OBJECTIVE_COLORS, missionStageId, playerColor } from './palette.js';

const FONT = '"Rajdhani", sans-serif';
const INK = '#f4ead8';
const MUTED = 'rgba(244,234,216,0.62)';
const PANEL_BG = '#231b16';
const CARD_BG = '#2f251e';

const ABILITY = { Assassin: 'STUN', Hacker: 'HACK', Scout: 'SCAN', Decoy: 'NOISE' };
const LOCAL_KEYS = {
  1: 'WASD · E · Q',
  2: 'ARROWS · ENTER · /',
  3: 'TFGH · R · Y',
  4: 'IJKL · O · P',
};

const STEPS = [
  { id: 'keys', text: 'KEYS' },
  { id: 'security', text: 'SECURITY' },
  { id: 'vault', text: 'VAULT' },
  { id: 'diamond', text: 'DIAMOND' },
  { id: 'extract', text: 'EXTRACT' },
];

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

function objectiveText(s) {
  const m = s.mission;
  if (!m) return 'Reach the extraction zone';
  if (m.config) return `${m.config.variant}: ${missionStage(s)}`;
  const stage = missionStageId(s);
  const missing = m.keys.filter((k) => !k.collected).map((k) => {
    const def = LEVEL.mission.keys.find((d) => d.id === k.id);
    return def ? `${k.id} (${def.room})` : k.id;
  });
  switch (stage) {
    case 'keys': return `Collect access keys: ${missing.join(' · ')}`;
    case 'security': return 'Security room: Hacker at terminal + teammate on support pad';
    case 'vault': return 'Unlock the vault door from the living room';
    case 'diamond': return 'Grab the Diamond from the vault';
    default: return 'Whole team to the extraction zone with the Diamond';
  }
}

export function renderHUD(ctx, state, hud = {}) {
  const dpr = hud.dpr || 1;
  const layout = hud.layout;
  if (!layout) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = 'middle';
  _topBar(ctx, state, layout, hud);
  _playerPanel(ctx, state, layout, hud);
  ctx.restore();
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function _topBar(ctx, s, layout, hud) {
  const { top, compact, tiny } = layout;
  const H = top.h;
  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(top.x, top.y, top.w, H);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(top.x, H - 2, top.w, 2);

  const pad = tiny ? 8 : 12;
  const right = top.w - LEAVE_BUTTON_W - pad;
  let x = pad;

  if (!tiny) {
    ctx.font = `700 ${compact ? 13 : 15}px ${FONT}`;
    ctx.fillStyle = '#ffcf6e';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOW OPS', x, H * (compact ? 0.5 : 0.36));
    if (!compact) {
      ctx.font = `600 11px ${FONT}`;
      ctx.fillStyle = MUTED;
      ctx.fillText(LEVEL.name.toUpperCase(), x, H * 0.7);
    }
    x += compact ? 92 : 150;
  }

  // Time
  const timeW = tiny ? 46 : 62;
  const timeX = right - timeW;
  const mins = Math.floor(Math.max(0, s.timer) / 60);
  const secs = Math.floor(Math.max(0, s.timer) % 60);
  ctx.textAlign = 'right';
  ctx.font = `700 ${tiny ? 16 : compact ? 20 : 24}px ${FONT}`;
  ctx.fillStyle = s.timer < 30 ? '#ff6b6b' : s.timer < 60 ? '#ffcf6e' : INK;
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, right, H / 2 + 1);

  // Alert meter
  const alertW = Math.round(Math.max(90, Math.min(220, top.w * 0.16)));
  const ax = timeX - 14 - alertW;
  const frac = Math.max(0, Math.min(1, s.alarm / MAX_ALARM));
  const col = frac < 0.4 ? '#6fd38a' : frac < 0.7 ? '#ffb547' : '#ff5a5a';
  ctx.textAlign = 'left';
  ctx.font = `700 ${tiny ? 10 : 11}px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText('ALERT', ax, H * 0.3);
  ctx.textAlign = 'right';
  ctx.fillStyle = col;
  ctx.fillText(`${Math.floor(s.alarm)}%`, ax + alertW, H * 0.3);
  const barY = H * 0.52;
  const barH = tiny ? 6 : 9;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  rr(ctx, ax, barY, alertW, barH, barH / 2); ctx.fill();
  ctx.fillStyle = col;
  rr(ctx, ax, barY, Math.max(barH, alertW * frac), barH, barH / 2); ctx.fill();

  // Objective (or connection banner)
  const objX = x;
  const objW = ax - 18 - objX;
  if (objW < 60) return;
  if (hud.net?.paused) {
    const blink = 0.6 + 0.4 * Math.sin(performance.now() / 200);
    ctx.fillStyle = `rgba(200,50,50,${0.85})`;
    rr(ctx, objX, 6, objW, H - 12, 6); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${blink})`;
    ctx.beginPath(); ctx.arc(objX + 14, H / 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = `700 ${tiny ? 11 : 13}px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(fitText(ctx, 'CONNECTION LOST · MISSION PAUSED · RECONNECTING (30s window)', objW - 30), objX + 26, H / 2 + 1);
    return;
  }

  const stage = missionStageId(s);
  const steps = s.mission?.config
    ? objectiveSummary(s).map((o) => ({
        id: o.id,
        text: o.id.replace("_", " ").toUpperCase(),
        done: o.phase === "complete",
        active: o.phase === "available" || o.phase === "in_progress",
      }))
    : STEPS;
  const stepIdx = s.mission?.config
    ? Math.max(
        0,
        steps.findIndex((st) => st.active),
      )
    : Math.max(
        0,
        steps.findIndex((st) => st.id === stage),
      );
  const showSteps = !!s.mission && !compact && objW > 380;
  let tx = objX;
  if (showSteps) {
    for (let i = 0; i < steps.length; i += 1) {
      const done = s.mission?.config ? steps[i].done : i < stepIdx;
      const cur = s.mission?.config ? steps[i].active : i === stepIdx;
      ctx.fillStyle = done
        ? "#6fd38a"
        : cur
          ? "#ffcf6e"
          : "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(tx + 5, H * 0.32, 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (i < steps.length - 1) {
        ctx.fillStyle = done ? "#6fd38a" : "rgba(255,255,255,0.18)";
        ctx.fillRect(tx + 11, H * 0.32 - 1, 14, 2);
      }
      tx += 30;
    }
    ctx.textAlign = "left";
    ctx.font = `700 11px ${FONT}`;
    ctx.fillStyle = "#ffcf6e";
    ctx.fillText(
      `STEP ${stepIdx + 1}/${steps.length} · ${steps[stepIdx].text}`,
      objX + steps.length * 30 + 6,
      H * 0.32,
    );
  }
  ctx.textAlign = "left";
  ctx.font = `700 ${tiny ? 12 : compact ? 14 : 15}px ${FONT}`;
  ctx.fillStyle = INK;
  const keysDone = s.mission
    ? s.mission.keys.filter((k) => k.collected).length
    : 0;
  const prefix =
    s.mission && !showSteps ? `${stepIdx + 1}/${steps.length} ` : "";
  const text = `${prefix}${objectiveText(s)}${!s.mission?.config && stage === "keys" ? `  [${keysDone}/2]` : ""}`;
  ctx.fillText(fitText(ctx, text, objW), objX, showSteps ? H * 0.7 : H / 2 + 1);
}

// ─── Player panel ─────────────────────────────────────────────────────────────
function _status(p) {
  if (p.downed) return { text: `CAPTURED · ${Math.ceil(p.custodyTimer || 0)}s TO REVIVE`, color: '#ff8a8a' };
  if (p.holding) return { text: p.atVan ? 'AT EXTRACTION · DIAMOND' : 'CARRYING DIAMOND', color: OBJECTIVE_COLORS.diamond };
  if (p.atVan) return { text: 'AT EXTRACTION', color: '#7dffb0' };
  if (p.detected > 0) return { text: 'SPOTTED!', color: '#ff6b6b' };
  return { text: 'ACTIVE', color: MUTED };
}

function _card(ctx, p, x, y, w, h, opts) {
  const col = playerColor(p.id);
  const small = h < 46;
  ctx.fillStyle = CARD_BG;
  rr(ctx, x, y, w, h, 6); ctx.fill();
  if (opts.me) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    rr(ctx, x + 1, y + 1, w - 2, h - 2, 6); ctx.stroke();
  }
  ctx.fillStyle = col;
  rr(ctx, x, y, 5, h, 3); ctx.fill();

  const ix = x + 12;
  const iw = w - 20;
  const role = (p.role || '').toUpperCase();
  ctx.textAlign = 'left';
  ctx.font = `700 ${small ? 12 : 14}px ${FONT}`;
  ctx.fillStyle = col;
  ctx.fillText(`P${p.id}`, ix, y + (small ? h * 0.3 : 13));
  ctx.fillStyle = INK;
  ctx.fillText(fitText(ctx, `${role}${opts.me ? ' · YOU' : ''}`, iw - 26), ix + 24, y + (small ? h * 0.3 : 13));

  const st = _status(p);
  ctx.font = `700 ${small ? 10 : 11}px ${FONT}`;
  ctx.fillStyle = st.color;
  ctx.fillText(fitText(ctx, st.text, iw), ix, y + (small ? h * 0.72 : 29));

  if (small || h < 52 || p.downed) return;
  const cd = p.abilityCooldown || 0;
  const total = COOLDOWNS[p.role] || 1;
  const ready = cd <= 0;
  const barY = y + 40;
  const barW = iw;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  rr(ctx, ix, barY, barW, 6, 3); ctx.fill();
  ctx.fillStyle = ready ? '#6fd38a' : '#ffb547';
  rr(ctx, ix, barY, Math.max(6, barW * (ready ? 1 : 1 - cd / total)), 6, 3); ctx.fill();
  if (h >= 62) {
    ctx.font = `700 10px ${FONT}`;
    ctx.fillStyle = ready ? '#6fd38a' : '#ffcf6e';
    const ab = ABILITY[p.role] ? `${ABILITY[p.role]} ` : '';
    ctx.fillText(ready ? `${ab}READY` : `${ab}${Math.ceil(cd)}s`, ix, barY + 15);
    if (opts.keys) {
      ctx.textAlign = 'right';
      ctx.fillStyle = MUTED;
      ctx.fillText(opts.keys, ix + barW, barY + 15);
    }
  }
}

function _playerPanel(ctx, s, layout, hud) {
  const panel = layout.panel;
  const players = s.players || [];
  if (!panel || !players.length) return;
  const net = hud.net || {};
  const lan = net.mode === 'server';
  const gap = layout.tiny ? 4 : 6;

  if (panel.mode === 'side') {
    const footerH = layout.touch ? 0 : 34;
    const avail = panel.h - footerH;
    const cardH = Math.max(28, Math.min(78, (avail - gap * (players.length - 1)) / players.length));
    players.forEach((p, i) => {
      _card(ctx, p, panel.x, panel.y + i * (cardH + gap), panel.w, cardH, {
        me: lan && p.id === net.myPlayerId,
        keys: lan ? null : LOCAL_KEYS[p.id],
      });
    });
    if (footerH) {
      const fy = panel.y + panel.h - footerH;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      rr(ctx, panel.x, fy, panel.w, footerH, 6); ctx.fill();
      ctx.textAlign = 'left';
      ctx.font = `700 10px ${FONT}`;
      ctx.fillStyle = MUTED;
      ctx.fillText(lan ? 'MOVE WASD/ARROWS · E INTERACT' : 'E/ENTER INTERACT · HOLD TO REVIVE', panel.x + 8, fy + 11);
      ctx.fillText(lan ? 'Q ABILITY · SERVER AUTHORITATIVE' : 'Q ABILITY · ESC PAUSE', panel.x + 8, fy + 24);
    }
    return;
  }

  const cols = layout.portrait ? Math.min(2, players.length) : players.length;
  const rows = Math.ceil(players.length / cols);
  const cardW = (panel.w - gap * (cols - 1)) / cols;
  const cardH = (panel.h - gap * (rows - 1)) / rows;
  players.forEach((p, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    _card(ctx, p, panel.x + c * (cardW + gap), panel.y + r * (cardH + gap), cardW, cardH, {
      me: lan && p.id === net.myPlayerId,
      keys: null,
    });
  });
}
