import { createNetworkSession, makeWsUrl, sanitizeFramePayload, sanitizeInputPayload } from "../../src/lib/game/networkClient";

describe("networkClient", () => {
  const originalWindow = global.window;
  const originalWebSocket = global.WebSocket;

  afterEach(() => {
    global.window = originalWindow;
    global.WebSocket = originalWebSocket;
  });

  it("builds default ws url from browser hostname", () => {
    global.window = { location: { hostname: "192.168.1.12" } };
    expect(makeWsUrl("")).toBe("ws://192.168.1.12:8787");
  });

  it("normalizes http/https to ws/wss", () => {
    expect(makeWsUrl("http://a:99")).toBe("ws://a:99");
    expect(makeWsUrl("https://a:99")).toBe("wss://a:99");
    expect(makeWsUrl("ws://a:99")).toBe("ws://a:99");
  });

  it("sanitizes input payload booleans", () => {
    expect(sanitizeInputPayload({ up: 1, down: 0, left: "x" })).toEqual({
      up: true,
      down: false,
      left: true,
      right: false,
      interact: false,
    });
  });

  it("sanitizes frame payload and coerces frame number", () => {
    const out = sanitizeFramePayload({
      frame: "12",
      inputs: { 1: { up: 1 }, 2: { interact: "yes" } },
    });
    expect(out.frame).toBe(12);
    expect(out.inputs["1"]).toEqual({ up: true, down: false, left: false, right: false, interact: false });
    expect(out.inputs["2"]).toEqual({ up: false, down: false, left: false, right: false, interact: true });
  });

  it("creates session and dispatches handlers", () => {
    const sent = [];
    class MockWs {
      static OPEN = 1;
      static instances = [];
      constructor(url) {
        this.url = url;
        this.readyState = MockWs.OPEN;
        MockWs.instances.push(this);
      }
      send(msg) { sent.push(msg); }
      close() { this.closed = true; }
    }
    global.WebSocket = MockWs;

    const handlers = {
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
    };
    const session = createNetworkSession("ws://x", handlers);
    const ws = MockWs.instances[0];
    expect(ws.url).toBe("ws://x");

    ws.onopen();
    expect(handlers.onOpen).toHaveBeenCalledTimes(1);

    session.send("ping", { n: 1 });
    expect(sent).toContain(JSON.stringify({ type: "ping", n: 1 }));

    ws.onmessage({ data: JSON.stringify({ type: "room_created", roomCode: "AB12CD" }) });
    expect(handlers.onMessage).toHaveBeenCalledWith({ type: "room_created", roomCode: "AB12CD" });

    ws.onmessage({ data: "not-json" });
    expect(handlers.onError).toHaveBeenCalledWith("Invalid network payload received.");

    ws.onerror();
    expect(handlers.onError).toHaveBeenCalledWith("Network socket error.");

    ws.onclose();
    expect(handlers.onClose).toHaveBeenCalledTimes(1);

    session.close();
    expect(ws.closed).toBe(true);
  });
});
