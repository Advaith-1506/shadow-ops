/*
 * HUD  –  Museum Break
 * High-contrast segmented HUD for readability on large and small screens.
 */

import {
  C,
  MAX_ALARM,
  REQUIRED_ARTIFACTS,
  REQUIRED_HIGH_VALUE,
} from "./constants.js";

export function renderHUD(ctx, state) {
  if (state.mission) return renderMissionHUD(ctx, state);
  const viewW = ctx.canvas.width;
  const compact = viewW < 1380;
  const veryCompact = viewW < 1100;
  const s = Math.max(0.72, Math.min(1.65, viewW / (compact ? 1550 : 1280)));
  const U = (n) => Math.round(n * s);
  const HUD = U(veryCompact ? 72 : compact ? 78 : 84);

  ctx.fillStyle = "rgba(6, 10, 18, 0.97)";
  ctx.fillRect(0, 0, viewW, HUD);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(0, HUD - 1, viewW, 1);

  const pad = U(14);
  const gap = U(10);
  const blockH = HUD - U(18);
  const blockY = U(9);

  const timerW = U(veryCompact ? 110 : compact ? 122 : 140);
  const alarmW = U(veryCompact ? 185 : compact ? 220 : 260);
  const objectiveW = U(veryCompact ? 210 : compact ? 260 : 330);
  const playerW = U(veryCompact ? 135 : compact ? 165 : 210);

  const p1x = Math.max(
    pad + timerW + gap + alarmW + gap + objectiveW + gap,
    viewW - pad - playerW * 2 - gap,
  );
  const p2x = p1x + playerW + gap;

  _block(ctx, pad, blockY, timerW, blockH);
  _block(ctx, pad + timerW + gap, blockY, alarmW, blockH);
  _block(ctx, pad + timerW + gap + alarmW + gap, blockY, objectiveW, blockH);
  _block(ctx, p1x, blockY, playerW, blockH);
  _block(ctx, p2x, blockY, playerW, blockH);

  _timer(ctx, state, pad, blockY, timerW, blockH, U, compact);
  _alarm(ctx, state, pad + timerW + gap, blockY, alarmW, blockH, U, compact);
  _objectives(
    ctx,
    state,
    pad + timerW + gap + alarmW + gap,
    blockY,
    objectiveW,
    blockH,
    U,
    compact,
  );
  _player(
    ctx,
    state.players[0],
    p1x,
    blockY,
    playerW,
    blockH,
    C.p1,
    U,
    compact,
  );
  _player(
    ctx,
    state.players[1],
    p2x,
    blockY,
    playerW,
    blockH,
    C.p2,
    U,
    compact,
  );
}

