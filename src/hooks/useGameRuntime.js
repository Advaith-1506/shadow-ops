import { useEffect, useRef } from 'react';
import { getLanInput, initInput } from '@/lib/game/input';
import { updateGame } from '@/lib/game/gameLoop';
import { renderGame } from '@/lib/game/renderer';
import { renderHUD } from '@/lib/game/hud';
import { updateCameraForState } from '@/lib/game/cameraController';
import { sanitizeInputPayload } from '@/lib/game/networkClient';

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

  useEffect(() => {
    if (!inputReady.current) {
      initInput();
      inputReady.current = true;
    }
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setJoinCode(room.toUpperCase());
      setScreen('lobby');
      screenRef.current = 'lobby';
    }
    return () => cleanupNetwork();
  }, [cleanupNetwork, screenRef, setJoinCode, setScreen]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const host = containerRef.current;
      if (!canvas || !host) return;
      const w = Math.max(640, host.clientWidth - 8);
      const h = Math.max(420, window.innerHeight - 86);
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [canvasRef, containerRef]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Escape') return;
      if (screenRef.current === 'playing') {
        setScreen('paused');
        screenRef.current = 'paused';
      } else if (screenRef.current === 'paused') {
        lastTimeRef.current = null;
        setScreen('playing');
        screenRef.current = 'playing';
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screenRef, setScreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      const state = stateRef.current;
      if (!state) return;

      if (screenRef.current === 'playing') {
        if (!lastTimeRef.current) lastTimeRef.current = ts;
        const frameDt = Math.min((ts - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = ts;
        accRef.current += frameDt;

        const net = networkRef.current;
        while (accRef.current >= FIXED_DT) {
          if (net.mode === 'host') {
            const inputs = {};
            for (const p of state.players) {
              const pid = p.id;
              inputs[pid] = pid === net.myPlayerId
                ? sanitizeInputPayload(getLanInput())
                : sanitizeInputPayload(net.remoteInputs[pid] || { up: false, down: false, left: false, right: false, interact: false });
            }
            updateGame(state, FIXED_DT, inputs);
            net.session?.send('frame_inputs', { frame: net.frame, inputs });
            net.frame += 1;
          } else if (net.mode === 'client') {
            const payload = net.queuedFrames.get(net.nextClientFrame);
            if (!payload) break;
            updateGame(state, FIXED_DT, payload.inputs);
            net.queuedFrames.delete(net.nextClientFrame);
            net.nextClientFrame += 1;
            net.session?.send('client_input', { input: sanitizeInputPayload(getLanInput()) });
          } else {
            updateGame(state, FIXED_DT);
          }

          accRef.current -= FIXED_DT;
          if (state.screen === 'win' || state.screen === 'loss') {
            finalizeIfEnded(state, endStateRef);
            break;
          }
        }
      }

      updateCameraForState(state, canvas, cameraRef, viewRef);
      renderGame(ctx, state, ts / 1000, cameraRef.current, viewRef.current.zoom, { w: viewRef.current.w, h: viewRef.current.h });
      renderHUD(ctx, state);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef, cameraRef, endStateRef, finalizeIfEnded, networkRef, screenRef, stateRef, viewRef, isTouchDevice]);

  return {
    resetFrameClock: () => {
      lastTimeRef.current = null;
      accRef.current = 0;
    },
  };
}
