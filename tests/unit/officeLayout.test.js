import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createShadowState } from "../../src/lib/game/mission.js";
import {
  applyLevel,
  LEVEL,
  walls as mapWalls,
} from "../../src/lib/game/mapData.js";
import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_R,
} from "../../src/lib/game/constants.js";
import { circleOverlapsRect, lineIntersectsCircle } from "../../src/lib/game/collision.js";
import { computeGuardPath } from "../../src/lib/game/guardNav.js";
import { SAFEHOUSE } from "../../src/lib/game/levels/safehouse.js";
import { OFFICE } from "../../src/lib/game/levels/office.js";
import { listLevels } from "../../src/lib/game/levels/index.js";

const STEP = 4;
const HOUSE_ID = SAFEHOUSE.id;
const OFFICE_ID = OFFICE.id;
const DIAM = PLAYER_R * 2;

const roster = () => [
  { id: 1, role: "Hacker" },
  { id: 2, role: "Assassin" },
  { id: 3, role: "Scout" },
  { id: 4, role: "Decoy" },
];

function solidsFor(s, open = []) {
  return [
    ...s.walls,
    ...s.doors.filter((d) => !d.open && !open.includes(d.id)),
  ];
}

function standable(x, y, solids, r = PLAYER_R) {
  if (x < r || y < r || x > CANVAS_W - r || y > CANVAS_H - r) return false;
  return !solids.some((s) => circleOverlapsRect(x, y, r, s.x, s.y, s.w, s.h));
}

function flood(solids, start, { lasers = [] } = {}) {
  const cols = Math.floor(CANVAS_W / STEP);
  const rows = Math.floor(CANVAS_H / STEP);
  const free = (c, r) => {
    const x = c * STEP + STEP / 2;
    const y = r * STEP + STEP / 2;
    if (!standable(x, y, solids)) return false;
    return !lasers.some((l) =>
      lineIntersectsCircle(l.x1, l.y1, l.x2, l.y2, x, y, PLAYER_R),
    );
  };
  const seen = new Uint8Array(cols * rows);
  const sc = Math.floor(start.x / STEP);
  const sr = Math.floor(start.y / STEP);
  const queue = [[sc, sr]];
  seen[sr * cols + sc] = 1;
  while (queue.length) {
    const [c, r] = queue.pop();
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const i = nr * cols + nc;
      if (seen[i] || !free(nc, nr)) continue;
      seen[i] = 1;
      queue.push([nc, nr]);
    }
  }
  return (p) => {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const c = Math.floor(p.x / STEP) + dx;
        const r = Math.floor(p.y / STEP) + dy;
        if (seen[r * cols + c]) return true;
      }
    }
    return false;
  };
}

