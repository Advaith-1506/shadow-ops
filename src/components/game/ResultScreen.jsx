import React from "react";
import { motion } from "framer-motion";

export default function ResultScreen({
  state,
  onRestart,
  onMenu,
  networked = false,
  isHost = false,
}) {
  const isWin = state.screen === "win";
  const recovered = [
    ...state.loot,
    ...(state.players || []).filter((p) => p.holding).map((p) => p.holding),
  ];
  const totalValue = recovered.reduce((s, a) => s + a.value, 0);
  const bestArtifact =
    recovered.length > 0
      ? recovered.reduce((b, a) => (a.value > b.value ? a : b), recovered[0])
      : null;
  const mins = Math.floor(state.timer / 60);
  const secs = Math.floor(state.timer % 60);

  return (
    <div
      className={`ops-debrief ${isWin ? "ops-debrief-success" : "ops-debrief-failure"} flex flex-col items-center justify-center w-[100dvw] h-[100dvh] relative overflow-hidden px-2 py-2 md:px-0 md:py-0`}
    >
      <div className="ops-debrief-grid" aria-hidden="true" />
      {/* Ambient glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[280px] rounded-full blur-[130px] pointer-events-none ${isWin ? "bg-primary/8" : "bg-accent/8"}`}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="text-center relative z-10 max-w-lg w-full max-h-[96dvh] overflow-y-auto px-2 sm:px-4"
      >
        {/* Result title */}
        <div className="mb-4 md:mb-6">
          <p
            className={`text-xs font-mono tracking-[0.3em] mb-2 ${isWin ? "text-primary/70" : "text-accent/70"}`}
          >
            {isWin ? "MISSION COMPLETE" : "MISSION FAILED"}
          </p>
          <h1
            className={`text-3xl sm:text-5xl md:text-7xl font-heading font-bold ${isWin ? "text-primary" : "text-accent"}`}
          >
            {isWin ? "HEIST SUCCESS!" : "BUSTED!"}
          </h1>
          {!isWin && state.lossReason && (
            <p className="text-muted-foreground font-mono text-xs sm:text-sm mt-2 md:mt-3">
              {state.lossReason}
            </p>
          )}
        </div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-3 sm:p-5 mb-3 md:mb-4"
        >
          <p className="text-xs font-mono text-muted-foreground mb-1 tracking-widest">
            FINAL SCORE
          </p>
          <p className="text-3xl sm:text-5xl md:text-6xl font-heading font-bold text-foreground">
            {state.score.toLocaleString()}
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 md:mb-4"
        >
          {[
            {
              label: "LOOT VALUE",
              value: `$${totalValue}`,
              col: "text-primary",
            },
            {
              label: "ITEMS STOLEN",
              value: recovered.length,
              col: "text-foreground",
            },
            {
              label: "TIME LEFT",
              value: `${mins}:${secs.toString().padStart(2, "0")}`,
              col: "text-foreground",
            },
            {
              label: "ALARM LEVEL",
              value: `${Math.floor(state.alarm)}%`,
              col: state.alarm > 75 ? "text-accent" : "text-foreground",
            },
          ].map(({ label, value, col }) => (
            <div
              key={label}
              className="bg-card rounded-lg border border-border p-2.5 sm:p-4"
            >
              <p className="text-xs font-mono text-muted-foreground mb-1">
                {label}
              </p>
              <p
                className={`text-base sm:text-2xl font-heading font-bold ${col}`}
              >
                {value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Best artifact */}
        {bestArtifact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-lg border border-border p-3 mb-4 md:mb-6 text-center"
          >
            <p className="text-xs font-mono text-muted-foreground mb-1">
              BEST ARTIFACT
            </p>
            <p className="text-base sm:text-lg font-heading font-semibold text-primary">
              {bestArtifact.name}
            </p>
            <p className="text-xs sm:text-sm font-mono text-muted-foreground">
              ${bestArtifact.value}
            </p>
          </motion.div>
        )}

        {state.players && (
          <div className="party-results">
            <p>
              ELAPSED {Math.floor((600 - state.timer) / 60)}m{" "}
              {Math.floor((600 - state.timer) % 60)}s · TEAM SCORE {state.score}
            </p>
            {state.players.map((p) => (
              <p key={p.id}>
                <b>
                  {p.nickname} · {p.role}
                </b>
                <span>
                  {Object.entries(p.stats || {})
                    .filter(([, value]) => value > 0)
                    .map(([name, value]) => `${name}: ${value}`)
                    .join(" · ") || "No recorded objective or ability actions"}
                </span>
              </p>
            ))}
            {networked && !isHost && (
              <p>Waiting for the host to return the squad to the lobby.</p>
            )}
          </div>
        )}
        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col gap-2 md:gap-3 items-center"
        >
          <button
            disabled={networked && !isHost}
            onClick={onRestart}
            className="w-[88%] sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-primary text-primary-foreground font-heading font-semibold text-base sm:text-lg rounded-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            {networked
              ? "RETURN TO LOBBY / PLAY AGAIN"
              : isWin
                ? "PLAY AGAIN"
                : "TRY AGAIN"}
          </button>
          <button
            onClick={onMenu}
            className="w-[88%] sm:w-auto px-8 sm:px-12 py-2.5 sm:py-3 bg-secondary text-secondary-foreground font-heading text-xs sm:text-sm rounded-lg hover:bg-secondary/80 transition-all"
          >
            MAIN MENU
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
