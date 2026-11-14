import React from "react";
import { motion } from "framer-motion";
import lobbyBg from '../../../Background_images/ChatGPT Image May 17, 2026, 12_39_07 AM (2).png';
import panelCard from '../../../museum_break_final_assets/lobby/panel_card.png';

export default function LobbyScreen({
  joinCode,
  setJoinCode,
  onHost,
  onJoin,
  onDiscover,
  discoveredRooms,
  onBack,
  status,
  roomCode,
  serverIp,
  inviteLink,
  error,
  lanMaxPlayers,
  setLanMaxPlayers,
}) {
  return (
    <div className="flex flex-col items-center justify-center w-[100dvw] h-[100dvh] bg-background px-2 md:px-4 py-1 md:py-0 relative overflow-hidden">
      <img src={lobbyBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl max-h-[96dvh] border border-border rounded-xl p-2.5 sm:p-6 relative z-10 bg-center bg-cover overflow-y-auto"
        style={{ backgroundImage: `url(${panelCard})` }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold text-foreground text-center">LAN LOBBY</h2>
        <p className="hidden md:block text-[11px] sm:text-xs md:text-sm font-mono text-muted-foreground text-center mt-1 sm:mt-2">
          Host creates a room. Others can detect nearby sessions or join via room code.
        </p>

        <div className="mt-2 sm:mt-4">
          <label className="block text-xs font-mono text-muted-foreground mb-2">MAX PLAYERS (HOST)</label>
          <select
            value={lanMaxPlayers}
            onChange={(e) => setLanMaxPlayers(Number(e.target.value))}
            className="w-full bg-background border border-border rounded-md px-3 py-2 md:py-3 font-mono text-sm md:text-base"
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-3 mt-2 sm:mt-5">
          <button
            onClick={onHost}
            className="px-4 py-3 md:py-3.5 bg-primary text-primary-foreground rounded-md font-heading font-semibold md:text-lg"
          >
            HOST GAME
          </button>
          <button
            onClick={onJoin}
            className="px-4 py-3 md:py-3.5 bg-secondary text-secondary-foreground rounded-md font-heading md:text-lg"
          >
            JOIN GAME
          </button>
        </div>

        <div className="mt-1.5 sm:mt-3">
          <button
            onClick={onDiscover}
            className="px-4 py-2 md:py-3 bg-secondary/60 text-secondary-foreground rounded-md font-heading text-sm md:text-base w-full"
          >
            FIND NEARBY SESSIONS
          </button>
        </div>

        <div className="mt-2 sm:mt-4">
          <label className="block text-xs font-mono text-muted-foreground mb-2">ROOM CODE (for join)</label>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="AB12CD"
            className="w-full bg-background border border-border rounded-md px-3 py-2 md:py-3 font-mono text-sm md:text-base uppercase"
          />
        </div>

        {(roomCode || serverIp || inviteLink) && (
          <div className="hidden md:block mt-5 p-3 bg-background border border-border rounded-md">
            {roomCode && <p className="font-mono text-sm">Room Code: <span className="text-primary font-bold">{roomCode}</span></p>}
            {serverIp && <p className="font-mono text-sm mt-1">Host IP: <span className="text-primary">{serverIp}</span></p>}
            {inviteLink && <p className="font-mono text-xs mt-1 break-all">Invite Link: <span className="text-primary">{inviteLink}</span></p>}
          </div>
        )}

        {!!discoveredRooms?.length && (
          <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-background border border-border rounded-md">
            <p className="font-mono text-xs text-muted-foreground mb-2">Nearby Rooms</p>
            <div className="space-y-1.5 sm:space-y-2">
              {discoveredRooms.slice(0, 2).map((r) => (
                <button
                  key={r.roomCode}
                  onClick={() => setJoinCode(r.roomCode)}
                  className="w-full text-left px-3 py-2 rounded border border-border bg-secondary/30 font-mono text-xs"
                >
                  {r.roomCode}  ·  {r.players}/{r.maxPlayers}
                </button>
              ))}
            </div>
          </div>
        )}

        {status && <p className="mt-2 text-[11px] font-mono text-muted-foreground">{status}</p>}
        {error && <p className="mt-1 text-[11px] font-mono text-red-400">{error}</p>}

        <button
          onClick={onBack}
          className="mt-2 sm:mt-6 px-4 py-1.5 text-xs font-mono bg-secondary/50 rounded-md"
        >
          BACK
        </button>
      </motion.div>
    </div>
  );
}
