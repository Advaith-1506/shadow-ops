import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { it, expect } from "vitest";
import MenuScreen from "../../src/components/game/MenuScreen.jsx";
import InstructionsScreen from "../../src/components/game/InstructionsScreen.jsx";
import MissionBriefing from "../../src/components/game/MissionBriefing.jsx";
import ResultScreen from "../../src/components/game/ResultScreen.jsx";
import { createShadowState } from "../../src/lib/game/mission.js";
import { LEVEL } from "../../src/lib/game/mapData.js";
import { circleOverlapsRect } from "../../src/lib/game/collision.js";
const markup = (C, props = {}) =>
  renderToStaticMarkup(React.createElement(C, props));
it("renders the supplied logo and every working menu entry", () => {
  const html = markup(MenuScreen);
  for (const text of [
    'alt="Shadow Ops"',
    "HOST GAME",
    "JOIN GAME",
    "LOCAL PLAY",
    "HOW TO PLAY",
    "MAPLE ROW",
  ])
    expect(html).toContain(text);
  expect(html).not.toContain("settings");
});
it.each([
  [["Hacker", "Assassin"]],
  [["Hacker", "Assassin", "Scout"]],
  [["Hacker", "Assassin", "Decoy"]],
  [["Hacker", "Assassin", "Scout", "Decoy"]],
])("briefing reflects %j without inventing optional roles", (roles) => {
  const html = markup(MissionBriefing, {
    players: roles.map((role, i) => ({ id: i + 1, role })),
  });
  expect(html.includes("Scout: pulse")).toBe(roles.includes("Scout"));
  expect(html.includes("Decoy: lure")).toBe(roles.includes("Decoy"));
  expect(html).toContain("BRAVO (Study)");
});
it("manual starts on overview with genuine roles and section navigation", () => {
  const html = markup(InstructionsScreen);
  for (const text of [
    "Overview",
    "Roles",
    "Objectives",
    "Controls",
    "Tips",
    "Hacker",
    "Assassin",
    "Scout",
    "Decoy",
  ])
    expect(html).toContain(text);
});
it("results render only recorded contributions and preserve host-only replay", () => {
  const state = createShadowState([
    { id: 1, role: "Hacker" },
    { id: 2, role: "Assassin" },
  ]);
  state.screen = "loss";
  state.lossReason = "Captured during infiltration";
  state.players[0].stats.scans = 0;
  const html = markup(ResultScreen, { state, networked: true, isHost: false });
  expect(html).toContain("MISSION FAILED");
  expect(html).toContain(state.lossReason);
  expect(html).toContain("disabled");
  expect(html).not.toContain("scans:");
  expect(html).toContain("No recorded objective or ability actions");
});
it("BRAVO is on clear Study floor, with ALPHA unchanged and no duplicate keys", () => {
  const s = createShadowState([
      { id: 1, role: "Hacker" },
      { id: 2, role: "Assassin" },
    ]),
    keys = s.mission.keys;
  expect(keys).toHaveLength(2);
  expect(keys[0]).toMatchObject({ id: "ALPHA", x: 164, y: 136 });
  const b = keys.find((k) => k.id === "BRAVO"),
    study = LEVEL.rooms.find((r) => r.id === "study");
  expect(b.x).toBeGreaterThan(study.x);
  expect(b.x).toBeLessThan(study.x + study.w);
  expect(b.y).toBeGreaterThan(study.y);
  expect(b.y).toBeLessThan(study.y + study.h);
  expect(
    s.walls.some((r) => circleOverlapsRect(b.x, b.y, 10, r.x, r.y, r.w, r.h)),
  ).toBe(false);
});