function _block(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(20, 28, 42, 0.72)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function _timer(ctx, state, x, y, w, h, U, compact) {
  const mins = Math.floor(state.timer / 60);
  const secs = Math.floor(state.timer % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const col =
    state.timer < 30 ? "#ff4d4d" : state.timer < 60 ? "#ffcc4d" : "#f1f5ff";

  ctx.font = `600 ${U(11)}px "Rajdhani", sans-serif`;
  ctx.fillStyle = "rgba(220,230,255,0.8)";
  ctx.fillText("TIME", x + U(10), y + U(16));

  ctx.font = `700 ${U(compact ? 24 : 30)}px "Rajdhani", sans-serif`;
  ctx.fillStyle = col;
  ctx.fillText(timeStr, x + U(10), y + U(48));
}

function _alarm(ctx, state, x, y, w, h, U, compact) {
  const alarmFrac = Math.max(0, Math.min(1, state.alarm / MAX_ALARM));
  const col =
    alarmFrac < 0.5 ? "#66d17b" : alarmFrac < 0.75 ? "#ffb547" : "#ff4d4d";

  ctx.font = `600 ${U(11)}px "Rajdhani", sans-serif`;
  ctx.fillStyle = "rgba(220,230,255,0.8)";
  ctx.fillText("ALARM", x + U(10), y + U(16));

  const bx = x + U(10);
  const by = y + U(24);
  const bw = w - U(20);
  const bh = U(compact ? 14 : 18);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = col;
  ctx.fillRect(bx, by, Math.round(bw * alarmFrac), bh);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

  ctx.font = `700 ${U(compact ? 15 : 18)}px "Rajdhani", sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.fillText(`${Math.floor(state.alarm)}%`, x + U(10), y + U(58));
}

function _objectives(ctx, state, x, y, w, h, U, compact) {
  const highCount = state.loot.filter((a) => a.type === "high_value").length;
  const lootCount = state.loot.length;
  const lootDone = lootCount >= REQUIRED_ARTIFACTS;
  const highDone = highCount >= REQUIRED_HIGH_VALUE;
  const allAtVan = state.players.every((p) => p.atVan);

  ctx.font = `600 ${U(11)}px "Rajdhani", sans-serif`;
  ctx.fillStyle = "rgba(220,230,255,0.8)";
  ctx.fillText("OBJECTIVES", x + U(10), y + U(16));

  ctx.font = `600 ${U(compact ? 12 : 15)}px "Rajdhani", sans-serif`;
  ctx.fillStyle = lootDone ? "#66d17b" : "#ffd166";
  ctx.fillText(
    `Artifacts ${lootCount}/${REQUIRED_ARTIFACTS}`,
    x + U(10),
    y + U(compact ? 30 : 32),
  );

  ctx.fillStyle = highDone ? "#66d17b" : "#ffb547";
  ctx.fillText(
    `High-Value ${highCount}/${REQUIRED_HIGH_VALUE}`,
    x + U(10),
    y + U(compact ? 45 : 49),
  );

  ctx.fillStyle = allAtVan ? "#66d17b" : "rgba(220,230,255,0.75)";
  const vanLine = compact
    ? state.players.map((p) => `${p.atVan ? "R" : "W"}P${p.id}`).join(" ")
    : state.players
        .map((p) => `${p.atVan ? "Ready" : "Wait"} P${p.id}`)
        .join("  ");
  ctx.fillText(vanLine, x + U(10), y + U(compact ? 58 : 64));
}

function _player(ctx, player, x, y, w, h, col, U, compact) {
  if (!player) return;
  if (player.downed) {
    ctx.font = `700 ${U(compact ? 12 : 14)}px "Rajdhani", sans-serif`;
    ctx.fillStyle = "#ff8a8a";
    ctx.fillText(`P${player.id}  DOWNED`, x + U(10), y + U(20));
    ctx.font = `700 ${U(compact ? 12 : 16)}px "Rajdhani", sans-serif`;
    ctx.fillStyle = "#ffd166";
    ctx.fillText(
      `Custody ${Math.ceil(player.custodyTimer || 0)}s`,
      x + U(10),
      y + U(42),
    );
    return;
  }
  ctx.font = `700 ${U(compact ? 12 : 14)}px "Rajdhani", sans-serif`;
  ctx.fillStyle = col;
  ctx.fillText(
    `P${player.id}  ${player.role === "fast" ? "FAST" : "STRONG"}`,
    x + U(10),
    y + U(20),
  );

  ctx.font = `600 ${U(compact ? 11 : 14)}px "Rajdhani", sans-serif`;
  if (player.holding) {
    ctx.fillStyle = C.gold;
    const item = compact
      ? player.holding.name.slice(0, 12)
      : player.holding.name;
    ctx.fillText(`Carry: ${item}`, x + U(10), y + U(42));
    if (!compact) {
      ctx.fillStyle =
        player.holding.type === "heavy" ? "#ff9a9a" : "rgba(220,230,255,0.85)";
      ctx.fillText(
        player.holding.type === "heavy" ? "Heavy load" : "Normal load",
        x + U(10),
        y + U(62),
      );
    }
  } else {
    ctx.fillStyle = "rgba(220,230,255,0.8)";
    ctx.fillText(
      compact ? "Carry: Empty" : "Carrying: Empty",
      x + U(10),
      y + U(42),
    );
  }
}

function renderMissionHUD(ctx, s) {
  const w = ctx.canvas.width;
  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(5,15,23,.96)";
  ctx.fillRect(0, 0, w, 118);
  ctx.font = "bold 13px monospace";
  ctx.fillStyle = "#6cf0b0";
  ctx.fillText("SHADOW OPS", 12, 20);
  ctx.fillStyle = s.alarm > 65 ? "#ff6b80" : "#6bcfff";
  ctx.fillText(
    "ALERT " + Math.floor(s.alarm) + "%",
    Math.max(130, w - 220),
    20,
  );
  ctx.fillStyle = "#daeaf0";
  ctx.fillText(
    Math.floor(s.timer / 60) +
      ":" +
      String(Math.floor(s.timer % 60)).padStart(2, "0"),
    w - 55,
    20,
  );
  ctx.fillStyle = "#233942";
  ctx.fillRect(12, 28, w - 24, 3);
  ctx.fillStyle = s.alarm > 65 ? "#ff6b80" : "#6bcfff";
  ctx.fillRect(12, 28, ((w - 24) * s.alarm) / 100, 3);
  ctx.font = "12px monospace";
  ctx.fillStyle = "#d5e9ee";
  const m = s.mission;
  ctx.fillText(
    "KEYS " +
      m.keys.filter((k) => k.collected).length +
      "/2  • SECURITY " +
      (m.securityOff ? "OFF" : "ON") +
      "  • VAULT " +
      (s.vaultUnlocked ? "OPEN" : "LOCKED"),
    12,
    49,
  );
  ctx.fillStyle = "#79d7c1";
  ctx.font = "11px monospace";
  ctx.fillText(m.message, 12, 68);
  const col = (w - 24) / s.players.length;
  for (let i = 0; i < s.players.length; i++) {
    const p = s.players[i];
    ctx.fillStyle = p.downed ? "#ff8693" : "#b8d5df";
    ctx.font = "10px monospace";
    ctx.fillText("P" + p.id + " " + p.role.toUpperCase(), 12 + i * col, 89);
    ctx.fillStyle = "#65c9ef";
    ctx.fillText(
      p.downed
        ? "REVIVE " + Math.ceil(p.custodyTimer) + "s"
        : (p.abilityCooldown > 0
            ? "Q " + Math.ceil(p.abilityCooldown) + "s"
            : "Q READY") +
            (p.atVan ? " / EXTRACT" : p.holding ? " / ARTIFACT" : ""),
      12 + i * col,
      106,
    );
  }
  // Overview map provides navigation without exposing off-screen enemy information.
  const mw = Math.min(190, w * 0.24),
    mh = (mw * 1560) / 2240,
    x = w - mw - 12,
    y = 130;
  ctx.fillStyle = "rgba(4,13,20,.88)";
  ctx.fillRect(x, y, mw, mh);
  const scale = mw / 2240;
  ctx.fillStyle = "#3b5261";
  for (const r of s.walls)
    ctx.fillRect(
      x + r.x * scale,
      y + r.y * scale,
      Math.max(1, r.w * scale),
      Math.max(1, r.h * scale),
    );
  const dot = (o, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + o.x * scale, y + o.y * scale, 3, 0, 7);
    ctx.fill();
  };
  for (const k of m.keys) if (!k.collected) dot(k, "#78ffc1");
  dot(m.terminal, "#61cfff");
  dot(m.lock, "#ffcf72");
  dot({ x: s.van.x + s.van.w / 2, y: s.van.y + s.van.h / 2 }, "#fff");
  for (const p of s.players) dot(p, "#b49aff");
  ctx.font = "10px monospace";
  ctx.fillStyle = "#83a4af";
  ctx.fillText("WASD · E INTERACT · Q ABILITY", 12, ctx.canvas.height - 14);
  ctx.restore();
}
