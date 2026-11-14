/*
 * CAMERA
 * Fixed whole-level framing. The view never follows players: the entire level
 * is fitted, uniformly scaled and centred inside the gameplay rectangle left
 * free by the HUD. Identical for local and LAN play.
 */

import { LEVEL } from './mapData.js';
import { computeHudLayout, fitBounds } from './viewLayout.js';

/**
 * Pure camera solve. Returns the world→screen transform for the renderer:
 * screenDevicePx = (world - camera) * zoom, where zoom already includes dpr.
 */
export function computeLevelView({ cssW, cssH, dpr = 1, touch = false, playerCount = 2, bounds = LEVEL.bounds }) {
  const layout = computeHudLayout(cssW, cssH, { touch, playerCount, bounds });
  const fit = fitBounds(layout.play, bounds, dpr);
  return {
    layout,
    zoomCss: fit.zoom,
    zoom: fit.zoom * dpr,
    dpr,
    camera: {
      x: bounds.x - fit.offsetX / fit.zoom,
      y: bounds.y - fit.offsetY / fit.zoom,
    },
    world: { x: fit.offsetX, y: fit.offsetY, w: fit.drawW, h: fit.drawH },
    // Visible world-space rectangle for the whole canvas.
    w: cssW / fit.zoom,
    h: cssH / fit.zoom,
  };
}

export function updateCameraForState(state, canvas, cameraRef, viewRef, opts = {}) {
  if (!canvas || !state) return;
  const dpr = opts.dpr || 1;
  const cssW = opts.cssW || canvas.width / dpr;
  const cssH = opts.cssH || canvas.height / dpr;
  const view = computeLevelView({
    cssW,
    cssH,
    dpr,
    touch: !!opts.touch,
    playerCount: state.players?.length || 2,
  });
  cameraRef.current = view.camera;
  viewRef.current = view;
}