describe("office medium level", () => {
  beforeEach(() => {
    applyLevel(OFFICE_ID);
  });

  afterEach(() => {
    applyLevel(HOUSE_ID);
  });

  it("registers office without replacing the house", () => {
    const ids = listLevels().map((l) => l.id);
    expect(ids).toContain(HOUSE_ID);
    expect(ids).toContain(OFFICE_ID);
    expect(LEVEL.id).toBe(OFFICE_ID);
    expect(LEVEL.difficulty).toBe("medium");
    expect(SAFEHOUSE.difficulty).toBe("easy");
    expect(SAFEHOUSE.bounds).toEqual({ x: 0, y: 0, w: 1280, h: 800 });
  });

  it("uses a larger world than the easy house", () => {
    expect(OFFICE.bounds.w * OFFICE.bounds.h).toBeGreaterThan(
      SAFEHOUSE.bounds.w * SAFEHOUSE.bounds.h * 1.3,
    );
    expect(CANVAS_W).toBe(1760);
    expect(CANVAS_H).toBe(1080);
  });

  it("includes a distinct Conference Room plus the required office rooms", () => {
    const names = OFFICE.rooms.map((r) => r.name);
    expect(names).toContain("Boardroom");
    expect(names).toContain("Conference Room");
    expect(names).toContain("Executive Office");
    expect(names).toContain("Break Room");
    expect(names).toContain("Records");
    expect(names).toContain("Open Office");
    expect(names).toContain("Reception");
    expect(names).toContain("Server Room");
    expect(names).toContain("Security Control");
    expect(names).toContain("Secure Archive");
    expect(names.filter((n) => n === "Boardroom").length).toBe(1);
    expect(names.filter((n) => n === "Conference Room").length).toBe(1);
  });

  it("has more guards than the easy house", () => {
    expect(OFFICE.guards.length).toBeGreaterThan(SAFEHOUSE.guards.length);
    expect(OFFICE.guards.length).toBe(10);
    expect(OFFICE.cameras.length).toBeGreaterThanOrEqual(6);
    expect(OFFICE.cameras.some((c) => c.id.includes("corridor"))).toBe(true);
    expect(OFFICE.lasers.length).toBe(2);
    expect(OFFICE.doors.filter((d) => d.requiredBy === "hacker_lock").length).toBeGreaterThanOrEqual(4);
  });

  it("places keys far apart with one in Records", () => {
    const alpha = OFFICE.mission.keys.find((k) => k.id === "ALPHA");
    const bravo = OFFICE.mission.keys.find((k) => k.id === "BRAVO");
    expect(alpha.room).toBe("Boardroom");
    expect(bravo.room).toBe("Records");
    expect(Math.hypot(alpha.x - bravo.x, alpha.y - bravo.y)).toBeGreaterThan(400);
  });

  it("seals corridor from reception, conference, and head office", () => {
    expect(OFFICE.doors.some((d) => d.id === "door_conference")).toBe(false);
    expect(OFFICE.doors.some((d) => d.id === "door_executive")).toBe(false);
    expect(OFFICE.doors.some((d) => d.id === "door_rx_n")).toBe(false);
    expect(OFFICE.doors.some((d) => d.id === "door_records")).toBe(false);
    expect(OFFICE.doors.some((d) => d.id === "door_or_s")).toBe(false);
    expect(OFFICE.doors.some((d) => d.id === "door_break_n")).toBe(true);
    expect(OFFICE.doors.filter((d) => d.id.startsWith("door_or_")).length).toBe(1);
  });

  it("keeps entry and extraction as separate configured zones", () => {
    const s = createShadowState(roster());
    for (const p of s.players) {
      expect(p.y).toBeGreaterThan(980);
      expect(p.x).toBeGreaterThan(1100);
      expect(p.x).toBeLessThan(1300);
    }
    expect(s.van.x).toBeGreaterThan(1400);
    expect(s.van.y).toBeLessThan(200);
    const dx = Math.abs(s.players[0].x - (s.van.x + s.van.w / 2));
    const dy = Math.abs(s.players[0].y - (s.van.y + s.van.h / 2));
    expect(dx + dy).toBeGreaterThan(400);
  });

  it("places non-overlapping standable spawns", () => {
    const s = createShadowState(roster());
    const solids = solidsFor(s);
    for (const p of s.players) {
      expect(standable(p.x, p.y, solids)).toBe(true);
    }
    for (let i = 0; i < s.players.length; i += 1) {
      for (let j = i + 1; j < s.players.length; j += 1) {
        const a = s.players[i];
        const b = s.players[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(PLAYER_R * 2);
      }
    }
  });

  it("keeps objectives reachable and terminal/override separated", () => {
    const s = createShadowState(roster());
    for (const d of s.doors) {
      if (d.id === "door_vault" || d.requiredBy === "hacker_lock") d.open = true;
    }
    for (const l of s.lasers) l.active = false;
    const solids = solidsFor(s);
    const reach = flood(solids, s.players[0], { lasers: [] });
    for (const k of s.mission.keys) {
      expect(standable(k.x, k.y, solids)).toBe(true);
      expect(reach(k)).toBe(true);
    }
    expect(reach(s.mission.terminal)).toBe(true);
    expect(reach(s.mission.support)).toBe(true);
    expect(Math.hypot(
      s.mission.terminal.x - s.mission.support.x,
      s.mission.terminal.y - s.mission.support.y,
    )).toBeGreaterThan(80);
    expect(reach(s.artifacts[0])).toBe(true);
    expect(reach({ x: s.van.x + s.van.w / 2, y: s.van.y + s.van.h / 2 })).toBe(
      true,
    );
    // Conference room floor is reachable (perimeter, not table center)
    const conf = OFFICE.rooms.find((r) => r.id === "conference");
    expect(reach({ x: conf.x + conf.w / 2, y: conf.y + conf.h - 40 })).toBe(true);
  });

  it("meets corridor and doorway clearance targets", () => {
    const s = createShadowState(roster());
    const openHack = s.doors.filter((d) => d.requiredBy === "hacker_lock").map((d) => d.id);
    const solids = solidsFor(s, ["door_vault", ...openHack]);
    // Main corridor ≥ ~6 diameters (~120px) at x=600
    let clear = 0;
    for (let y = 360; y < 500; y += 4) {
      if (standable(600, y, solids)) clear += 4;
    }
    expect(clear).toBeGreaterThanOrEqual(DIAM * 6);
    for (const d of s.doors.filter((d) => d.open && d.requiredBy == null)) {
      const span = d.w >= d.h ? d.w : d.h;
      expect(span).toBeGreaterThanOrEqual(DIAM * 3);
    }
  });

  it("keeps patrol waypoints on standable floor", () => {
    const s = createShadowState(roster());
    const openHack = s.doors.filter((d) => d.requiredBy === "hacker_lock").map((d) => d.id);
    const solids = solidsFor(s, ["door_vault", ...openHack]);
    for (const g of s.guards) {
      expect(g.post).toBeTruthy();
      expect(g.home).toBeTruthy();
      expect(standable(g.post.x, g.post.y, solids, 11)).toBe(true);
      for (const p of g.patrol) {
        expect(standable(p.x, p.y, solids, 11)).toBe(true);
      }
      const path = computeGuardPath(
        s,
        g.patrol[0].x,
        g.patrol[0].y,
        g.patrol[1].x,
        g.patrol[1].y,
      );
      expect(path.length).toBeGreaterThan(0);
    }
  });

  it("restores the house map when reselected", () => {
    applyLevel(HOUSE_ID);
    expect(LEVEL.id).toBe(HOUSE_ID);
    expect(CANVAS_W).toBe(SAFEHOUSE.bounds.w);
    expect(CANVAS_H).toBe(SAFEHOUSE.bounds.h);
    expect(mapWalls.length).toBeGreaterThan(10);
    const s = createShadowState(roster().slice(0, 2));
    expect(s.players[0].x).toBeLessThan(300);
  });
});
