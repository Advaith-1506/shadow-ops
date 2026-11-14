/*
 * RENDERER  –  Museum Break
 * Pure canvas drawing.  No game-state mutations.
 * Render order (painter's algorithm, back to front):
 *   floor → room labels → pressure plates → lasers → walls → doors
 *   → display cases → artifacts → crates → vents → switches
 *   → cameras → guards → van → players → prompts → alarm overlay
 */

import {
  C, CANVAS_W, CANVAS_H, TILE,
  GUARD_DETECT_R, CAM_DETECT_R, CAM_ARC_DEG,
} from './constants.js';
import { roomLabels, displayCases } from './mapData.js';
import { installRoundRect } from './canvasPolyfill.js';
import { ANIM, drawStripFrame, getSprites } from './spriteAssets.js';

// ─── Master render call ───────────────────────────────────────────────────────
export function renderGame(ctx, state, tick, camera = { x: 0, y: 0 }, zoom = 1, view = { w: CANVAS_W, h: CANVAS_H }) {
  installRoundRect(); // ensure polyfill is applied
  const S = getSprites();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-camera.x, -camera.y);

  _renderFloor(ctx, S);
  _renderRoomLabels(ctx);
  _renderPressurePlates(ctx, state);
  _renderLasers(ctx, state, tick);
  _renderWalls(ctx, state, S);
  _renderDoors(ctx, state);
  _renderDisplayCases(ctx, state);
  _renderArtifacts(ctx, state, tick);
  _renderCrates(ctx, state, S);
  _renderVents(ctx, state, tick);
  _renderSwitches(ctx, state);
  _renderCameras(ctx, state, tick);
  _renderGuards(ctx, state, tick, S);
  _renderVan(ctx, state, tick, S);
  _renderPlayers(ctx, state, tick, S);
  if (state.mission) renderMissionWorld(ctx, state);
  _renderPrompts(ctx, state);
  _renderAlarmOverlay(ctx, state, tick, camera, view);
  _renderTutorial(ctx, state, camera, view);

  ctx.restore();
}

// ─── Floor ────────────────────────────────────────────────────────────────────
function _renderFloor(ctx, S) {
  const cols = Math.ceil(CANVAS_W / TILE);
  const rows = Math.ceil(CANVAS_H / TILE);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.drawImage((r + c) % 2 === 0 ? S.floorBase : S.floorAlt, c * TILE, r * TILE, TILE, TILE);
    }
  }
}

// ─── Room labels ──────────────────────────────────────────────────────────────
function _renderRoomLabels(ctx) {
  ctx.font = '11px "Rajdhani", sans-serif';
  ctx.fillStyle = 'rgba(180,200,230,0.12)';
  ctx.textAlign = 'center';
  for (const lbl of roomLabels) {
    ctx.fillText(lbl.text, lbl.x, lbl.y);
  }
}

// ─── Pressure plates ──────────────────────────────────────────────────────────
function _renderPressurePlates(ctx, state) {
  const S = getSprites();
  for (const plate of state.pressurePlates) {
    ctx.drawImage(plate.activated ? S.plateOn : S.plateOff, plate.x, plate.y, plate.w, plate.h);

    ctx.font = '7px "Rajdhani", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('PLATE', plate.x + plate.w / 2, plate.y - 3);
  }
}

// ─── Lasers ───────────────────────────────────────────────────────────────────
function _renderLasers(ctx, state, tick) {
  const S = getSprites();
  for (const laser of state.lasers) {
    if (!laser.active) {
      // Inactive – dashed grey line
      ctx.save();
      ctx.setLineDash([5, 8]);
      ctx.strokeStyle = C.laserOff;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    // Active – red pulsing beam + glow
    const alpha = 0.55 + Math.sin(tick * 10) * 0.35;
    const len = Math.hypot(laser.x2 - laser.x1, laser.y2 - laser.y1);
    const ang = Math.atan2(laser.y2 - laser.y1, laser.x2 - laser.x1);
    ctx.save();
    ctx.translate(laser.x1, laser.y1);
    ctx.rotate(ang);
    ctx.globalAlpha = alpha;
    ctx.drawImage(S.laserBeam, 0, -2, len, 4);
    ctx.restore();
    // Glow pass
    ctx.strokeStyle = `rgba(255,23,68,${alpha * 0.3})`;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y1);
    ctx.lineTo(laser.x2, laser.y2);
    ctx.stroke();
    // Emitter dots
    ctx.drawImage(S.laserEmitter, laser.x1 - 4, laser.y1 - 4, 8, 8);
    ctx.drawImage(S.laserEmitter, laser.x2 - 4, laser.y2 - 4, 8, 8);
  }
}

