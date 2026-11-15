/*
 * VIEW LAYOUT
 * Pure screen-space layout for the fixed whole-level view. Everything here is
 * in CSS pixels; the runtime multiplies by devicePixelRatio when drawing.
 */

export const LEAVE_BUTTON_W = 96;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Uniformly fit `bounds` (world units) into `play` (CSS px), centred. */
export function fitBounds(play, bounds, dpr = 1) {
  const zoom = Math.max(0.01, Math.min(play.w / bounds.w, play.h / bounds.h));
  const drawW = bounds.w * zoom;
  const drawH = bounds.h * zoom;
  // Snap the origin to device pixels so cached static layers stay crisp.
  const snap = (v) => Math.round(v * dpr) / dpr;
  const offsetX = snap(play.x + (play.w - drawW) / 2);
  const offsetY = snap(play.y + (play.h - drawH) / 2);
  return { zoom, offsetX, offsetY, drawW, drawH };
}

/**
 * Splits the canvas into a top status bar, a player panel and the gameplay
 * rectangle. On desktop the player panel goes to the side or the bottom,
 * whichever lets the level render larger. Touch layouts keep gutters free for
 * the on-screen joystick and buttons.
 */
export function computeHudLayout(cssW, cssH, { touch = false, playerCount = 2, bounds } = {}) {
  const W = Math.max(1, cssW);
  const H = Math.max(1, cssH);
  const portrait = H > W;
  const compact = H < 620 || W < 1100;
  const tiny = H < 440 || W < 640;
  const topH = tiny ? 34 : compact ? 42 : 50;
  const gap = tiny ? 4 : 8;
  const top = { x: 0, y: 0, w: W, h: topH };
  const count = clamp(playerCount, 1, 4);
  // Use a stable house-sized reference so HUD chrome (top bar / P1–P4 panel)
  // stays identical across levels; only the map zoom inside `play` changes.
  const layoutRef = { w: 1280, h: 800 };
  const zoomFor = (r) => Math.min(r.w / layoutRef.w, r.h / layoutRef.h);
  void bounds; // kept in signature for callers / future use

  if (touch && !portrait) {
    // The world runs behind the touch controls in landscape. This avoids the
    // old controller gutters and keeps the phone feeling like one game view.
    const gutter = Math.round(clamp(W * 0.15, 118, 170));
    const play = { x: gap, y: topH + gap, w: Math.max(1, W - gap * 2), h: Math.max(1, H - topH - gap * 2) };
    const panelBottom = Math.max(topH + gap + count * 30, H - 170);
    const panel = { x: gap, y: topH + gap, w: gutter - gap * 2, h: panelBottom - topH - gap, mode: 'side' };
    return { compact: true, tiny, touch, portrait, top, panel, play };
  }

  if (portrait) {
    const controlsH = touch ? 200 : 0;
    const panelH = (tiny ? 34 : 42) * Math.ceil(count / 2) + gap;
    const panel = { x: gap, y: H - controlsH - panelH, w: W - gap * 2, h: panelH - gap, mode: 'bottom' };
    const play = { x: gap, y: topH + gap, w: Math.max(1, W - gap * 2), h: Math.max(1, panel.y - topH - gap * 2) };
    return { compact: true, tiny, touch, portrait, top, panel, play };
  }

  const sideW = tiny ? 132 : compact ? 164 : 200;
  const bottomH = tiny ? 40 : compact ? 50 : 58;
  const side = {
    play: { x: gap, y: topH + gap, w: Math.max(1, W - sideW - gap * 3), h: Math.max(1, H - topH - gap * 2) },
    panel: { x: W - sideW - gap, y: topH + gap, w: sideW, h: H - topH - gap * 2, mode: 'side' },
  };
  const bottom = {
    play: { x: gap, y: topH + gap, w: Math.max(1, W - gap * 2), h: Math.max(1, H - topH - bottomH - gap * 3) },
    panel: { x: gap, y: H - bottomH - gap, w: W - gap * 2, h: bottomH, mode: 'bottom' },
  };
  const pick = zoomFor(side.play) >= zoomFor(bottom.play) ? side : bottom;
  return { compact, tiny, touch, portrait, top, panel: pick.panel, play: pick.play };
}
