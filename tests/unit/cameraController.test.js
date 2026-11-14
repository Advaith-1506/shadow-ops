import { describe, expect, it } from "vitest";
import { computeLevelView } from "../../src/lib/game/cameraController.js";
import { fitBounds, computeHudLayout } from "../../src/lib/game/viewLayout.js";
import { LEVEL } from "../../src/lib/game/mapData.js";

const BOUNDS = LEVEL.bounds;

describe("fixed whole-level camera", () => {
  it("fits the entire level with uniform scale and preserves aspect ratio", () => {
    for (const [w, h] of [
      [1366, 768],
      [1920, 1080],
      [960, 540],
      [844, 390],
    ]) {
      const view = computeLevelView({ cssW: w, cssH: h, dpr: 1, playerCount: 4 });
      expect(view.zoomCss).toBeGreaterThan(0);
      expect(view.world.w / view.world.h).toBeCloseTo(BOUNDS.w / BOUNDS.h, 5);
      expect(view.world.w).toBeLessThanOrEqual(view.layout.play.w + 0.5);
      expect(view.world.h).toBeLessThanOrEqual(view.layout.play.h + 0.5);
      // Level stays inside the gameplay rectangle, with HUD never covering it.
      expect(view.world.x).toBeGreaterThanOrEqual(view.layout.play.x - 0.5);
      expect(view.world.y).toBeGreaterThanOrEqual(view.layout.play.y - 0.5);
      expect(view.world.x + view.world.w).toBeLessThanOrEqual(
        view.layout.play.x + view.layout.play.w + 0.5,
      );
      expect(view.world.y + view.world.h).toBeLessThanOrEqual(
        view.layout.play.y + view.layout.play.h + 0.5,
      );
    }
  });

  it("allows zoom below 1 and recomputes when the viewport changes", () => {
    const a = computeLevelView({ cssW: 640, cssH: 360, dpr: 1 });
    const b = computeLevelView({ cssW: 1920, cssH: 1080, dpr: 1 });
    expect(a.zoomCss).toBeLessThan(1);
    expect(b.zoomCss).toBeGreaterThan(a.zoomCss);
  });

  it("uses the same framing regardless of player positions", () => {
    const layout = computeHudLayout(1366, 768, { playerCount: 2, bounds: BOUNDS });
    const fit = fitBounds(layout.play, BOUNDS, 1);
    const view = computeLevelView({ cssW: 1366, cssH: 768, dpr: 1, playerCount: 2 });
    expect(view.camera.x).toBeCloseTo(BOUNDS.x - fit.offsetX / fit.zoom, 5);
    expect(view.camera.y).toBeCloseTo(BOUNDS.y - fit.offsetY / fit.zoom, 5);
    expect(view.zoom).toBeCloseTo(fit.zoom, 5);
  });

  it("extends the landscape map beneath touch controls and zooms out", () => {
    const view = computeLevelView({
      cssW: 844,
      cssH: 390,
      dpr: 1,
      touch: true,
      playerCount: 4,
    });
    const desktopFit = computeLevelView({
      cssW: 844,
      cssH: 390,
      dpr: 1,
      touch: false,
      playerCount: 4,
    });
    expect(view.layout.touch).toBe(true);
    expect(view.layout.play.x).toBeLessThan(10);
    expect(view.layout.play.x + view.layout.play.w).toBeGreaterThan(834);
    expect(view.zoomCss).toBeLessThan(desktopFit.zoomCss);
    expect(view.world.w).toBeLessThanOrEqual(view.layout.play.w + 0.5);
  });

  it("keeps portrait usable with a bottom player panel", () => {
    const view = computeLevelView({
      cssW: 390,
      cssH: 844,
      dpr: 1,
      touch: true,
      playerCount: 4,
    });
    expect(view.layout.portrait).toBe(true);
    expect(view.layout.panel.mode).toBe("bottom");
    expect(view.world.h).toBeLessThanOrEqual(view.layout.play.h + 0.5);
  });
});
