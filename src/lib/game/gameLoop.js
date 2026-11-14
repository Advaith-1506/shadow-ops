/*
 * GAME LOOP
 * Called every animation frame while screen === 'playing'.
 * Orchestrates all system updates and checks win/loss conditions.
 */

import { updateMissionWorld, updateMissionPlayer } from "./mission.js";
import { MAX_ALARM } from "./constants.js";
import {
  getP1Input,
  getP2Input,
  getLocalP3Input,
  getLocalP4Input,
} from "./input.js";
import { updatePlayer } from "./playerLogic.js";
import {
  updateGuards,
  updateCameras,
  updateLasers,
  updatePressurePlates,
  updateCrates,
} from "./entityLogic.js";
import { isWinConditionMet, calculateScore } from "./gameState.js";

export function updateGame(state, dt, inputByPlayer = null) {
  updateMissionWorld(state, dt);
  // ── Countdown timer ─────────────────────────────────────────────────────────
  state.timer -= dt;
  if (state.timer <= 0) {
    state.timer = 0;
    _endGame(state, "loss", "Time's up! The safehouse went into lockdown.");
    return;
  }

  // ── Alarm limit ─────────────────────────────────────────────────────────────
  if (state.alarm >= MAX_ALARM) {
    _endGame(
      state,
      "loss",
      "Alarm reached 100%! Security locked down the safehouse.",
    );
    return;
  }

  // ── Read input ──────────────────────────────────────────────────────────────
  const fallbackInputs = {
    1: getP1Input(),
    2: getP2Input(),
    3: getLocalP3Input(),
    4: getLocalP4Input(),
  };

  // ── Update players ──────────────────────────────────────────────────────────
  for (const player of state.players) {
    const input = inputByPlayer?.[player.id] ||
      fallbackInputs[player.id] || {
        up: false,
        down: false,
        left: false,
        right: false,
        interact: false,
      };
    updatePlayer(player, input, state, dt);
    if (state.mission) updateMissionPlayer(state, player, input, dt);
  }

  // ── Update entities ─────────────────────────────────────────────────────────
  updatePressurePlates(state); // run first so doors update before collision
  updateGuards(state, dt);
  updateCameras(state, dt);
  updateLasers(state, dt);
  updateCrates(state, dt);

  // ── Tutorial countdown ──────────────────────────────────────────────────────
  if (state.tutorialTimer > 0) state.tutorialTimer -= dt;

  // ── Custody timers (downed players) ────────────────────────────────────────
  for (const player of state.players) {
    if (!player.downed) continue;
    player.custodyTimer = Math.max(0, player.custodyTimer - dt);
    player.reviveProgress = Math.max(0, player.reviveProgress - dt * 0.35);
    if (player.custodyTimer <= 0) {
      _endGame(state, "loss", `P${player.id} was captured for too long.`);
      return;
    }
  }

  // ── Win check ───────────────────────────────────────────────────────────────
  if (isWinConditionMet(state)) {
    _endGame(state, "win", "");
  }
}

function _endGame(state, result, reason) {
  state.screen = result;
  state.lossReason = reason;
  state.score = calculateScore(state);
}
