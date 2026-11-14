export const ROLE_INFO = {
  Assassin: {
    color: "#ffa78b",
    ability: "Silent Takedown",
    strength: "Stealth combat",
    description:
      "Stun a close guard for 5 seconds. Stay within 62px and in clear sight.",
    cooldown: 12,
  },
  Hacker: {
    color: "#65d7ff",
    ability: "System Override",
    strength: "Security control",
    description:
      "Suppress a nearby camera for 10 seconds or unlock a side door. Operate the main terminal.",
    cooldown: 16,
  },
  Scout: {
    color: "#7ff0b6",
    ability: "Recon Pulse",
    strength: "Team reconnaissance",
    description:
      "Reveal guards and security hazards within 360px for 6 seconds.",
    cooldown: 18,
  },
  Decoy: {
    color: "#d1a2ff",
    ability: "Noise Maker",
    strength: "Guard distraction",
    description:
      "Place a 5-second noise at your position. Guards within 260px investigate unless chasing.",
    cooldown: 16,
  },
};
