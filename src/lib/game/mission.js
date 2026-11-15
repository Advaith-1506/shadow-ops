import { createGameState } from "./gameState.js";
import { dist, lineBlockedByRects } from "./collision.js";
import {
  createMissionConfig,
  requiredMissionsComplete,
} from "./missionConfig.js";
import { missionLayout, LEVEL } from "./mapData.js";
export const ROLES = ["Assassin", "Hacker", "Scout", "Decoy"];
export const COOLDOWNS = { Assassin: 12, Hacker: 16, Scout: 18, Decoy: 16 };
export function createShadowState(roster) {
  const config = createMissionConfig(roster, LEVEL);
  const s = createGameState(roster.length);
  s.screen = "playing";
  s.tutorialTimer = 0;
  s.players.forEach((p, i) => {
    p.id = roster[i].id;
    p.nickname = roster[i].nickname || `Operative ${p.id}`;
    p.stats = {
      keys: 0,
      security: 0,
      vault: 0,
      artifact: 0,
      revives: 0,
      takedowns: 0,
      overrides: 0,
      scans: 0,
      distractions: 0,
    };
    p.role = roster[i].role;
    p.label = p.role;
    p.baseSpeed = 140;
    p.abilityCooldown = 0;
    p.scanTime = 0;
  });
  s.distractions = [];
  s.events = [];
  s.eventSequence = 0;
  s.artifacts = s.artifacts.filter((a) => a.id === "art_crown");
  s.mission = {
    config,
    objectives: config.objectives.map((o) => ({
      ...o,
      status: o.prerequisites.length ? "locked" : "available",
      completedBy: null,
      completedAt: null,
      contributions: [],
      visibility: o.visibility,
    })),
    recon: config.anchors.reconZone ? { discovered: false, code: null } : null,
    checkpoint: config.anchors.checkpoint
      ? {
          windowRemaining: 0,
          noiseId: null,
          sourcePlayerId: null,
          observedMovement: 0,
          cleared: false,
        }
      : null,
    keys: missionLayout.keys.map((k) => ({
      id: k.id,
      x: k.x,
      y: k.y,
      collected: false,
      requiredRole: "Team",
      method: "pickup",
    })),
    terminal: { x: missionLayout.terminal.x, y: missionLayout.terminal.y },
    support: { x: missionLayout.support.x, y: missionLayout.support.y },
    lock: { x: missionLayout.lock.x, y: missionLayout.lock.y },
    securityOff: false,
    cameraNetworkOff: false,
    message: "Collect ALPHA and BRAVO access keys",
  };
  const captain = s.guards.find((g) => g.id === config.anchors.captainId);
  if (!captain) throw Error("Security captain not present on map");

  s.mission.message = missionStage(s);
  return s;
}
function near(s, p, target, range = 52) {
  return (
    dist(p.x, p.y, target.x, target.y) <= range &&
    !lineBlockedByRects(p.x, p.y, target.x, target.y, s.walls)
  );
}
export function missionStage(s) {
  if (s.mission?.config) {
    const first = s.mission.objectives.find((o) =>
      ["available", "in_progress"].includes(o.status),
    );
    if (first?.id === "checkpoint" && s.mission.checkpoint.windowRemaining > 0)
      return `CHECKPOINT OPEN ${Math.ceil(s.mission.checkpoint.windowRemaining)}s — Hacker/Assassin: INTERACT at relay`;
    if (first?.id === "shared_keys")
      return `Team keys: ${s.mission.keys.filter((k) => k.collected).length}/2 — any operative can collect`;
    return first?.label || "Mission complete";
  }
  return "Complete the team mission";
}
export function currentRolePrompt(s, p) {
  if (!s?.mission?.config) return s?.mission?.message || "";
  const m = s.mission;
  if (
    !complete(s, "security") &&
    m.objectives.find((o) => o.id === "security")?.status === "available"
  )
    return p?.role === "Hacker"
      ? "Go to TERMINAL and press INTERACT while a teammate stands on SUPPORT PAD."
      : "Stand on SUPPORT PAD. Stay there while Hacker presses INTERACT at TERMINAL.";
  if (
    m.checkpoint?.windowRemaining > 0 &&
    !complete(s, "checkpoint") &&
    ["Hacker", "Assassin"].includes(p?.role)
  )
    return `RELAY OPEN ${Math.ceil(m.checkpoint.windowRemaining)}s — press INTERACT at the Living Room checkpoint now!`;
  const prerequisiteNames = {
    credential: "Assassin credentials",
    shared_keys: "both team keys",
    electronic_door: "electronic door unlock",
    camera_network: "camera network shutdown",
    recon: "Scout discovery",
    checkpoint: "Decoy checkpoint",
  };
  const own = m.objectives.find(
    (o) => o.requiredRole === p?.role && o.status !== "complete",
  );
  if (own?.id === "electronic_door")
    return "Unlock electronic security door — use Ability beside the Garage pantry door.";
  if (own?.id === "camera_network")
    return "Disable camera network — use Ability beside the Living Room camera.";
  if (own?.id === "checkpoint" && m.checkpoint.windowRemaining > 0)
    return `Guard lured! Stay clear; Hacker/Assassin must INTERACT at checkpoint (${Math.ceil(m.checkpoint.windowRemaining)}s).`;
  return own
    ? `${own.label}${
        own.status === "locked"
          ? " — waiting for " +
            own.prerequisites
              .filter((id) => !complete(s, id))
              .map((id) => prerequisiteNames[id] || id)
              .join(", ")
          : ""
      }`
    : missionStage(s);
}
function complete(s, id) {
  return s.mission.objectives.some(
    (o) => o.id === id && o.status === "complete",
  );
}
function available(s, id) {
  const o = s.mission.objectives.find((o) => o.id === id);
  return (
    !!o &&
    o.status !== "complete" &&
    o.prerequisites.every((id) => complete(s, id))
  );
}
function finish(s, id, p, text, stat) {
  const o = s.mission.objectives.find((o) => o.id === id);
  if (!o || o.status === "complete" || !available(s, id)) return false;
  o.status = "complete";
  o.completedBy = p.id;
  o.completedAt = s.elapsedTime;
  o.visibility = "visible";
  o.contributions = [{ playerId: p.id, role: p.role, action: o.condition }];
  recordMissionEvent(s, p, text, stat);
  refreshObjectives(s);
  return true;
}
function refreshObjectives(s) {
  for (const o of s.mission.objectives)
    if (o.status !== "complete")
      o.status = o.prerequisites.every((id) => complete(s, id))
        ? "available"
        : "locked";
  const c = s.mission.checkpoint;
  if (c?.windowRemaining > 0 && available(s, "checkpoint"))
    s.mission.objectives.find((o) => o.id === "checkpoint").status =
      "in_progress";
  s.mission.message = missionStage(s);
}
export function updateMissionPlayer(s, p, input, dt) {
  p.abilityCooldown = Math.max(0, (p.abilityCooldown || 0) - dt);
  p.scanTime = Math.max(0, (p.scanTime || 0) - dt);
  const assigned = s.mission.config.participants.find((a) => a.id === p.id);
  if (p.downed || !assigned || assigned.role !== p.role) return;
  const m = s.mission;
  p.nearPrompt = null;
  if (input.ability && p.abilityCooldown <= 0) {
    let used = false;
    if (p.role === "Assassin") {
      const eligible = (g) => near(s, p, g, 62) && !(g.stunned > 0);
      const g =
        s.guards.find(
          (g) => g.id === m.config.anchors.captainId && eligible(g),
        ) || s.guards.find(eligible);
      if (g) {
        g.stunned = m.config.balance.stunDuration;
        if (p.stats) p.stats.takedowns++;
        if (
          g.id === m.config.anchors.captainId &&
          finish(
            s,
            "credential",
            p,
            "Assassin neutralized the security captain!",
            "credentials",
          )
        ) {
          g.stunned = m.config.balance.captainStunDuration;
        }
        used = true;
      }
    }
    if (p.role === "Hacker") {
      const c = s.cameras.find((c) => near(s, p, c, 100) && !(c.disabled > 0));
      if (c) {
        c.disabled = 10;
        if (
          c.id === m.config.anchors.networkCameraId &&
          finish(s, "camera_network", p, "Camera network disabled!", "networks")
        )
          m.cameraNetworkOff = true;
        if (p.stats) p.stats.overrides++;
        used = true;
      }
      const d = s.doors.find(
        (d) =>
          d.id !== "door_vault" &&
          !d.open &&
          near(s, p, { x: d.x + d.w / 2, y: d.y + d.h / 2 }, 65),
      );
      if (d) {
        d.open = true;
        if (p.stats) p.stats.overrides++;
        d.requiredBy = null;
        if (d.id === m.config.anchors.electronicDoorId)
          finish(
            s,
            "electronic_door",
            p,
            "Electronic security door unlocked!",
            "doors",
          );
        used = true;
      }
    }
    if (p.role === "Scout") {
      p.scanTime = 6;
      if (p.stats) p.stats.scans++;
      if (
        m.recon &&
        near(
          s,
          p,
          m.config.anchors.reconZone,
          m.config.balance.reconZoneRadius,
        ) &&
        dist(
          p.x,
          p.y,
          m.config.anchors.hiddenNode.x,
          m.config.anchors.hiddenNode.y,
        ) <= m.config.balance.scanRadius &&
        finish(
          s,
          "recon",
          p,
          "Recon complete — Security layout revealed.",
          "recon",
        )
      ) {
        m.recon.discovered = true;
        m.recon.code = "MAPLE-NODE-ONLINE";
      }
      used = true;
    }
    if (p.role === "Decoy") {
      s.distractions ||= [];
      const checkpointAttempt =
        available(s, "checkpoint") &&
        near(
          s,
          p,
          m.config.anchors.distractionZone,
          m.config.balance.noiseZoneRadius,
        );
      const guard = s.guards.find(
        (g) => g.id === m.config.anchors.checkpointGuardId,
      );
      s.distractions.push({
        id: ++s.eventSequence,
        x: p.x,
        y: p.y,
        remaining: checkpointAttempt ? m.config.balance.noiseDuration : 5,
        checkpointAttempt: !!checkpointAttempt,
        guardId: checkpointAttempt ? guard?.id : null,
        guardOrigin:
          checkpointAttempt && guard ? { x: guard.x, y: guard.y } : null,
        playerId: p.id,
      });
      if (p.stats) p.stats.distractions++;
      used = true;
    }
    if (used) p.abilityCooldown = COOLDOWNS[p.role];
  }
  const downed = s.players.find(
    (q) => q.id !== p.id && q.downed && near(s, p, q, 38),
  );
  if (downed) {
    p.nearPrompt = { text: "Hold E: revive teammate", warn: false };
    if (input.interact) downed.reviveProgress += dt;
    if (downed.reviveProgress >= 2) {
      if (p.stats) p.stats.revives++;
      downed.downed = false;
      downed.custodyTimer = 0;
      downed.reviveProgress = 0;
      downed.detected = 0;
    }
    return;
  }
  let action = null,
    prompt = "";
  const key = m.keys.find((k) => !k.collected && near(s, p, k));
  const relay = m.config.anchors.checkpoint;
  if (relay && !complete(s, "checkpoint") && near(s, p, relay)) {
    const guard = s.guards.find(
      (g) => g.id === m.config.anchors.checkpointGuardId,
    );
    const liveNoise = s.distractions.find(
      (d) =>
        d.id === m.checkpoint.noiseId &&
        d.id === guard?.noiseId &&
        d.checkpointAttempt &&
        d.guardId === guard.id &&
        d.playerId === m.checkpoint.sourcePlayerId &&
        d.remaining > 0,
    );
    const valid =
      !!liveNoise &&
      ["Hacker", "Assassin"].includes(p.role) &&
      available(s, "checkpoint") &&
      m.checkpoint.windowRemaining > 0 &&
      guard?.mode === "investigate" &&
      !(guard.stunned > 0) &&
      dist(guard.x, guard.y, relay.x, relay.y) >=
        m.config.balance.checkpointClearance;
    prompt = valid
      ? "CHECKPOINT OPEN — Interact to release"
      : "DECOY REQUIRED — draw sentry to noise zone; Hacker/Assassin uses relay";
    if (valid)
      action = () => {
        if (
          finish(
            s,
            "checkpoint",
            p,
            "Checkpoint released — Decoy and teammate coordinated!",
            "checkpoint",
          )
        ) {
          m.checkpoint.cleared = true;
          const decoy = s.players.find(
            (q) => q.id === m.checkpoint.sourcePlayerId,
          );
          if (decoy) {
            decoy.stats.checkpoint = (decoy.stats.checkpoint || 0) + 1;
            const objective = m.objectives.find((o) => o.id === "checkpoint");
            objective.completedBy = decoy.id;
            objective.contributions.unshift({
              playerId: decoy.id,
              role: "Decoy",
              action: "noise_caused_sentry_movement",
            });
          }
          m.checkpoint.completedWith = decoy?.id;
        }
      };
  } else if (key) {
    prompt = `Collect team key ${key.id}`;
    action = () => {
      if (key.collected) return;
      key.collected = true;
      recordMissionEvent(
        s,
        p,
        `${key.id} secured — ${m.keys.filter((k) => k.collected).length}/2 team keys`,
        "keys",
      );
      const o = m.objectives.find((o) => o.id === "shared_keys");
      o.contributions.push({
        playerId: p.id,
        role: p.role,
        action: `collected_${key.id}`,
      });
      if (m.keys.every((k) => k.collected)) {
        const contributors = o.contributions;
        finish(s, "shared_keys", p, "Both team keys secured!", "keySets");
        o.contributions = contributors;
      }
    };
  } else if (!m.securityOff && near(s, p, m.terminal)) {
    const helper = s.players.find(
      (q) =>
        q.id !== p.id &&
        q.role !== "Hacker" &&
        !q.downed &&
        near(s, q, m.support, 44),
    );
    const valid =
      p.role === "Hacker" &&
      available(s, "security") &&
      requiredMissionsComplete(s) &&
      helper;
    prompt = valid
      ? "Disable security"
      : !available(s, "security")
        ? "Complete role objectives first"
        : p.role !== "Hacker"
          ? "HACKER REQUIRED at terminal"
          : "TEAMMATE: stand on SUPPORT PAD while Hacker presses INTERACT here";
    if (valid)
      action = () => {
        m.securityOff = true;
        finish(
          s,
          "security",
          p,
          "Hacker disabled security — teammate support confirmed!",
          "security",
        );
        m.objectives
          .find((o) => o.id === "security")
          .contributions.push({
            playerId: helper.id,
            role: helper.role,
            action: "held_support_pad",
          });
      };
  } else if (!s.vaultUnlocked && near(s, p, m.lock)) {
    prompt = m.securityOff ? "Unlock vault" : "Disable security first";
    if (m.securityOff && available(s, "vault") && requiredMissionsComplete(s))
      action = () => {
        s.vaultUnlocked = true;
        finish(s, "vault", p, "Vault unlocked!", "vault");
        s.doors.find((d) => d.id === "door_vault").open = true;
      };
  } else if (
    s.vaultUnlocked &&
    (available(s, "artifact") || complete(s, "artifact")) &&
    !s.artifacts[0].pickedUp &&
    near(s, p, s.artifacts[0], 38)
  ) {
    prompt = "Collect Diamond";
    action = () => {
      s.artifacts[0].pickedUp = true;
      finish(
        s,
        "artifact",
        p,
        "Diamond recovered — every operative to extraction!",
        "artifact",
      );
      p.holding = { ...s.artifacts[0] };
    };
  } else if (p.atVan && p.holding) {
    prompt = "Secure artifact";
    action = () => {
      s.loot.push(p.holding);
      p.holding = null;
    };
  }
  if (prompt) p.nearPrompt = { text: "[E] " + prompt, warn: !action };
  if (input.interact && (p.missionCooldown || 0) <= 0 && action) {
    action();
    p.missionCooldown = 0.4;
  }
  p.missionCooldown = Math.max(0, (p.missionCooldown || 0) - dt);
  m.message = missionStage(s);
}