// ─── Walls ────────────────────────────────────────────────────────────────────
function _renderWalls(ctx, state, S) {
  for (const w of state.walls) {
    for (let y = w.y; y < w.y + w.h; y += 32) {
      for (let x = w.x; x < w.x + w.w; x += 32) {
        ctx.drawImage(S.wallBrick, x, y, Math.min(32, w.x + w.w - x), Math.min(32, w.y + w.h - y));
      }
    }
    ctx.drawImage(S.wallTopEdge, w.x, w.y, w.w, Math.min(16, w.h));
  }
}

// ─── Doors ────────────────────────────────────────────────────────────────────
function _renderDoors(ctx, state) {
  const S = getSprites();
  for (const door of state.doors) {
    const horizontal = door.w >= door.h;
    const spr = door.open
      ? (horizontal ? S.doorOpenH : S.doorOpenV)
      : (horizontal ? S.doorClosedH : S.doorClosedV);
    ctx.drawImage(spr, door.x, door.y, door.w, door.h);
    if (door.open) {
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = 'rgba(76,175,80,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(door.x + 0.5, door.y + 0.5, door.w - 1, door.h - 1);
      ctx.restore();
    }
  }
}

// ─── Display cases ────────────────────────────────────────────────────────────
function _renderDisplayCases(ctx, state) {
  const S = getSprites();
  // displayCases[i] matches artifacts[i] by position index
  const artById = {};
  for (const a of state.artifacts) artById[a.id] = a;

  for (let i = 0; i < displayCases.length; i++) {
    // Find matching artifact by index
    const art = state.artifacts[i];
    if (art && art.pickedUp) continue;
    const dc = displayCases[i];
    ctx.drawImage(S.displayCase, dc.x, dc.y, dc.w, dc.h);
  }
}

