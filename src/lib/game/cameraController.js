import { CANVAS_W, CANVAS_H } from '@/lib/game/constants';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function updateCameraForState(state, canvas, cameraRef, viewRef) {
  if (!canvas || !state?.players?.length) return;

  const targetViewW = 620;
  const targetViewH = 380;
  const zoom = Math.max(1, Math.min(2.6, Math.max(canvas.width / targetViewW, canvas.height / targetViewH)));
  const viewW = canvas.width / zoom;
  const viewH = canvas.height / zoom;
  viewRef.current = { zoom, w: viewW, h: viewH };

  const tracked = state.players.filter((p) => !p.downed);
  const focus = tracked.length ? tracked : state.players;
  if (!focus.length) return;

  const cam = cameraRef.current;
  if (focus.length === 1) {
    const p = focus[0];
    cam.x = p.x - viewW / 2;
    cam.y = p.y - viewH / 2;
  } else {
    const marginX = viewW * 0.1;
    const marginY = viewH * 0.1;
    const safeRight = viewW - marginX;
    const safeBottom = viewH - marginY;
    const minPX = Math.min(...focus.map((p) => p.x));
    const maxPX = Math.max(...focus.map((p) => p.x));
    const minPY = Math.min(...focus.map((p) => p.y));
    const maxPY = Math.max(...focus.map((p) => p.y));
    const minCamX = maxPX - safeRight;
    const maxCamX = minPX - marginX;
    const minCamY = maxPY - safeBottom;
    const maxCamY = minPY - marginY;

    if (minCamX <= maxCamX) cam.x = clamp(cam.x, minCamX, maxCamX);
    else cam.x = (minPX + maxPX) / 2 - viewW / 2;
    if (minCamY <= maxCamY) cam.y = clamp(cam.y, minCamY, maxCamY);
    else cam.y = (minPY + maxPY) / 2 - viewH / 2;
  }

  cam.x = clamp(cam.x, 0, Math.max(0, CANVAS_W - viewW));
  cam.y = clamp(cam.y, 0, Math.max(0, CANVAS_H - viewH));
}

