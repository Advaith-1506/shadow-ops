import { useEffect, useRef } from "react";
import { getLanInput, initInput } from "@/lib/game/input";
import { updateGame } from "@/lib/game/gameLoop";
import { renderGame } from "@/lib/game/renderer";
import { renderHUD } from "@/lib/game/hud";
import { updateCameraForState } from "@/lib/game/cameraController";
import { sanitizeInputPayload } from "@/lib/game/networkClient";

const FIXED_DT = 1 / 30;

export function useGameRuntime({
  canvasRef,
  containerRef,
  screenRef,
  setScreen,
  setJoinCode,
  cleanupNetwork,
  stateRef,
  endStateRef,
  networkRef,
  cameraRef,
  viewRef,
  finalizeIfEnded,
  isTouchDevice,
}) {
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const accRef = useRef(0);
  const inputReady = useRef(false);
  const sizeRef = useRef({ cssW: 0, cssH: 0, dpr: 1 });

  useEffect(() => {
    if (!inputReady.current) {
      initInput();
      inputReady.current = true;
    }
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      setJoinCode(room.toUpperCase());
      setScreen("lobby");
      screenRef.current = "lobby";
    }
    return () => cleanupNetwork();
  }, [cleanupNetwork, screenRef, setJoinCode, setScreen]);

  useEffect(() => {
    // Backing store = CSS size × devicePixelRatio, so the canvas never
    // overflows its container or stretches; layout math stays in CSS px.
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.round(rect.width);
      const cssH = Math.round(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      sizeRef.current = { cssW, cssH, dpr };
      if (!cssW || !cssH) return;
      const bw = Math.round(cssW * dpr);
      const bh = Math.round(cssH * dpr);
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
    };
    resize();
    window.addEventListener("resize", resize);
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (observer && canvasRef.current) observer.observe(canvasRef.current);
    // DPR changes (browser zoom, moving between monitors) don't resize the element.
    let dprQuery = null;
    const onDprChange = () => {
      resize();
      watchDpr();
    };
    const watchDpr = () => {
      dprQuery?.removeEventListener?.("change", onDprChange);
      dprQuery = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      dprQuery.addEventListener?.("change", onDprChange);
    };
    watchDpr();
    return () => {
      window.removeEventListener("resize", resize);
      observer?.disconnect();
      dprQuery?.removeEventListener?.("change", onDprChange);
    };
  }, [canvasRef, containerRef]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Escape" || networkRef.current.mode === "server") return;
      if (screenRef.current === "playing") {
        setScreen("paused");
        screenRef.current = "paused";
      } else if (screenRef.current === "paused") {
        lastTimeRef.current = null;
        setScreen("playing");
        screenRef.current = "playing";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screenRef, setScreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      const state = stateRef.current;
      if (!state) return;

      if (screenRef.current === "playing") {
        if (!lastTimeRef.current) lastTimeRef.current = ts;
        const frameDt = Math.min((ts - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = ts;
        accRef.current += frameDt;

        const net = networkRef.current;
        while (accRef.current >= FIXED_DT) {
          if (net.mode === "server") {
            net.session?.send("client_input", {
              input: sanitizeInputPayload(getLanInput()),
            });
            if (net.snapshot) {
              Object.assign(state, net.snapshot);
              net.snapshot = null;
            }
          } else {
            updateGame(state, FIXED_DT);
          }

          accRef.current -= FIXED_DT;
          if (state.screen === "win" || state.screen === "loss") {
            finalizeIfEnded(state, endStateRef);
            break;
          }
        }
      }

      const { cssW, cssH, dpr } = sizeRef.current;
      if (!cssW || !cssH) return;
      // Same fixed whole-level framing for local and LAN play.
      updateCameraForState(state, canvas, cameraRef, viewRef, {
        cssW,
        cssH,
        dpr,
        touch: isTouchDevice,
      });
      const view = viewRef.current;
      renderGame(ctx, state, ts / 1000, cameraRef.current, view.zoom, view);
      const net = networkRef.current;
      renderHUD(ctx, state, {
        layout: view.layout,
        dpr,
        net: { paused: net.paused, mode: net.mode, myPlayerId: net.myPlayerId },
      });
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [
    canvasRef,
    cameraRef,
    endStateRef,
    finalizeIfEnded,
    networkRef,
    screenRef,
    stateRef,
    viewRef,
    isTouchDevice,
  ]);

  return {
    resetFrameClock: () => {
      lastTimeRef.current = null;
      accRef.current = 0;
    },
  };
}
