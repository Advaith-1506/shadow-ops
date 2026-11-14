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
import { useLanMultiplayer } from "@/hooks/useLanMultiplayer";
import { useGameRuntime } from "@/hooks/useGameRuntime";

export default function Game() {
  const [screen, setScreen] = useState("menu");
  const [isTouchDevice, setIsTouchDevice] = useState(false);

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
        className={`relative w-full h-full ${isTouchDevice ? "px-0" : "px-1"}`}
        style={{
          display:
            screen === "playing" || screen === "paused" ? "block" : "none",
        }}
      >
        {!isTouchDevice && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="font-heading font-bold text-foreground text-sm tracking-widest">
              SHADOW OPS
            </span>
            <span className="text-xs font-mono text-muted-foreground/50">
              {networkRef.current.mode === "server"
                ? "LAN · SERVER AUTHORITATIVE"
                : "ESC - pause"}
            </span>
          </div>
        )}

        <button onClick={goToMenu} className="absolute z-40 bottom-5 left-1/2 -translate-x-1/2 rounded border border-slate-600 bg-slate-950/90 px-3 py-2 text-[10px] tracking-widest text-slate-300">LEAVE OPERATION</button>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={`block mx-auto ${isTouchDevice ? "" : "rounded-lg border border-border shadow-2xl shadow-black/60"}`}
          style={{
            width: "100%",
            height: isTouchDevice ? "100%" : "calc(100vh - 86px)",
            imageRendering: "pixelated",
          }}
        />

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
