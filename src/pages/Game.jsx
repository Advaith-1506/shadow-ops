import React, { useCallback, useRef, useState, useEffect } from "react";
import { createShadowState } from "@/lib/game/mission";
import { clearKeys, clearTouchInput, setTouchInput } from "@/lib/game/input";
import { CANVAS_H, CANVAS_W } from "@/lib/game/constants";
import { parseJoinLocation } from "@/lib/party/invitations";
import MenuScreen from "@/components/game/MenuScreen";
import LobbyScreen from "@/components/game/LobbyScreen";
import InstructionsScreen from "@/components/game/InstructionsScreen";
import PauseOverlay from "@/components/game/PauseOverlay";
import ResultScreen from "@/components/game/ResultScreen";
import TouchControls from "@/components/game/TouchControls";
import ControllerScreen from "@/components/game/ControllerScreen";
import MissionOverlay from "@/components/game/MissionOverlay";
import { useLanMultiplayer } from "@/hooks/useLanMultiplayer";
import { useGameRuntime } from "@/hooks/useGameRuntime";

export default function Game() {
  const [localPlayers, setLocalPlayers] = useState(4);
  const initial = useRef(parseJoinLocation(window.location));
  const [screen, setScreen] = useState(initial.current.kind ? "lobby" : "menu");
  const [entry, setEntry] = useState("join");
  const [isTouch, setIsTouch] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  const [isPortraitSmall, setIsPortraitSmall] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const viewRef = useRef({ zoom: 1, w: CANVAS_W, h: CANVAS_H });
  const stateRef = useRef(null);
  const endStateRef = useRef(null);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const transition = useCallback((next) => {
    setScreen(next);
    screenRef.current = next;
  }, []);

  const finalizeIfEnded = useCallback(
    (state) => {
      if (!["win", "loss"].includes(state.screen)) return;
      endStateRef.current = state;
      transition(state.screen);
    },
    [transition],
  );

  const net = useLanMultiplayer({
    onGameStart: (state) => {
      stateRef.current = state;
      clearKeys();
      clearTouchInput();
      if (["win", "loss"].includes(state.screen)) finalizeIfEnded(state);
      else transition("playing");
    },
    onLobby: () => transition("lobby"),
    onEnd: finalizeIfEnded,
  });

  const viewMode =
    net.kind === "player" ? net.viewMode : net.kind ? "display" : "game";

  const { resetFrameClock } = useGameRuntime({
    canvasRef,
    containerRef,
    screenRef,
    setScreen,
    stateRef,
    networkRef: net.networkRef,
    cameraRef,
    viewRef,
    finalizeIfEnded,
    viewMode,
    isTouchDevice: isTouch,
  });

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => {
      setIsTouch(mq.matches || window.innerWidth < 900);
      setIsPortraitSmall(
        window.innerHeight > window.innerWidth && window.innerWidth < 900,
      );
    };
    apply();
    mq.addEventListener?.("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener?.("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    if (screen !== "playing") {
      clearKeys();
      clearTouchInput();
    }
  }, [screen]);

  const startLocal = () => {
    net.cleanupNetwork();
    net.resetLobbyUi();
    stateRef.current = createShadowState(
      [
        { id: 1, nickname: "Local Hacker", role: "Hacker" },
        { id: 2, nickname: "Local Assassin", role: "Assassin" },
        { id: 3, nickname: "Local Scout", role: "Scout" },
        { id: 4, nickname: "Local Decoy", role: "Decoy" },
      ].slice(0, localPlayers),
    );
    resetFrameClock();
    transition("playing");
  };

  const leave = () => {
    net.cleanupNetwork();
    net.resetLobbyUi();
    stateRef.current = null;
    endStateRef.current = null;
    resetFrameClock();
    transition("menu");
    if (window.location.protocol.startsWith("http"))
      window.history.replaceState(null, "", "/");
  };

  const isHost =
    net.kind === "host" ||
    (net.kind === "player" && net.myPlayerId === net.hostId);
  const current = net.liveState || stateRef.current;
  const showRotateHint =
    isPortraitSmall && !rotateDismissed && screen === "playing";

  return (
    <div ref={containerRef} className="game-root">
      {screen === "menu" && (
        <MenuScreen
          localPlayers={localPlayers}
          setLocalPlayers={setLocalPlayers}
          onStart={startLocal}
          onInstructions={() => transition("instructions")}
          onHost={() => {
            setEntry("host");
            transition("lobby");
          }}
          onJoin={() => {
            setEntry("join");
            transition("lobby");
          }}
        />
      )}
      {screen === "lobby" && (
        <LobbyScreen net={net} entry={entry} onBack={leave} />
      )}
      {screen === "instructions" && <InstructionsScreen onBack={leave} />}
      {["win", "loss"].includes(screen) && endStateRef.current && (
        <ResultScreen
          state={endStateRef.current}
          onRestart={
            net.kind
              ? () => {
                  if (isHost) net.sendLobby("lobby_reset");
                }
              : startLocal
          }
          onMenu={leave}
          networked={!!net.kind}
          isHost={isHost}
        />
      )}
      {screen === "playing" && viewMode === "controller" && (
        <ControllerScreen net={net} onInput={setTouchInput} onLeave={leave} />
      )}
      <div
        className="game-canvas-shell"
        style={{
          display:
            ["playing", "paused"].includes(screen) && viewMode !== "controller"
              ? "block"
              : "none",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          aria-label={
            viewMode === "display"
              ? "Shared mission display"
              : "Shadow Ops game world"
          }
        />
        {net.kind && net.netError && (
          <p role="alert" className="network-game-error">
            {net.netError}
          </p>
        )}
        <MissionOverlay state={current} shared={viewMode === "display"} />
        {showRotateHint && (
          <button
            type="button"
            className="rotate-hint"
            onClick={() => setRotateDismissed(true)}
          >
            Rotate for a wider view · Dismiss
          </button>
        )}
        <nav className="game-toolbar">
          {net.kind === "player" && (
            <button onClick={() => net.changeViewMode("controller")}>
              PHONE CONTROLLER
            </button>
          )}
          <button onClick={leave}>
            {net.kind === "host" ? "CLOSE ROOM" : "LEAVE"}
          </button>
        </nav>
        {screen === "paused" && (
          <div className="pause-shell">
            <PauseOverlay
              onResume={() => {
                resetFrameClock();
                transition("playing");
              }}
              onQuit={leave}
            />
          </div>
        )}
        {isTouch && screen === "playing" && viewMode === "game" && (
          <TouchControls
            compact
            player={current?.players.find(
              (p) => p.id === (net.myPlayerId || 1),
            )}
            onChange={setTouchInput}
            enabled={!net.networkRef.current.paused}
          />
        )}
      </div>
    </div>
  );
}
