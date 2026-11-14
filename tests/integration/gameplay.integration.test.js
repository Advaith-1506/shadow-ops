import { describe, expect, it, vi } from "vitest";
import { createGameState } from "../../src/lib/game/gameState";
import { updateGame } from "../../src/lib/game/gameLoop";
import { sanitizeFramePayload, sanitizeInputPayload } from "../../src/lib/game/networkClient";

describe("gameplay integration", () => {
  it("single-player role is randomized between fast/strong archetypes", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.1);
    const fast = createGameState(1);
    spy.mockReturnValueOnce(0.9);
    const strong = createGameState(1);
    spy.mockRestore();

    expect(fast.players).toHaveLength(1);
    expect(strong.players).toHaveLength(1);
    expect(new Set([fast.players[0].role, strong.players[0].role])).toEqual(new Set(["fast", "strong"]));
  });

  it("single-player can latch vault unlock and keep door open after leaving plate", () => {
    const state = createGameState(1);
    state.screen = "playing";
    const player = state.players[0];

    const plate = state.pressurePlates.find((p) => p.id === "plate_vault");
    const door = state.doors.find((d) => d.id === "door_vault");
    expect(plate).toBeTruthy();
    expect(door).toBeTruthy();

    player.x = plate.x + plate.w / 2;
    player.y = plate.y + plate.h / 2;
    updateGame(state, 0.1);
    expect(state.vaultUnlocked).toBe(true);
    expect(door.open).toBe(true);

    player.x += 600;
    player.y += 300;
    updateGame(state, 0.1);
    expect(state.vaultUnlocked).toBe(true);
    expect(door.open).toBe(true);
  });

  it("multiplayer requires hold to keep vault door open", () => {
    const state = createGameState(2);
    state.screen = "playing";
    const p1 = state.players[0];
    const plate = state.pressurePlates.find((p) => p.id === "plate_vault");
    const door = state.doors.find((d) => d.id === "door_vault");

    p1.x = plate.x + plate.w / 2;
    p1.y = plate.y + plate.h / 2;
    updateGame(state, 0.1);
    expect(door.open).toBe(true);

    p1.x += 500;
    p1.y += 200;
    updateGame(state, 0.1);
    expect(state.vaultUnlocked).toBe(false);
    expect(door.open).toBe(false);
  });

  it("client frame payload sanitization is compatible with updateGame input map", () => {
    const state = createGameState(2);
    state.screen = "playing";

    const payload = sanitizeFramePayload({
      frame: "8",
      inputs: {
        1: { right: 1, interact: 0 },
        2: { left: "yes", interact: true },
      },
    });
    expect(payload.frame).toBe(8);
    updateGame(state, 0.1, payload.inputs);
    expect(state.timer).toBeLessThan(600);
  });

  it("input payload sanitizer normalizes noisy input before host relay", () => {
    expect(sanitizeInputPayload({ up: "1", down: null, interact: "true" })).toEqual({
      up: true,
      down: false,
      left: false,
      right: false,
      interact: true,
    });
  });
});

