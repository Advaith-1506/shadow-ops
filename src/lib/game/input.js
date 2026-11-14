/*
 * INPUT  –  Museum Break
 * Singleton keyboard state.  Call initInput() once on app mount.
 * Prevents scrolling with Arrow keys and Space during gameplay.
 */

const GAME_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyE",
  "KeyQ",
  "Numpad8",
  "Numpad4",
  "Numpad5",
  "Numpad6",
  "Numpad0",
  "NumpadEnter",
  "KeyT",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyR",
  "KeyI",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyO",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "Enter",
]);

const held = {}; // code → boolean
let networkInputs = null; // { p1: {...}, p2: {...} } when driven by netcode
let touchInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
};

let _initialized = false;

export function initInput() {
  if (_initialized) return;
  _initialized = true;

  window.addEventListener("keydown", (e) => {
    held[e.code] = true;
    const t = e.target;
    const isTypingTarget =
      t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable);
    if (!isTypingTarget && GAME_KEYS.has(e.code)) e.preventDefault();
  });

  window.addEventListener("keyup", (e) => {
    held[e.code] = false;
  });

  // Release all keys when window loses focus
  window.addEventListener("blur", clearKeys);
}

export function clearKeys() {
  for (const k of Object.keys(held)) held[k] = false;
}

export function isDown(code) {
  return !!held[code];
}

export function setNetworkInputs(snapshot) {
  networkInputs = snapshot;
}

export function clearNetworkInputs() {
  networkInputs = null;
}

export function setTouchInput(next) {
  touchInput = {
    up: !!next?.up,
    down: !!next?.down,
    left: !!next?.left,
    right: !!next?.right,
    interact: !!next?.interact,
    ability: !!next?.ability,
  };
}

export function clearTouchInput() {
  touchInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
  };
}

// ─── Per-player input snapshots ───────────────────────────────────────────────
// Returns a frozen snapshot so we don't read half-updated keys mid-frame.

export function getP1Input() {
  if (networkInputs?.p1) return networkInputs.p1;
  return getLocalP1Input();
}

export function getP2Input() {
  if (networkInputs?.p2) return networkInputs.p2;
  return getLocalP2Input();
}

export function getLocalP1Input() {
  return {
    up: held["KeyW"] || touchInput.up,
    down: held["KeyS"] || touchInput.down,
    left: held["KeyA"] || touchInput.left,
    right: held["KeyD"] || touchInput.right,
    ability: held["KeyQ"] || touchInput.ability,
    interact:
      held["KeyE"] || held["Enter"] || held["Space"] || touchInput.interact,
  };
}

export function getLocalP2Input() {
  return {
    up: held["ArrowUp"],
    down: held["ArrowDown"],
    left: held["ArrowLeft"],
    right: held["ArrowRight"],
    ability: held["Slash"],
    interact: held["Enter"] || held["Space"],
  };
}

export function getLocalP3Input() {
  return {
    up: held["KeyT"],
    down: held["KeyG"],
    left: held["KeyF"],
    right: held["KeyH"],
    interact: held["KeyR"],
  };
}

export function getLocalP4Input() {
  return {
    up: held["KeyI"],
    down: held["KeyK"],
    left: held["KeyJ"],
    right: held["KeyL"],
    interact: held["KeyO"],
  };
}

function getKeyboardLanInput() {
  return {
    up: held["KeyW"] || held["ArrowUp"] || touchInput.up,
    down: held["KeyS"] || held["ArrowDown"] || touchInput.down,
    left: held["KeyA"] || held["ArrowLeft"] || touchInput.left,
    right: held["KeyD"] || held["ArrowRight"] || touchInput.right,
    ability: held["KeyQ"] || touchInput.ability,
    interact:
      held["KeyE"] || held["Enter"] || held["Space"] || touchInput.interact,
  };
}

// Providers return booleans only; webcam implementations need no renderer changes.
const providers = new Map();
export function registerInputProvider(name, provider) {
  providers.set(name, provider);
  return () => providers.delete(name);
}
export function getLanInput() {
  const out = getKeyboardLanInput();
  for (const provider of providers.values()) {
    const input = provider() || {};
    for (const k of ["up", "down", "left", "right", "interact", "ability"])
      out[k] = !!out[k] || input[k] === true;
  }
  return out;
}