function recordMissionEvent(s, p, text, stat) {
  if (p.stats) p.stats[stat] = (p.stats[stat] || 0) + 1;
  s.events ||= [];
  s.events.push({
    id: ++s.eventSequence,
    text,
    by: p.nickname || `P${p.id}`,
    at: s.elapsedTime,
  });
  s.events = s.events.slice(-8);
}
export function updateMissionWorld(s, dt) {
  if (!s.mission) return;
  s.distractions = (s.distractions || [])
    .map((d) => ({ ...d, remaining: d.remaining - dt }))
    .filter((d) => d.remaining > 0);
}
export function objectiveSummary(s) {
  if (!s?.mission?.config) return [];
  return s.mission.objectives.map((o) => ({
    ...o,
    status:
      o.status === "complete"
        ? "complete"
        : o.status === "locked"
          ? "blocked"
          : "active",
    phase: o.status,
    label:
      o.id === "shared_keys"
        ? `Team: collect both keys (${s.mission.keys.filter((k) => k.collected).length}/2)`
        : o.id === "extract"
          ? `Team: extract together · ${s.players.filter((p) => p.atVan && !p.downed).length}/${s.players.length} at van`
          : o.id === "checkpoint" && s.mission.checkpoint.windowRemaining > 0
            ? `CHECKPOINT OPEN ${Math.ceil(s.mission.checkpoint.windowRemaining)}s · Hacker/Assassin: interact`
            : o.label,
  }));
}

