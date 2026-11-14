import { createGameState } from "./gameState.js";
import { dist, lineBlockedByRects } from "./collision.js";
export const ROLES = ["Assassin", "Hacker", "Scout", "Decoy"];
export const COOLDOWNS = { Assassin: 12, Hacker: 16, Scout: 18, Decoy: 16 };
export function createShadowState(roster) {
  const s = createGameState(roster.length);
  s.screen = "playing";
  s.tutorialTimer = 0;
  s.players.forEach((p, i) => {
    p.id = roster[i].id;
    p.nickname = roster[i].nickname || `Operative ${p.id}`;
    p.stats = { keys:0, security:0, vault:0, artifact:0, revives:0, takedowns:0, overrides:0, scans:0, distractions:0 };
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
    keys: [
      { id: "ALPHA", x: 320, y: 224, collected: false },
      { id: "BRAVO", x: 960, y: 200, collected: false },
    ],
    terminal: { x: 1100, y: 1000 },
    support: { x: 1200, y: 1000 },
    lock: { x: 1020, y: 510 },
    securityOff: false,
    message: "Collect ALPHA and BRAVO access keys",
  };
  return s;
}
function near(s, p, target, range = 52) {
  return (
    dist(p.x, p.y, target.x, target.y) <= range &&
    !lineBlockedByRects(p.x, p.y, target.x, target.y, s.walls)
  );
}
export function missionStage(s) {
  const m = s.mission;
  if (!m.keys.every((k) => k.collected)) return "Collect two access keys";
  if (!m.securityOff) return "Hacker: terminal + teammate: support pad";
  if (!s.vaultUnlocked) return "Unlock vault at entrance";
  if (!s.artifacts[0].pickedUp && !s.loot.length)
    return "Collect the Crown Jewel";
  return "Entire team: return to extraction van";
}
export function updateMissionPlayer(s, p, input, dt) {
  p.abilityCooldown = Math.max(0, (p.abilityCooldown || 0) - dt);
  p.scanTime = Math.max(0, (p.scanTime || 0) - dt);
  if (p.downed) return;
  const m = s.mission;
  p.nearPrompt = null;
  if (input.ability && p.abilityCooldown <= 0) {
    let used = false;
    if (p.role === "Assassin") {
      const g = s.guards.find((g) => near(s, p, g, 62) && !(g.stunned > 0));
      if (g) {
        g.stunned = 5;
        if (p.stats) p.stats.takedowns++;
        used = true;
      }
    }
    if (p.role === "Hacker") {
      const c = s.cameras.find((c) => near(s, p, c, 100) && !(c.disabled > 0));
      if (c) {
        c.disabled = 10;
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
        used = true;
      }
    }
    if (p.role === "Scout") {
      p.scanTime = 6;
      if (p.stats) p.stats.scans++;
      used = true;
    }
    if (p.role === "Decoy") {
      s.distractions ||= [];
      s.distractions.push({id:++s.eventSequence,x:p.x,y:p.y,remaining:5,playerId:p.id});
      if (p.stats) p.stats.distractions++;
      used=true;
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
  if (key) {
    prompt = "Collect key " + key.id;
    action = () => {
      key.collected = true;
      recordMissionEvent(s,p,`${key.id} key secured`,"keys");
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
      p.role === "Hacker" && m.keys.every((k) => k.collected) && helper;
    prompt = valid
      ? "Disable security"
      : "Need two keys, Hacker + different role on support pad";
    if (valid)
      action = () => {
        m.securityOff = true;
        recordMissionEvent(s,p,"Security disabled — cameras and lasers offline","security");
      };
  } else if (!s.vaultUnlocked && near(s, p, m.lock)) {
    prompt = m.securityOff ? "Unlock vault" : "Disable security first";
    if (m.securityOff)
      action = () => {
        s.vaultUnlocked = true;
        recordMissionEvent(s,p,"Vault unlocked","vault");
        s.doors.find((d) => d.id === "door_vault").open = true;
      };
  } else if (
    s.vaultUnlocked &&
    !s.artifacts[0].pickedUp &&
    near(s, p, s.artifacts[0], 38)
  ) {
    prompt = "Collect Crown Jewel";
    action = () => {
      s.artifacts[0].pickedUp = true;
      recordMissionEvent(s,p,"Crown Jewel recovered — team to extraction","artifact");
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

function recordMissionEvent(s,p,text,stat) {
  if(p.stats) p.stats[stat]++;
  s.events ||= [];
  s.events.push({id:++s.eventSequence,text,by:p.nickname || `P${p.id}`,at:s.timer});
  s.events=s.events.slice(-8);
}
export function updateMissionWorld(s,dt) {
  if(!s.mission)return;
  s.distractions=(s.distractions || []).map(d=>({...d,remaining:d.remaining-dt})).filter(d=>d.remaining>0);
}
export function objectiveSummary(s) {
  if(!s?.mission) return [];
  const m=s.mission, keys=m.keys.every(k=>k.collected);
  const support=s.players.find(p=>!p.downed && p.role!=='Hacker' && near(s,p,m.support,44));
  const artifact=s.players.some(p=>p.holding?.id==='art_crown') || s.loot.some(a=>a.id==='art_crown');
  return [
    ...m.keys.map(k=>({id:k.id,label:`${k.id} access key`,status:k.collected?'complete':'active'})),
    {id:'security',label:m.securityOff?'Security offline':support?`${support.nickname || 'Teammate'} on support — Hacker needed`:'Hacker + different role on support pad',status:m.securityOff?'complete':keys?'active':'blocked'},
    {id:'vault',label:'Unlock vault',status:s.vaultUnlocked?'complete':m.securityOff?'active':'blocked'},
    {id:'artifact',label:'Recover Crown Jewel',status:artifact?'complete':s.vaultUnlocked?'active':'blocked'},
    {id:'extract',label:`Extract together · ${s.players.filter(p=>p.atVan&&!p.downed).length}/${s.players.length} at van`,status:artifact && s.players.every(p=>p.atVan&&!p.downed)?'complete':artifact?'active':'blocked'},
  ];
}
