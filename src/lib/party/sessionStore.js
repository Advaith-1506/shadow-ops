const KEY = "shadow-ops-session-v2";
export function readSession(storage) {
  try {
    const s = JSON.parse(storage.getItem(KEY));
    if (
      !s ||
      !["player", "host", "display"].includes(s.kind) ||
      !/^[A-Z2-9]{6}$/.test(s.roomCode) ||
      !/^[a-f0-9]{64}$/.test(s.token) ||
      Date.now() - s.savedAt > 30 * 60 * 1000
    )
      return null;
    const u = new URL(s.url);
    if (!["ws:", "wss:"].includes(u.protocol)) return null;
    return s;
  } catch {
    return null;
  }
}
export function saveSession(storage, s) {
  try {
    storage.setItem(KEY, JSON.stringify({ ...s, savedAt: Date.now() }));
  } catch {
    /* Private mode/storage restrictions: live reconnect still works in memory. */
  }
}
export function forgetSession(storage) {
  try {
    storage.removeItem(KEY);
  } catch {
    /* No storage available. */
  }
}
