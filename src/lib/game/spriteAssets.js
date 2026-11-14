import floorBaseUrl from "../../../topdown_stealth_sprite_pack/tiles/floor_base.png";
import floorAltUrl from "../../../topdown_stealth_sprite_pack/tiles/floor_alt.png";
import wallBrickUrl from "../../../topdown_stealth_sprite_pack/tiles/wall_brick.png";
import wallTopEdgeUrl from "../../../topdown_stealth_sprite_pack/tiles/wall_top_edge.png";
import doorClosedHUrl from "../../../topdown_stealth_sprite_pack/tiles/door_closed_h.png";
import doorClosedVUrl from "../../../topdown_stealth_sprite_pack/tiles/door_closed_v.png";
import doorOpenHUrl from "../../../topdown_stealth_sprite_pack/tiles/door_open_h.png";
import doorOpenVUrl from "../../../topdown_stealth_sprite_pack/tiles/door_open_v.png";

import p1IdleUrl from "../../../museum_break_final_assets/players/p1_idle_strip.png";
import p1WalkUrl from "../../../museum_break_final_assets/players/p1_walk_strip.png";
import p2IdleUrl from "../../../museum_break_final_assets/players/p2_idle_strip.png";
import p2WalkUrl from "../../../museum_break_final_assets/players/p2_walk_strip.png";
import playerMeta from "../../../museum_break_final_assets/players/player_meta.json";

import guardIdleUrl from "../../../museum_break_final_assets/guards/guard_idle_strip.png";
import guardWalkUrl from "../../../museum_break_final_assets/guards/guard_walk_strip.png";
import guardAlertUrl from "../../../museum_break_final_assets/guards/guard_alert_strip.png";
import guardMeta from "../../../museum_break_final_assets/guards/guard_meta.json";

import crateUrl from "../../../museum_break_final_assets/items/crate_idle.png";
import displayCaseUrl from "../../../museum_break_final_assets/items/display_case_closed.png";
import artifactSmallUrl from "../../../museum_break_final_assets/items/artifact_small_strip.png";
import artifactHeavyUrl from "../../../museum_break_final_assets/items/artifact_heavy_strip.png";
import artifactCrownUrl from "../../../museum_break_final_assets/items/artifact_crown_strip.png";
import switchOffUrl from "../../../museum_break_final_assets/items/switch_off.png";
import switchOnUrl from "../../../museum_break_final_assets/items/switch_on.png";
import ventUrl from "../../../museum_break_final_assets/items/vent.png";
import ventExitUrl from "../../../topdown_stealth_sprite_pack/items/vent.png";
import plateOffUrl from "../../../topdown_stealth_sprite_pack/items/pressure_plate_off.png";
import plateOnUrl from "../../../topdown_stealth_sprite_pack/items/pressure_plate_on.png";

import cameraBaseUrl from "../../../museum_break_final_assets/security/camera_idle_strip.png";
import cameraAlertDotUrl from "../../../museum_break_final_assets/security/camera_alert_strip.png";
import laserBeamUrl from "../../../museum_break_final_assets/security/laser_beam_core.png";
import laserEmitterUrl from "../../../museum_break_final_assets/security/laser_emitter_on.png";
import vanUrl from "../../../topdown_stealth_sprite_pack/ui/van.png";
import playerShadowUrl from "../../../topdown_stealth_sprite_pack/players/player_shadow.png";

let cached = null;

function img(src) {
  const im = new Image();
  im.src = src;
  return im;
}

export function getSprites() {
  if (cached) return cached;
  cached = {
    floorBase: img(floorBaseUrl),
    floorAlt: img(floorAltUrl),
    wallBrick: img(wallBrickUrl),
    wallTopEdge: img(wallTopEdgeUrl),
    doorClosedH: img(doorClosedHUrl),
    doorClosedV: img(doorClosedVUrl),
    doorOpenH: img(doorOpenHUrl),
    doorOpenV: img(doorOpenVUrl),
    p1Idle: img(p1IdleUrl),
    p1Walk: img(p1WalkUrl),
    p2Idle: img(p2IdleUrl),
    p2Walk: img(p2WalkUrl),
    playerShadow: img(playerShadowUrl),
    guardIdle: img(guardIdleUrl),
    guardWalk: img(guardWalkUrl),
    guardAlert: img(guardAlertUrl),
    crate: img(crateUrl),
    displayCase: img(displayCaseUrl),
    artifactSmall: img(artifactSmallUrl),
    artifactHeavy: img(artifactHeavyUrl),
    artifactCrown: img(artifactCrownUrl),
    switchOff: img(switchOffUrl),
    switchOn: img(switchOnUrl),
    vent: img(ventUrl),
    ventExit: img(ventExitUrl),
    plateOff: img(plateOffUrl),
    plateOn: img(plateOnUrl),
    cameraBase: img(cameraBaseUrl),
    cameraAlertDot: img(cameraAlertDotUrl),
    laserBeam: img(laserBeamUrl),
    laserEmitter: img(laserEmitterUrl),
    van: img(vanUrl),
  };
  return cached;
}

export function drawStripFrame(
  ctx,
  image,
  frameW,
  frameH,
  frame,
  dx,
  dy,
  dw,
  dh,
) {
  if (
    !image ||
    !image.complete ||
    image.naturalWidth <= 0 ||
    image.naturalHeight <= 0
  )
    return false;
  const frames = Math.max(1, Math.floor(image.width / frameW));
  const f = ((frame % frames) + frames) % frames;
  ctx.drawImage(image, f * frameW, 0, frameW, frameH, dx, dy, dw, dh);
  return true;
}

export const ANIM = {
  player: {
    idleFps: playerMeta?.animations?.idle?.fps || 8,
    walkFps: playerMeta?.animations?.walk?.fps || 12,
  },
  guard: {
    idleFps: guardMeta?.animations?.idle?.fps || 8,
    walkFps: guardMeta?.animations?.walk?.fps || 10,
    alertFps: guardMeta?.animations?.alert?.fps || 10,
  },
};
