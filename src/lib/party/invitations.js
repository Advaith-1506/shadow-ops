export function validRoomCode(code) {
  return typeof code === "string" && /^[A-Z2-9]{6}$/.test(code);
}
export function normalizeLanHost(raw) {
  const value = String(raw || "").trim();
  if (!value || /[\s/@?#]/.test(value))
    throw Error("Enter the host Wi-Fi IPv4 address or hostname only.");
  const url = new URL(`http://${value}`);
  if (
    url.port ||
    !/^[a-z0-9.-]+$/i.test(url.hostname) ||
    url.hostname === "0.0.0.0"
  )
    throw Error("Use a reachable host address without a port.");
  return url.hostname;
}
export function createInviteUrl({
  host,
  roomCode,
  port = 5173,
  secure = false,
}) {
  if (!validRoomCode(roomCode)) throw Error("Invalid room code.");
  const hostname = normalizeLanHost(host);
  if (["localhost", "127.0.0.1"].includes(hostname))
    throw Error("Phones need the laptop’s Wi-Fi address, not localhost.");
  if (
    !Number.isInteger(Number(port)) ||
    Number(port) < 1 ||
    Number(port) > 65535
  )
    throw Error("Invalid website port.");
  return `${secure ? "https" : "http"}://${hostname}:${port}/join/${roomCode}`;
}
export function endpointFromLocation(location) {
  const hostname = location.hostname || "localhost";
  return `${location.protocol === "https:" ? "wss" : "ws"}://${hostname}:8787`;
}
export function parseJoinLocation(location) {
  const match = location.pathname.match(/^\/(join|display)\/([^/]+)\/?$/);
  const query = new URLSearchParams(location.search);
  const code = (match?.[2] || query.get("room") || "").toUpperCase();
  return {
    code,
    kind: match?.[1] || (code ? "join" : null),
    valid: !code || validRoomCode(code),
  };
}
