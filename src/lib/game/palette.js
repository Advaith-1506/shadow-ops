// Shared presentation colours for world rendering and the HUD.
export const PLAYER_COLORS = {
  1: '#3fa9f5',
  2: '#ff8c42',
  3: '#45c96a',
  4: '#b57cf2',
};

export const ROLE_GLYPH = { Hacker: 'H', Assassin: 'A', Scout: 'S', fast: 'F', strong: 'S' };

export const OBJECTIVE_COLORS = {
  key: '#4be08a',
  terminal: '#58c6ff',
  support: '#b48cff',
  lock: '#f2c14e',
  diamond: '#bff3ff',
  extraction: '#ffffff',
  laser: '#ff3b4e',
};

export function playerColor(id) {
  return PLAYER_COLORS[id] || '#e0e0e0';
}

/** Current cooperative mission stage, derived from authoritative state. */
export function missionStageId(s) {
  const m = s?.mission;
  if (!m) return null;
  if (!m.keys.every((k) => k.collected)) return 'keys';
  if (!m.securityOff) return 'security';
  if (!s.vaultUnlocked) return 'vault';
  if (!s.artifacts?.[0]?.pickedUp && !s.loot?.length) return 'diamond';
  return 'extract';
}
