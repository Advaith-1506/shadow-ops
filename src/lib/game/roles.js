export const ROLE_INFO = {
  Assassin: {
    color: "#ffa78b",
    ability: "Silent Takedown",
    strength: "Stealth combat",
    description:
      "Stun a close guard for 10 seconds (captain: 20s). Neutralize the captain within 62px and clear sight. Team keys are separate.",
    cooldown: 12,
  },
  Hacker: {
    color: "#65d7ff",
    ability: "System Override",
    strength: "Security control",
    description:
      "Unlock the Garage electronic door and override the Living Room camera network. Both actions are mandatory; then operate the team terminal.",
    cooldown: 16,
  },
  Scout: {
    color: "#7ff0b6",
    ability: "Recon Pulse",
    strength: "Team reconnaissance",
    description:
      "Pulse from the Garage recon zone to discover the hidden node. Also reveal nearby threats for 6 seconds.",
    cooldown: 18,
  },
  Decoy: {
    color: "#d1a2ff",
    ability: "Noise Maker",
    strength: "Guard distraction",
    description:
      "Place noise at your position. At the marked zone, lure the sentry so Hacker/Assassin can release the checkpoint. Chases take priority.",
    cooldown: 16,
  },
};
