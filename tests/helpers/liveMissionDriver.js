import PF from "pathfinding";
import { createShadowState } from "../../src/lib/game/mission.js";
import { updateGame } from "../../src/lib/game/gameLoop.js";
import {
  lineBlockedByRects,
  circleOverlapsRect,
} from "../../src/lib/game/collision.js";
// Test agents inspect the world to plan routes, then send only ordinary button
// inputs at 30Hz. They never teleport actors, change NPCs, grant objectives,
// remove hazards, alter cooldowns or assign victory. Captures use real revive.
export function runLiveMission(roles) {
  let phase = "infiltration";
  let rescueId = null,
    huntId = null;
  const s = createShadowState(roles.map((role, i) => ({ id: i + 1, role }))),
    DT = 1 / 30,
    C = 8;
  const finder = new PF.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true,
  });
  const toward = (p, x, y) => ({
    left: p.x > x + 2,
    right: p.x < x - 2,
    up: p.y > y + 2,
    down: p.y < y - 2,
  });
  function tick(input = {}) {
    updateGame(
      s,
      DT,
      Object.fromEntries(
        s.players.map((p) => [
          p.id,
          { ability: p.role === "Assassin", interact: true, ...input[p.id] },
        ]),
      ),
    );
    if (s.screen === "loss")
      throw Error(
        "lost " +
          s.lossReason +
          " " +
          s.alarm +
          " phase=" +
          phase +
          " " +
          JSON.stringify(
            s.players.map((p) => ({
              id: p.id,
              x: p.x,
              y: p.y,
              down: p.downed,
            })),
          ),
      );
  }
  let geometryKey = null;
  let geometry = null;
  function plan(p, x, y) {
    // Cache unchanged floor geometry; dynamic masks reproduce the same grid at
    // every planning step without repeatedly rasterizing all furniture per cell.
    const key = s.doors.find((d) => d.id === "door_vault").open;
    if (geometryKey !== key) {
      geometryKey = key;
      const solids = [
        ...s.walls,
        ...s.crates,
        ...s.doors.filter((d) => d.id === "door_vault" && !d.open),
      ];
      geometry = Array.from({ length: 100 }, (_, r) =>
        Array.from({ length: 160 }, (_, c) => {
          const xx = c * C + C / 2,
            yy = r * C + C / 2;
          return solids.some(
            (a) =>
              xx > a.x - 16 &&
              xx < a.x + a.w + 16 &&
              yy > a.y - 16 &&
              yy < a.y + a.h + 16,
          )
            ? 1
            : 0;
        }),
      );
    }
    const mat = geometry.map((row) => row.slice());
    function mask(point, radius, visible = () => true) {
      for (
        let row = Math.max(0, Math.floor((point.y - radius) / C) - 1);
        row <= Math.min(99, Math.ceil((point.y + radius) / C) + 1);
        row++
      ) {
        for (
          let col = Math.max(0, Math.floor((point.x - radius) / C) - 1);
          col <= Math.min(159, Math.ceil((point.x + radius) / C) + 1);
          col++
        ) {
          const xx = col * C + C / 2,
            yy = row * C + C / 2;
          if (
            !mat[row][col] &&
            Math.hypot(point.x - xx, point.y - yy) < radius &&
            visible(xx, yy)
          )
            mat[row][col] = 1;
        }
      }
    }
    for (const other of s.players) if (other !== p) mask(other, 26);
    for (const g of s.guards)
      if (!(g.stunned > 1)) {
        const radius =
          p.role === "Assassin" &&
          (!s.mission.objectives.find((o) => o.id === "credential")
            .completedBy ||
            g.id === huntId) &&
          p.abilityCooldown < 0.1
            ? 0
            : p.id === rescueId
              ? 45
              : 130;
        mask(
          g,
          radius,
          (xx, yy) => !lineBlockedByRects(g.x, g.y, xx, yy, s.walls),
        );
      }
    const sx = Math.floor(p.x / C),
      sy = Math.floor(p.y / C),
      tx = Math.floor(x / C),
      ty = Math.floor(y / C);
    mat[sy][sx] = 0;
    return finder
      .findPath(sx, sy, tx, ty, new PF.Grid(mat))
      .map(([c, r]) => [c * C + C / 2, r * C + C / 2]);
  }
  function go(id, x, y, range = 9) {
    const p = s.players[id - 1];
    let path = [],
      next = 0;
    for (let i = 0; i < 3600; i++) {
      if (Math.hypot(p.x - x, p.y - y) < range) {
        return;
      }
      if (i % 3 === 0) {
        path = plan(p, x, y);
        next = 1;
      }
      while (
        next < path.length &&
        Math.hypot(p.x - path[next][0], p.y - path[next][1]) < 4
      )
        next++;
      let target = path[next] || (!path.length ? null : [x, y]);
      if (!target) {
        const threats = s.guards.filter(
          (g) =>
            !(g.stunned > 1) &&
            !lineBlockedByRects(p.x, p.y, g.x, g.y, s.walls),
        );
        if (threats.some((g) => Math.hypot(p.x - g.x, p.y - g.y) < 130)) {
          let best = -Infinity;
          for (let a = 0; a < 16; a++) {
            const xx = p.x + 32 * Math.cos((a * Math.PI) / 8),
              yy = p.y + 32 * Math.sin((a * Math.PI) / 8);
            const solids = [
              ...s.walls,
              ...s.crates,
              ...s.doors.filter((d) => !d.open),
            ];
            if (
              lineBlockedByRects(p.x, p.y, xx, yy, solids) ||
              solids.some((r) =>
                circleOverlapsRect(xx, yy, 12, r.x, r.y, r.w, r.h),
              )
            )
              continue;
            const score =
              Math.min(...threats.map((g) => Math.hypot(xx - g.x, yy - g.y))) -
              Math.hypot(xx - x, yy - y) * 0.04;
            if (score > best) {
              best = score;
              target = [xx, yy];
            }
          }
        }
      }
      tick({
        [id]: {
          ...(target ? toward(p, ...target) : {}),
          ability: ["Assassin", "Hacker"].includes(p.role),
        },
      });
      if (p.downed)
        throw Error(
          "down " + id + " at " + p.x + "," + p.y + " target " + x + "," + y,
        );
    }
    throw Error(
      "stuck " +
        id +
        " " +
        p.x +
        "," +
        p.y +
        " target " +
        x +
        "," +
        y +
        " guards " +
        JSON.stringify(
          s.guards.map((g) => ({ id: g.id, x: g.x, y: g.y, mode: g.mode })),
        ),
    );
  }
  function many(goals, done, max = 3600) {
    const paths = {};
    for (let i = 0; i < max; i++) {
      if (done()) return;
      const downed = s.players.find((p) => p.downed);
      const rescuer = downed
        ? s.players
            .filter((p) => !p.downed)
            .sort(
              (a, b) =>
                Math.hypot(a.x - downed.x, a.y - downed.y) -
                Math.hypot(b.x - downed.x, b.y - downed.y),
            )[0]
        : null;
      rescueId = rescuer?.id;
      const input = {};
      for (const [id, goal] of Object.entries(goals)) {
        const p = s.players[id - 1];
        let [x, y] = typeof goal === "function" ? goal() : goal;
        const rescue = p.id === rescueId;
        if (rescue) {
          const a = Math.atan2(p.y - downed.y, p.x - downed.x);
          x = downed.x + 32 * Math.cos(a);
          y = downed.y + 32 * Math.sin(a);
        }
        if (i % 3 === 0 || !paths[id])
          paths[id] = { path: plan(p, x, y), next: 1 };
        const cache = paths[id],
          path = cache.path;
        let next = cache.next;
        while (
          next < path.length &&
          Math.hypot(p.x - path[next][0], p.y - path[next][1]) < 4
        )
          next++;
        cache.next = next;
        let target = path[next] || (!path.length ? null : [x, y]);
        if (
          !rescue &&
          (!target ||
            (Math.hypot(p.x - x, p.y - y) < 12 &&
              s.guards.some(
                (g) =>
                  !(g.stunned > 1) && Math.hypot(p.x - g.x, p.y - g.y) < 95,
              )))
        ) {
          const threats = s.guards.filter(
            (g) =>
              !(g.stunned > 1) &&
              !lineBlockedByRects(p.x, p.y, g.x, g.y, s.walls),
          );
          if (threats.some((g) => Math.hypot(p.x - g.x, p.y - g.y) < 130)) {
            let best = -Infinity;
            for (let a = 0; a < 16; a++) {
              const xx = p.x + 32 * Math.cos((a * Math.PI) / 8),
                yy = p.y + 32 * Math.sin((a * Math.PI) / 8);
              const solids = [
                ...s.walls,
                ...s.crates,
                ...s.doors.filter((d) => !d.open),
              ];
              if (
                lineBlockedByRects(p.x, p.y, xx, yy, solids) ||
                solids.some((r) =>
                  circleOverlapsRect(xx, yy, 12, r.x, r.y, r.w, r.h),
                )
              )
                continue;
              const score =
                Math.min(
                  ...threats.map((g) => Math.hypot(xx - g.x, yy - g.y)),
                ) -
                Math.hypot(xx - x, yy - y) * 0.04;
              if (score > best) {
                best = score;
                target = [xx, yy];
              }
            }
          }
        }
        if (
          rescue &&
          Math.hypot(p.x - downed.x, p.y - downed.y) < 36 &&
          !lineBlockedByRects(p.x, p.y, downed.x, downed.y, s.walls)
        )
          target = null;
        input[id] = {
          ...(target ? toward(p, ...target) : {}),
          ability: ["Assassin", "Hacker"].includes(p.role),
          interact: true,
        };
      }
      tick(input);
    }
    throw Error(
      "many stuck " +
        JSON.stringify(s.players.map((p) => ({ id: p.id, x: p.x, y: p.y }))) +
        " " +
        JSON.stringify(s.mission.objectives),
    );
  }

  go(2, 462, 430, 48);
  for (
    let i = 0;
    i < 900 &&
    !s.mission.objectives.find((o) => o.id === "credential").completedBy;
    i++
  ) {
    const g = s.guards.find((g) => g.id === "g6");
    go(2, g.x, g.y, 50);
    tick({ 2: { ability: true } });
  }
  go(2, 184, 660);
  if (roles.includes("Scout") && roles.length === 4) {
    phase = "scout";
    const route = (points) => {
      for (const [x, y] of points) {
        let arrived = false;
        for (let i = 0; i < 900; i++) {
          const p = s.players[2];
          if (Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3) {
            arrived = true;
            break;
          }
          tick({ 3: toward(p, x, y) });
        }
        if (!arrived) throw Error("Scout route blocked");
      }
    };
    route([
      [100, 752],
      [100, 620],
      [208, 620],
      [312, 620],
      [312, 400],
    ]);
    tick({ 3: { ability: true } });
    route([
      [312, 620],
      [208, 620],
      [124, 580],
    ]);
  }
  go(1, 164, 136);
  tick({ 1: { interact: true } });
  go(1, 128, 660);
  phase = "camera";
  go(1, 560, 380);
  go(1, 128, 660);
  if (roles.includes("Scout") && roles.length === 3) {
    go(3, 312, 400);
    tick({ 3: { ability: true } });
    go(3, 124, 580);
  }
  phase = "decoy";
  if (roles.includes("Decoy")) {
    const id = s.players.find((p) => p.role === "Decoy").id;
    if (roles.length === 4) {
      const route = (points) => {
        for (const [x, y] of points) {
          let ok = false;
          for (let i = 0; i < 900; i++) {
            const p = s.players[id - 1];
            if (Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3) {
              ok = true;
              break;
            }
            tick({ [id]: toward(p, x, y) });
          }
          if (!ok)
            throw Error(
              "Decoy route blocked " +
                x +
                "," +
                y +
                " " +
                JSON.stringify(
                  s.players.map((p) => ({
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    down: p.downed,
                  })),
                ),
            );
        }
      };
      route([
        [216, 752],
        [216, 620],
        [312, 620],
        [312, 430],
      ]);
      let opening = false;
      for (let i = 0; i < 1800; i++) {
        const captain = s.guards.find((g) => g.id === "g6"),
          sentry = s.guards.find((g) => g.id === "g2");
        if (captain.y > 560 && captain.facing > 0 && sentry.y > 620) {
          opening = true;
          break;
        }
        tick({});
      }
      if (!opening) throw Error("No patrol opening");
      route([
        [540, 430],
        [540, 410],
        [850, 410],
        [850, 400],
      ]);
      let cast = false;
      for (let i = 0; i < 1800; i++) {
        const g = s.guards.find((g) => g.id === "g2");
        if (
          g.mode !== "chase" &&
          g.x < 740 &&
          g.y < 510 &&
          Math.hypot(g.x - 850, g.y - 400) < 260
        ) {
          tick({ [id]: { ability: true } });
          cast = true;
          break;
        }
        tick({});
      }
      if (!cast) throw Error("No sentry lure opening");
      huntId = "g6";
      many(
        { 2: [560, 430], [id]: [850, 560] },
        () => s.mission.checkpoint.cleared,
        6000,
      );
      huntId = null;
      many(
        { 2: [184, 650], [id]: [120, 620] },
        () => s.players[1].atVan && s.players[id - 1].atVan,
        6000,
      );
    } else {
      go(id, 840, 430);
      tick({ [id]: { ability: true } });
      many(
        { 1: [560, 430], [id]: [840, 560] },
        () => s.mission.checkpoint.cleared,
        6000,
      );
      many(
        { 1: [800, 420], [id]: [120, 660] },
        () => s.players[id - 1].atVan,
        6000,
      );
    }
  }
  if (roles.length === 4) {
    // Regroup after the long four-role infiltration. This is ordinary movement
    // and waiting for main's real alert recovery, not an alarm assignment.
    many(
      { 1: [148, 620], 2: [184, 660], 3: [124, 580], 4: [120, 660] },
      () => s.players.every((p) => p.atVan && !p.downed),
      6000,
    );
    for (let i = 0; i < 900; i++) tick({});
  }

  phase = "terminal";
  many({ 1: [1122, 668], 2: [1000, 668] }, () => s.mission.securityOff);
  phase = "decoy";
  if (roles.includes("Decoy")) {
    huntId = "g2";
    many(
      {
        1: [896, 412],
        2: () => {
          const g = s.guards.find((g) => g.id === "g2");
          return [g.x, g.y];
        },
      },
      () => s.vaultUnlocked,
    );
    huntId = null;
    many({ 1: [1030, 420], 2: [860, 440] }, () => !!s.players[0].holding);
  } else {
    many({ 1: [896, 412], 2: [184, 632] }, () => s.vaultUnlocked);
    many({ 1: [1030, 420], 2: [184, 632] }, () => !!s.players[0].holding);
  }
  many(
    {
      1: [148, 620],
      2: [184, 632],
      ...Object.fromEntries(
        s.players
          .filter((p) => p.id > 2)
          .map((p, i) => [p.id, p.role === "Scout" ? [124, 580] : [120, 660]]),
      ),
    },
    () => s.screen === "win",
    6000,
  );
  return s;
}