// Called after actual guard AI and movement, never from a client event.
export function observeMissionEvents(s, dt) {
  if (!s.mission?.config) return;
  const m = s.mission,
    c = m.checkpoint;
  if (c && !complete(s, "checkpoint")) {
    c.windowRemaining = Math.max(0, c.windowRemaining - dt);
    const guard = s.guards.find(
      (g) => g.id === m.config.anchors.checkpointGuardId,
    );
    const noise = (s.distractions || []).find(
      (d) =>
        d.id === guard?.noiseId &&
        d.checkpointAttempt &&
        d.guardId === guard.id &&
        s.players.some((p) => p.id === d.playerId && p.role === "Decoy"),
    );
    if (
      guard?.mode === "investigate" &&
      !(guard.stunned > 0) &&
      noise?.guardOrigin &&
      Array.isArray(guard.path) &&
      guard.path.length > 1 &&
      available(s, "checkpoint")
    ) {
      const moved = dist(
        guard.x,
        guard.y,
        noise.guardOrigin.x,
        noise.guardOrigin.y,
      );
      c.observedMovement = Math.max(c.observedMovement, moved);
      if (
        moved >= 28 &&
        dist(
          guard.x,
          guard.y,
          m.config.anchors.checkpoint.x,
          m.config.anchors.checkpoint.y,
        ) >= m.config.balance.checkpointClearance &&
        c.noiseId !== noise.id
      ) {
        c.noiseId = noise.id;
        c.sourcePlayerId = noise.playerId;
        c.windowRemaining = m.config.balance.checkpointWindow;
        recordMissionEvent(
          s,
          s.players.find((p) => p.id === noise.playerId),
          "Decoy lured the sentry — teammate: release checkpoint now!",
          "lures",
        );
      }
    }
    if (guard?.mode !== "investigate" || guard?.stunned > 0 || !noise)
      c.windowRemaining = 0;
  }
  if (
    available(s, "extract") &&
    requiredMissionsComplete(s) &&
    m.securityOff &&
    s.vaultUnlocked &&
    s.players.every((p) => p.atVan && !p.downed) &&
    (s.loot.some((a) => a.id === "art_crown") ||
      s.players.some((p) => p.holding?.id === "art_crown"))
  ) {
    finish(s, "extract", s.players[0], "Whole team extracted!", "extractions");
    m.objectives.find((o) => o.id === "extract").contributions = s.players.map(
      (p) => ({
        playerId: p.id,
        role: p.role,
        action: "reached_extraction_alive",
      }),
    );
  }
  refreshObjectives(s);
}