// ─── Artifacts ────────────────────────────────────────────────────────────────
function _renderArtifacts(ctx, state, tick) {
  const S = getSprites();
  for (const art of state.artifacts) {
    if (art.pickedUp) continue;

    const glow = 0.25 + Math.sin(tick * 2.5) * 0.12;

    // Type colour
    const col = art.type === 'high_value' ? C.artifactHigh
               : art.type === 'heavy'      ? C.artifactHeavy
               : C.artifact;

    // Glow halo
    const glowRGBA = art.type === 'high_value' ? `rgba(255,171,0,${glow})`
                   : art.type === 'heavy'       ? `rgba(141,110,99,${glow})`
                   : `rgba(255,213,79,${glow})`;
    const grad = ctx.createRadialGradient(art.x, art.y, 0, art.x, art.y, 22);
    grad.addColorStop(0, glowRGBA);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(art.x, art.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    const spr = art.type === 'high_value' ? S.artifactCrown : art.type === 'heavy' ? S.artifactHeavy : S.artifactSmall;
    const sz = art.type === 'small' ? 24 : 28;
    const frame = Math.floor(tick * 6);
    drawStripFrame(ctx, spr, sz, sz, frame, art.x - sz / 2, art.y - sz / 2, sz, sz);

    // Name tag
    ctx.font = '8px "Rajdhani", sans-serif';
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.fillText(art.name, art.x, art.y + 20);

    // Type badge
    if (art.type === 'heavy') {
      ctx.fillStyle = 'rgba(141,110,99,0.7)';
      ctx.font = '7px "Rajdhani", sans-serif';
      ctx.fillText('[HEAVY]', art.x, art.y + 29);
    }
    if (art.type === 'high_value') {
      ctx.fillStyle = 'rgba(255,171,0,0.9)';
      ctx.font = '7px "Rajdhani", sans-serif';
      ctx.fillText('[★ HIGH VALUE]', art.x, art.y + 29);
    }
  }
}

// ─── Crates ───────────────────────────────────────────────────────────────────
function _renderCrates(ctx, state, S) {
  for (const c of state.crates) {
    ctx.drawImage(S.crate, c.x, c.y, c.w, c.h);
    ctx.font = '7px "Rajdhani", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('CRATE', c.x + c.w/2, c.y - 3);
  }
}

// ─── Vents ────────────────────────────────────────────────────────────────────
function _renderVents(ctx, state, tick) {
  const S = getSprites();
  for (const v of state.vents) {
    ctx.drawImage(S.vent, v.entryX, v.entryY, v.entryW, v.entryH);
    ctx.font = '7px "Rajdhani", sans-serif';
    ctx.fillStyle = 'rgba(180,220,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('VENT', v.entryX + v.entryW/2, v.entryY - 3);

    // Dedicated exit sprite/strip for clear destination cue.
    if (S.ventExit && S.ventExit.complete && S.ventExit.height > 0) {
      const fw = S.ventExit.height;
      const frame = Math.floor(tick * 8);
      drawStripFrame(ctx, S.ventExit, fw, fw, frame, v.exitX, v.exitY, v.exitW, v.exitH);
    } else {
      ctx.drawImage(S.vent, v.exitX, v.exitY, v.exitW, v.exitH);
    }
  }
}

// ─── Switches ─────────────────────────────────────────────────────────────────
function _renderSwitches(ctx, state) {
  const S = getSprites();
  for (const sw of state.switches) {
    ctx.drawImage(sw.activated ? S.switchOn : S.switchOff, sw.x, sw.y, sw.w, sw.h);
    ctx.font = '7px "Rajdhani", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('SW', sw.x + sw.w/2, sw.y - 3);
  }
}

// ─── Cameras ──────────────────────────────────────────────────────────────────
function _renderCameras(ctx, state, tick) {
  const S = getSprites();
  for (const cam of state.cameras) {
    if (state.mission?.securityOff || cam.disabled > 0) { ctx.fillStyle="#53d7ac"; ctx.fillRect(cam.x-6,cam.y-6,12,12); continue; }
    const halfArc = (CAM_ARC_DEG * Math.PI / 180) / 2;

    // Vision cone fill
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.arc(cam.x, cam.y, CAM_DETECT_R, cam.angle - halfArc, cam.angle + halfArc);
    ctx.closePath();
    ctx.fillStyle = C.cameraVision;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,111,0,0.20)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Body
    drawStripFrame(ctx, S.cameraBase, 24, 24, Math.floor(tick * 5), cam.x - 12, cam.y - 12, 24, 24);

    // Blinking red dot
    if (Math.sin(tick * 6) > 0) {
      drawStripFrame(ctx, S.cameraAlertDot, 24, 24, Math.floor(tick * 8), cam.x - 12, cam.y - 12, 24, 24);
    }

    ctx.font = '7px "Rajdhani", sans-serif';
    ctx.fillStyle = 'rgba(255,111,0,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('CAM', cam.x, cam.y - 13);
  }
}

