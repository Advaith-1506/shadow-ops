import React, { useCallback, useRef, useState, useEffect } from "react";
import { createGameState } from "@/lib/game/gameState";
import { createShadowState } from "@/lib/game/mission";
import { clearKeys, clearTouchInput, setTouchInput } from "@/lib/game/input";

import MenuScreen from "@/components/game/MenuScreen";
import LobbyScreen from "@/components/game/LobbyScreen";
import InstructionsScreen from "@/components/game/InstructionsScreen";
import PauseOverlay from "@/components/game/PauseOverlay";
import ResultScreen from "@/components/game/ResultScreen";
import TouchControls from "@/components/game/TouchControls";

import { CANVAS_H, CANVAS_W } from "@/lib/game/constants";
import { LEAVE_BUTTON_W } from "@/lib/game/viewLayout";
import { useLanMultiplayer } from "@/hooks/useLanMultiplayer";
import { useGameRuntime } from "@/hooks/useGameRuntime";

export default function Game() {
  const [screen, setScreen] = useState("menu");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPortraitSmall, setIsPortraitSmall] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const viewRef = useRef({ zoom: 1, w: CANVAS_W, h: CANVAS_H });
  const stateRef = useRef(null);
  const endStateRef = useRef(null);
  const screenRef = useRef("menu");

  screenRef.current = screen;

  const finalizeIfEnded = useCallback((state, endRef = endStateRef) => {
    if (state.screen !== "win" && state.screen !== "loss") return;
    endRef.current = {
      screen: state.screen,
      lossReason: state.lossReason,
      timer: state.timer,
      alarm: state.alarm,
      loot: [...state.loot],
      score: state.score,
    };
    setScreen(state.screen);
    screenRef.current = state.screen;
  }, []);

  const onPeerLeftToMenu = useCallback(() => {
    setScreen("menu");
    screenRef.current = "menu";
  }, []);

  const {
    networkRef,
    joinCode,
    setJoinCode,
    netStatus,
    netError,
    roomCode,
    serverIp,
    inviteLink,
    lanMaxPlayers,
    setLanMaxPlayers,
    discoveredRooms,
    players,
    myPlayerId,
    hostId,
    sendLobby,
    wsUrl,
    setWsUrl,
    cleanupNetwork,
    resetLobbyUi,
    hostLanGame,
    discoverLanGames,
    joinLanGame,
  } = useLanMultiplayer({
    screenRef,
    startNetworkGame: (mode, playerIds = [1, 2], snapshot) => {
      const gs = snapshot || createGameState(playerIds.length);
      gs.players = gs.players.filter((p) => playerIds.includes(p.id));
      gs.screen = "playing";
      stateRef.current = gs;
      cameraRef.current = { x: 0, y: 0 };
      clearKeys();
      const net = networkRef.current;
      net.mode = mode;
      net.frame = 0;
      net.nextClientFrame = 0;
      net.queuedFrames = new Map();
      setScreen("playing");
      screenRef.current = "playing";
    },
    onPeerLeftToMenu,
  });

  const { resetFrameClock } = useGameRuntime({
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
  });

  useEffect(() => {
    const apply = () =>
      setIsPortraitSmall(
        window.innerHeight > window.innerWidth && window.innerWidth < 760,
      );
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  const showRotateHint = isPortraitSmall && !rotateDismissed;

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setIsTouchDevice(mq.matches || window.innerWidth < 900);
    apply();
    mq.addEventListener?.("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener?.("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  const startLocalGame = useCallback(() => {
    cleanupNetwork();
    const gs = createShadowState([
      { id: 1, role: "Hacker" },
      { id: 2, role: "Assassin" },
      { id: 3, role: "Scout" },
      { id: 4, role: "Hacker" },
    ]);
    gs.screen = "playing";
    stateRef.current = gs;
    cameraRef.current = { x: 0, y: 0 };
    resetFrameClock();
    clearKeys();
    setScreen("playing");
    screenRef.current = "playing";
  }, [cleanupNetwork, resetFrameClock]);

  const goToMenu = useCallback(() => {
    cleanupNetwork();
    clearTouchInput();
    stateRef.current = null;
    resetLobbyUi();
    setScreen("menu");
    screenRef.current = "menu";
  }, [cleanupNetwork, resetLobbyUi]);

  const showInstructions = useCallback(() => {
    setScreen("instructions");
    screenRef.current = "instructions";
  }, []);

  const showLobby = useCallback(() => {
    setScreen("lobby");
    screenRef.current = "lobby";
  }, []);

  const resume = useCallback(() => {
    resetFrameClock();
    setScreen("playing");
    screenRef.current = "playing";
  }, [resetFrameClock]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-[100dvw] h-[100dvh] min-h-[100dvh] bg-background select-none overflow-hidden"
    >
      {screen === "menu" && (
        <div className="w-full">
          <MenuScreen
            onStart={startLocalGame}
            onInstructions={showInstructions}
            onLan={showLobby}
          />
        </div>
      )}

      {screen === "lobby" && (
        <LobbyScreen
          players={players}
          myPlayerId={myPlayerId}
          hostId={hostId}
          sendLobby={sendLobby}
          wsUrl={wsUrl}
          setWsUrl={setWsUrl}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          onHost={hostLanGame}
          onJoin={joinLanGame}
          onDiscover={discoverLanGames}
          discoveredRooms={discoveredRooms}
          onBack={goToMenu}
          status={netStatus}
          roomCode={roomCode}
          serverIp={serverIp}
          inviteLink={inviteLink}
          error={netError}
          lanMaxPlayers={lanMaxPlayers}
          setLanMaxPlayers={setLanMaxPlayers}
        />
      )}

      {screen === "instructions" && <InstructionsScreen onBack={goToMenu} />}
      {(screen === "win" || screen === "loss") && endStateRef.current && (
        <ResultScreen
          state={endStateRef.current}
          onRestart={
            networkRef.current.mode === "server" ? goToMenu : startLocalGame
          }
          onMenu={goToMenu}
        />
      )}

      <div
        className="relative w-full h-full"
        style={{
          display:
            screen === "playing" || screen === "paused" ? "block" : "none",
        }}
      >
        <button
          onClick={goToMenu}
          className="absolute z-40 right-2 rounded border border-[#6b5442] bg-[#2f251e] text-[10px] font-bold tracking-widest text-[#f4ead8] hover:bg-[#3d3027]"
          style={{ top: 4, height: 26, width: LEAVE_BUTTON_W - 12 }}
        >
          LEAVE
        </button>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block"
          style={{ width: "100%", height: "100%", touchAction: "none" }}
        />

        {showRotateHint && screen === "playing" && (
          <button
            onClick={() => setRotateDismissed(true)}
            className="absolute z-30 left-1/2 -translate-x-1/2 rounded-full bg-[#2f251e]/95 px-3 py-1 text-[11px] font-bold tracking-wider text-[#ffcf6e] shadow"
            style={{ top: 40 }}
          >
            ⟳ Rotate for a larger view ✕
          </button>
        )}

        {screen === "paused" && (
          <div className="absolute inset-0 top-8 rounded-lg">
            <PauseOverlay onResume={resume} onQuit={goToMenu} />
          </div>
        )}

        {isTouchDevice && screen === "playing" && (
          <TouchControls onChange={setTouchInput} />
        )}
      </div>
    </div>
  );
}
