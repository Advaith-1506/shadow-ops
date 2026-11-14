import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/game/input", () => ({
  getP1Input: vi.fn(() => ({ up: false, down: false, left: false, right: false, interact: false })),
  getP2Input: vi.fn(() => ({ up: false, down: false, left: false, right: false, interact: false })),
  getLocalP3Input: vi.fn(() => ({ up: false, down: false, left: false, right: false, interact: false })),
  getLocalP4Input: vi.fn(() => ({ up: false, down: false, left: false, right: false, interact: false })),
}));

vi.mock("../../src/lib/game/playerLogic", () => ({
  updatePlayer: vi.fn(),
}));

vi.mock("../../src/lib/game/entityLogic", () => ({
  updateGuards: vi.fn(),
  updateCameras: vi.fn(),
  updateLasers: vi.fn(),
  updatePressurePlates: vi.fn(),
  updateCrates: vi.fn(),
}));

vi.mock("../../src/lib/game/gameState", () => ({
  isWinConditionMet: vi.fn(() => false),
  calculateScore: vi.fn(() => 777),
}));

import { updateGame } from "../../src/lib/game/gameLoop";
import { updatePlayer } from "../../src/lib/game/playerLogic";
import { updatePressurePlates, updateGuards, updateCameras, updateLasers, updateCrates } from "../../src/lib/game/entityLogic";
import { isWinConditionMet } from "../../src/lib/game/gameState";

function mkState() {
  return {
    elapsedTime: 0,
    alarm: 0,
    screen: "playing",
    lossReason: "",
    score: 0,
    tutorialTimer: 5,
    players: [{ id: 1, downed: false, custodyTimer: 0, reviveProgress: 0 }],
  };
}

describe("gameLoop.updateGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks elapsed mission time without ending the game", () => {
    const s = mkState();
    updateGame(s, 99);
    expect(s.elapsedTime).toBe(99);
    expect(s.screen).toBe("playing");
  });

  it("ends game on alarm overflow", () => {
    const s = mkState();
    s.alarm = 100;
    updateGame(s, 0.1);
    expect(s.screen).toBe("loss");
    expect(s.lossReason).toMatch(/Alarm reached 100%/i);
  });

  it("updates players and entity systems in expected order path", () => {
    const s = mkState();
    updateGame(s, 0.1);
    expect(updatePlayer).toHaveBeenCalledTimes(1);
    expect(updatePressurePlates).toHaveBeenCalledWith(s);
    expect(updateGuards).toHaveBeenCalledWith(s, 0.1);
    expect(updateCameras).toHaveBeenCalledWith(s, 0.1);
    expect(updateLasers).toHaveBeenCalledWith(s, 0.1);
    expect(updateCrates).toHaveBeenCalledWith(s, 0.1);
  });

  it("gradually lowers alarm during quiet time", () => {
    const s = mkState();
    s.alarm = 20;
    updateGame(s, 1);
    expect(s.alarm).toBe(17);

    s.alarm = 1;
    updateGame(s, 1);
    expect(s.alarm).toBe(0);
  });

  it("does not lower alarm on a tick with active detection", () => {
    const s = mkState();
    s.alarm = 20;
    updateGuards.mockImplementationOnce((state) => {
      state.alarm += 4;
    });
    updateGame(s, 1);
    expect(s.alarm).toBe(24);
  });

  it("ends game when custody timer expires", () => {
    const s = mkState();
    s.players = [{ id: 1, downed: true, custodyTimer: 0.05, reviveProgress: 0.4 }];
    updateGame(s, 0.2);
    expect(s.screen).toBe("loss");
    expect(s.lossReason).toMatch(/captured for too long/i);
  });

  it("ends game as win when win condition is met", () => {
    const s = mkState();
    isWinConditionMet.mockReturnValueOnce(true);
    updateGame(s, 0.1);
    expect(s.screen).toBe("win");
  });
});