// ─── Guards ───────────────────────────────────────────────────────────────────
function _renderGuards(ctx, state, tick, S) {
  for (const guard of state.guards) {
    if (guard.stunned > 0) { ctx.fillStyle="#559c83"; ctx.fillRect(guard.x-10,guard.y-5,20,10); continue; }
    // Detection radius (faint red circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD_DETECT_R, 0, Math.PI * 2);
    ctx.fillStyle = C.guardVision;
    ctx.fill();
    ctx.restore();

    // Alert flash
    if (guard.alertTimer > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD_DETECT_R, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(229,57,53,${guard.alertTimer * 0.15})`;
      ctx.fill();
      ctx.restore();
    }

    // Direction indicator (facing toward next patrol point)
    const target = guard.patrol[guard.patrolIdx] || guard.patrol[0];
    const ang = Math.atan2(target.y - guard.y, target.x - guard.x);
    ctx.strokeStyle = '#ef9a9a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(ang) * 18, guard.y + Math.sin(ang) * 18);
    ctx.stroke();

    const moving = (guard.mode === 'chase') || guard.alertTimer > 0;
    let drew = false;
    if (guard.alertTimer > 0.35) {
      drew = drawStripFrame(ctx, S.guardAlert, 32, 32, Math.floor(tick * ANIM.guard.alertFps), guard.x - 16, guard.y - 16, 32, 32);
    } else if (moving) {
      drew = drawStripFrame(ctx, S.guardWalk, 32, 32, Math.floor(tick * ANIM.guard.walkFps), guard.x - 16, guard.y - 16, 32, 32);
    } else {
      drew = drawStripFrame(ctx, S.guardIdle, 32, 32, Math.floor(tick * ANIM.guard.idleFps), guard.x - 16, guard.y - 16, 32, 32);
    }
    if (!drew) {
      ctx.fillStyle = '#e34a4a';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label
    ctx.font = 'bold 8px "Rajdhani", sans-serif';
    ctx.fillStyle = '#ef9a9a';
    ctx.textAlign = 'center';
    ctx.fillText('GUARD', guard.x, guard.y - 17);
  }
}

// ─── Van ──────────────────────────────────────────────────────────────────────
function _renderVan(ctx, state, tick, S) {
  const v = state.van;
  ctx.drawImage(S.van, v.x, v.y, v.w, v.h);

  ctx.font = 'bold 9px "Rajdhani", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY VAN', v.x + v.w / 2, v.y + v.h / 2 + 4);
}

// ─── Players ──────────────────────────────────────────────────────────────────
function _renderPlayers(ctx, state, tick, S) {
  for (const player of state.players) {
    const isP1 = player.id === 1;
    const idle = isP1 ? S.p1Idle : S.p2Idle;
    const walk = isP1 ? S.p1Walk : S.p2Walk;

    // Detection flash (red ring)
    if (player.detected > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 8 + Math.sin(tick*14)*3, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255,23,68,${player.detected * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + player.r - 1, player.r * 0.9, 4, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.restore();

    const sz = 32;
    const prevX = Number.isFinite(player._renderPrevX) ? player._renderPrevX : player.x;
    const prevY = Number.isFinite(player._renderPrevY) ? player._renderPrevY : player.y;
    const moving = Math.hypot(player.x - prevX, player.y - prevY) > 0.12;
    player._renderPrevX = player.x;
    player._renderPrevY = player.y;
    ctx.drawImage(S.playerShadow, player.x - 16, player.y + 5, 32, 16);
    let drew = false;
    if (player.downed) {
      drew = drawStripFrame(ctx, idle, 32, 32, 0, player.x - sz / 2, player.y - sz / 2, sz, sz);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,82,82,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x - 10, player.y - 10);
      ctx.lineTo(player.x + 10, player.y + 10);
      ctx.moveTo(player.x + 10, player.y - 10);
      ctx.lineTo(player.x - 10, player.y + 10);
      ctx.stroke();
      ctx.restore();
    } else if (moving) {
      drew = drawStripFrame(ctx, walk, 32, 32, Math.floor(tick * ANIM.player.walkFps), player.x - sz / 2, player.y - sz / 2, sz, sz);
    } else {
      drew = drawStripFrame(ctx, idle, 32, 32, Math.floor(tick * ANIM.player.idleFps), player.x - sz / 2, player.y - sz / 2, sz, sz);
    }
    if (!drew) {
      ctx.fillStyle = player.id === 1 ? C.p1 : C.p2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label above head only
    ctx.font = 'bold 10px "Rajdhani", sans-serif';
    ctx.fillStyle = player.downed ? '#ff8a8a' : (player.id === 1 ? C.p1 : C.p2);
    ctx.textAlign = 'center';
    ctx.fillText(`P${player.id}`, player.x, player.y - player.r - 8);
    if (player.downed) {
      ctx.font = '9px "Rajdhani", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.fillText(`${Math.ceil(player.custodyTimer || 0)}s`, player.x, player.y + player.r + 14);
    }

    // Held item tag below
    if (player.holding) {
      ctx.font = '8px "Rajdhani", sans-serif';
      ctx.fillStyle = C.gold;
      ctx.fillText(player.holding.name, player.x, player.y + player.r + 13);
    }
  }
}

// ─── Interaction prompts ──────────────────────────────────────────────────────
function _renderPrompts(ctx, state) {
  for (const player of state.players) {
    const p = player.nearPrompt;
    if (!p) continue;

    const x = player.x;
    const y = player.y - player.r - 22;

    // Measure text to draw background pill
    ctx.font = '9px "Rajdhani", sans-serif';
    const tw = ctx.measureText(p.text).width;
    const pad = 6;

    ctx.fillStyle = p.warn ? 'rgba(198,40,40,0.85)' : 'rgba(30,40,60,0.88)';
    ctx.beginPath();
    ctx.roundRect(x - tw/2 - pad, y - 11, tw + pad*2, 15, 4);
    ctx.fill();

    ctx.fillStyle = p.warn ? '#ffcdd2' : '#ffd54f';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, x, y);
  }
}

// ─── Alarm overlay ────────────────────────────────────────────────────────────
function _renderAlarmOverlay(ctx, state, tick, camera, view) {
  if (state.screen !== 'playing') return;
  if (state.alarm < 40) return;
  const frac = (state.alarm - 40) / 60; // 0→1 from 40%→100%
  const alpha = frac * 0.18 * (0.7 + Math.sin(tick * 8) * 0.3);
  ctx.fillStyle = `rgba(255,23,68,${alpha})`;
  ctx.fillRect(camera.x, camera.y, view.w, view.h);
}

// ─── Tutorial overlay ─────────────────────────────────────────────────────────
function _renderTutorial(ctx, state, camera, view) {
  if (state.tutorialTimer <= 0) return;

  const alpha = Math.min(1, state.tutorialTimer); // fade-out in last second
  ctx.save();
  ctx.globalAlpha = alpha;

  const lines = [
    'P1 (Blue): WASD to move  |  E to interact  |  Q ability',
    'P2 (Orange): Arrow Keys to move  |  Enter/Space to interact  |  / ability',
    'P3 (Green): T/F/G/H to move  |  R interact  |  Y ability',
    'P4 (Purple): I/J/K/L to move  |  O interact  |  P ability',
    'Steal 3 artifacts (including the Crown Jewel), then reach the van!',
    'Avoid guards and cameras — keep the alarm below 100%',
  ];

  const boxW = 540, boxH = lines.length * 18 + 24;
  const cx = camera.x + view.w / 2;
  const cy = camera.y + view.h / 2;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.fillStyle = 'rgba(10,14,22,0.94)';
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 8);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,213,79,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.font = i === 0 || i === 1
      ? 'bold 11px "Rajdhani", sans-serif'
      : '10px "Rajdhani", sans-serif';
    ctx.fillStyle = i < 2 ? '#ffd54f' : 'rgba(200,210,230,0.8)';
    ctx.fillText(line, cx, by + 20 + i * 18);
  });

  ctx.restore();
}


function renderMissionWorld(ctx, s) {
  const m = s.mission;
  ctx.save();ctx.textAlign='center';ctx.font='bold 13px monospace';
  const marker=(o,text,color)=>{ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.x,o.y,20,0,Math.PI*2);ctx.stroke();ctx.fillText(text,o.x,o.y-30);};
  for(const k of m.keys) if(!k.collected) marker(k,'KEY '+k.id,'#7bffb5');
  marker(m.terminal,m.securityOff?'SECURITY OFF':'HACKER TERMINAL','#6bd6ff');
  marker(m.support,'TEAM SUPPORT PAD','#c1a4ff');
  marker(m.lock,s.vaultUnlocked?'VAULT OPEN':'VAULT LOCK','#ffd77b');
  for(const p of s.players) if(p.scanTime>0) {
    ctx.strokeStyle='#63e7ff55';ctx.beginPath();ctx.arc(p.x,p.y,360,0,Math.PI*2);ctx.stroke();
    for(const g of [...s.guards,...s.cameras]) if(Math.hypot(g.x-p.x,g.y-p.y)<360) marker(g,g.stunned>0?'INCAPACITATED':g.disabled>0?'DISABLED':'THREAT','#63e7ff');
    for(const l of s.lasers) if(l.active && Math.hypot(l.x1-p.x,l.y1-p.y)<360) marker({x:l.x1,y:l.y1},'LASER','#63e7ff');
  }
  for(const g of s.guards) if(g.stunned>0) marker(g,'STUN '+Math.ceil(g.stunned)+'s','#7bffb5');
  for(const c of s.cameras) if(c.disabled>0 || m.securityOff) marker(c,'OFF','#7bffb5');
  ctx.restore();
}
