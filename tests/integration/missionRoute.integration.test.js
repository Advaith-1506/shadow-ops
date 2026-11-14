import { describe, expect, it } from "vitest";
import { createShadowState } from "../../src/lib/game/mission.js";
import { updateGame } from "../../src/lib/game/gameLoop.js";

// Drives operatives with button inputs only (no teleporting) through the
// authoritative simulation, from spawn to a winning extraction.
const DT = 1 / 30;

function makeDriver(s) {
  const idle = () => Object.fromEntries(s.players.map((p) => [p.id, {}]));
  const tick = (inputs) => {
    updateGame(s, DT, { ...idle(), ...inputs });
    if (s.screen === "loss") throw new Error(`Mission lost: ${s.lossReason} (alert ${Math.round(s.alarm)})`);
    return s.screen === "playing" || s.screen === "win";
  };
  const goTo = (id, route) => {
    for (const [tx, ty] of route) {
      let ok = false;
      for (let i = 0; i < 30 * 20; i += 1) {
        const p = s.players.find((q) => q.id === id);
        const dx = tx - p.x;
        const dy = ty - p.y;
        if (Math.abs(dx) <= 2.5 && Math.abs(dy) <= 2.5) { ok = true; break; }
        const input = { left: dx < -2.5, right: dx > 2.5, up: dy < -2.5, down: dy > 2.5 };
        if (!tick({ [id]: input })) return false;
      }
      if (!ok) throw new Error(`P${id} could not reach (${tx}, ${ty})`);
    }
    return true;
  };
  const interact = (id) => {
    tick({ [id]: { interact: true } });
    tick({ [id]: {} });
  };
  return { goTo, interact, tick };
}

describe("full mission via player inputs", () => {
  it("collects both keys, cooperates at security, opens the vault and extracts all four", () => {
    const s = createShadowState([
      { id: 1, role: "Hacker" },
      { id: 2, role: "Assassin" },
      { id: 3, role: "Scout" },
      { id: 4, role: "Hacker" },
    ]);
    // Guards are held out of the way so the route itself is what's tested;
    // cameras and lasers stay live and the alert must stay below lockdown.
    for (const g of s.guards) g.stunned = 1e9;
    const d = makeDriver(s);
    const toLiving = [[128, 620], [312, 620], [312, 430], [540, 430]];

    // P1 Hacker: ALPHA in the kitchen, BRAVO in the study, then the terminal.
    d.goTo(1, [...toLiving, [560, 176], [470, 176], [420, 140], [164, 136]]);
    d.interact(1);
    expect(s.mission.keys.find((k) => k.id === "ALPHA").collected).toBe(true);
    d.goTo(1, [[420, 140], [470, 176], [580, 120], [900, 120], [900, 194], [960, 194], [1170, 230]]);
    d.interact(1);
    expect(s.mission.keys.every((k) => k.collected)).toBe(true);
    // Wait out of camera view while the Assassin moves up.
    d.goTo(1, [[960, 194], [900, 194], [880, 300], [880, 560]]);
    const alertBeforeSecurity = s.alarm;

    // P2 Assassin takes the support pad.
    d.goTo(2, [[176, 640], [312, 640], [312, 430], [540, 430], [860, 444], [860, 634], [960, 634], [1000, 668]]);

    d.goTo(1, [[880, 616], [1122, 616], [1122, 668]]);
    d.interact(1);
    expect(s.mission.securityOff).toBe(true);
    expect(alertBeforeSecurity).toBeLessThan(100);

    // Vault lock, then the Diamond.
    d.goTo(1, [[960, 634], [880, 634], [880, 412], [896, 412]]);
    d.interact(1);
    expect(s.vaultUnlocked).toBe(true);
    d.goTo(1, [[1030, 412], [1030, 420]]);
    d.interact(1);
    expect(s.players[0].holding?.id).toBe("art_crown");

    // Everyone to extraction.
    d.goTo(1, [[900, 412], [880, 444], [540, 444], [312, 432], [312, 620], [150, 604]]);
    d.goTo(2, [[960, 634], [880, 634], [880, 444], [540, 444], [312, 432], [312, 640], [184, 632]]);
    d.goTo(3, [[124, 650]]);
    expect(s.screen).toBe("playing");
    d.goTo(4, [[176, 668]]);
    for (let i = 0; i < 3 && s.screen === "playing"; i += 1) d.tick({});

    expect(s.alarm).toBeLessThan(100);
    expect(s.screen).toBe("win");
  });
});
