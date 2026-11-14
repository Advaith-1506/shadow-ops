const DEFAULT_PORT = 8787;

function normalizeInput(input) {
  return {
    up: !!input?.up,
    down: !!input?.down,
    left: !!input?.left,
    right: !!input?.right,
    interact: !!input?.interact,
    ...(input?.ability !== undefined ? { ability: !!input.ability } : {}),
  };
}

export function makeWsUrl(rawUrl) {
  const trimmed = (rawUrl || "").trim();
  if (trimmed) {
    if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) return trimmed;
    if (trimmed.startsWith("http://")) return trimmed.replace("http://", "ws://");
    if (trimmed.startsWith("https://")) return trimmed.replace("https://", "wss://");
    return `ws://${trimmed}`;
  }
  const host = window.location.hostname || "localhost";
  return `ws://${host}:${DEFAULT_PORT}`;
}

export function createNetworkSession(url, handlers) {
  let ws;
  try { ws = new WebSocket(url); }
  catch { handlers?.onError?.('Invalid server address. Use ws://HOST:8787.'); return { send() {}, close() {} }; }

  ws.onopen = () => handlers?.onOpen?.();
  ws.onclose = () => handlers?.onClose?.();
  ws.onerror = () => handlers?.onError?.("Network socket error.");
  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      handlers?.onMessage?.(msg);
    } catch {
      handlers?.onError?.("Invalid network payload received.");
    }
  };

  return {
    send(type, payload = {}) {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type, ...payload }));
    },
    close() {
      try { ws.close(); } catch {}
    },
  };
}

export function sanitizeFramePayload(payload) {
  const out = {};
  const inputs = payload?.inputs || {};
  for (const [id, input] of Object.entries(inputs)) out[id] = normalizeInput(input);
  return { frame: Number(payload?.frame || 0), inputs: out };
}

export function sanitizeInputPayload(payload) {
  return normalizeInput(payload);
}
