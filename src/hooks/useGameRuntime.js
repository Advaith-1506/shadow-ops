import { useEffect, useRef } from "react";
import { initInput, clearKeys, clearTouchInput } from "@/lib/game/input";
import { updateGame } from "@/lib/game/gameLoop";
import { renderGame } from "@/lib/game/renderer";
import { renderHUD } from "@/lib/game/hud";
import { updateCameraForState } from "@/lib/game/cameraController";
import { CANVAS_W, CANVAS_H } from "@/lib/game/constants";
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
  overview = false,
}) {
  const last = useRef(null),
    acc = useRef(0);
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
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.max(
        320,
        containerRef.current?.clientWidth || window.innerWidth,
      );
      canvas.height = Math.max(280, window.innerHeight);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [canvasRef, containerRef, viewMode]);
  useEffect(() => {
    if (viewMode === "controller") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
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
      if (viewMode === "display" || overview) {
        const zoom = Math.min(
          canvas.width / CANVAS_W,
          (canvas.height - 130) / CANVAS_H,
        );
        const w = canvas.width / zoom,
          h = canvas.height / zoom;
        cameraRef.current = { x: -(w - CANVAS_W) / 2, y: -130 / zoom };
        viewRef.current = { zoom, w, h };
      } else {
        const tracked =
          net.mode === "server"
            ? {
                ...state,
                players: state.players.filter((p) => p.id === net.myPlayerId),
              }
            : state;
        updateCameraForState(tracked, canvas, cameraRef, viewRef);
      }
      renderGame(
        ctx,
        state,
        ts / 1000,
        cameraRef.current,
        viewRef.current.zoom,
        { w: viewRef.current.w, h: viewRef.current.h },
      );
      renderHUD(ctx, state);
      if (net.paused) {
        ctx.fillStyle = "rgba(0,0,0,.85)";
        ctx.fillRect(0, 120, canvas.width, 55);
        ctx.fillStyle = "#7fffc0";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "Connection interrupted · mission paused · reconnecting",
          canvas.width / 2,
          151,
        );
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    canvasRef,
    cameraRef,
    finalizeIfEnded,
    networkRef,
    screenRef,
    stateRef,
    viewRef,
    viewMode,
    overview,
  ]);
  return {
    resetFrameClock: () => {
      last.current = null;
      acc.current = 0;
    },
  };
}
