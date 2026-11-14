import { useEffect, useRef } from "react";
import { initInput, clearKeys, clearTouchInput } from "@/lib/game/input";
import { updateGame } from "@/lib/game/gameLoop";
import { renderGame } from "@/lib/game/renderer";
import { renderHUD } from "@/lib/game/hud";
import { updateCameraForState } from "@/lib/game/cameraController";

const DT = 1 / 30;

export function useGameRuntime({
  canvasRef,
  containerRef,
  screenRef,
  setScreen,
  stateRef,
  networkRef,
  cameraRef,
  viewRef,
  finalizeIfEnded,
  viewMode,
  isTouchDevice = false,
}) {
  const last = useRef(null);
  const acc = useRef(0);
  const sizeRef = useRef({ cssW: 0, cssH: 0, dpr: 1 });

  useEffect(() => {
    initInput();
    return () => {
      clearKeys();
      clearTouchInput();
    };
  }, []);

  useEffect(() => {
    const key = (e) => {
      if (e.code !== "Escape" || networkRef.current.mode === "server") return;
      if (screenRef.current === "playing") {
        setScreen("paused");
        screenRef.current = "paused";
        clearKeys();
        clearTouchInput();
      } else if (screenRef.current === "paused") {
        last.current = null;
        setScreen("playing");
        screenRef.current = "playing";
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [networkRef, screenRef, setScreen]);

  useEffect(() => {
    // Backing store = CSS size × devicePixelRatio so layout math stays in CSS px.
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const shell = containerRef.current;
      const cssW = Math.max(
        320,
        Math.round(shell?.clientWidth || window.innerWidth),
      );
      const cssH = Math.max(280, Math.round(window.innerHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      sizeRef.current = { cssW, cssH, dpr };
      const bw = Math.round(cssW * dpr);
      const bh = Math.round(cssH * dpr);
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    const observer =
      typeof ResizeObserver !== "undefined" && containerRef.current
        ? new ResizeObserver(resize)
        : null;
    if (observer && containerRef.current) observer.observe(containerRef.current);
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
  }, [canvasRef, containerRef, viewMode]);

  useEffect(() => {
    if (viewMode === "controller") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    let raf;
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const state = stateRef.current;
      if (!state || !["playing", "paused"].includes(screenRef.current)) return;
      const net = networkRef.current;
      if (net.mode === "server") {
        if (net.snapshot) {
          Object.assign(state, net.snapshot);
          net.snapshot = null;
        }
      } else if (screenRef.current === "playing") {
        if (!last.current) last.current = ts;
        acc.current += Math.min((ts - last.current) / 1000, 0.1);
        last.current = ts;
        while (acc.current >= DT) {
          updateGame(state, DT);
          acc.current -= DT;
          if (["win", "loss"].includes(state.screen)) {
            finalizeIfEnded(state);
            break;
          }
        }
      }

      const { cssW, cssH, dpr } = sizeRef.current;
      if (!cssW || !cssH) return;
      // Always fit the whole Maple Row Safehouse — never follow a single player.
      updateCameraForState(state, canvas, cameraRef, viewRef, {
        cssW,
        cssH,
        dpr,
        touch: isTouchDevice,
      });
      const view = viewRef.current;
      renderGame(ctx, state, ts / 1000, cameraRef.current, view.zoom, view);
      renderHUD(ctx, state, {
        layout: view.layout,
        dpr,
        net: {
          paused: net.paused,
          mode: net.mode,
          myPlayerId: net.myPlayerId,
        },
      });
      if (net.paused) {
        ctx.fillStyle = "rgba(0,0,0,.85)";
        ctx.fillRect(0, 120 * dpr, canvas.width, 55 * dpr);
        ctx.fillStyle = "#7fffc0";
        ctx.font = `${16 * dpr}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(
          "Connection interrupted · mission paused · reconnecting",
          canvas.width / 2,
          151 * dpr,
        );
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    canvasRef,
    cameraRef,
    finalizeIfEnded,
    isTouchDevice,
    networkRef,
    screenRef,
    stateRef,
    viewRef,
    viewMode,
  ]);

  return {
    resetFrameClock: () => {
      last.current = null;
      acc.current = 0;
    },
  };
}
