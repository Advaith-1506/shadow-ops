import { SAFEHOUSE } from './safehouse.js';
import { OFFICE } from './office.js';

/** All playable levels. House = easy, Office = medium. Bank (hard) not yet implemented. */
export const LEVELS = {
  [SAFEHOUSE.id]: SAFEHOUSE,
  [OFFICE.id]: OFFICE,
};

export const LEVEL_LIST = [SAFEHOUSE, OFFICE];

export const DEFAULT_LEVEL_ID = SAFEHOUSE.id;

let activeId = DEFAULT_LEVEL_ID;

export function getActiveLevel() {
  return LEVELS[activeId] || SAFEHOUSE;
}

export function getLevelById(id) {
  return LEVELS[id] || null;
}

/**
 * Select the active level template used by mapData / createShadowState.
 * Local play calls this before starting. LAN Party Mode still needs a
 * shared levelId on the lobby protocol (teammate coordination).
 */
export function setActiveLevel(id) {
  if (!LEVELS[id]) {
    throw new Error(`Unknown level id: ${id}`);
  }
  activeId = id;
  return LEVELS[id];
}

export function listLevels() {
  return LEVEL_LIST.map((l) => ({
    id: l.id,
    name: l.name,
    shortName: l.shortName || l.name,
    difficulty: l.difficulty || 'easy',
    campaignIndex: l.campaignIndex || 1,
    campaignTotal: l.campaignTotal || 3,
    label: `${l.campaignIndex || 1} · ${l.shortName || l.name} (${(l.difficulty || 'easy').toUpperCase()})`,
  }));
}

// Back-compat default export binding (house). Prefer getActiveLevel().
export const ACTIVE_LEVEL = SAFEHOUSE;
