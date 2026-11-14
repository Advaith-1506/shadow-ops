import React from 'react';
import { motion } from 'framer-motion';
import winBg from '../../../museum_break_final_assets/result/win_bg.png';
import lossBg from '../../../museum_break_final_assets/result/loss_bg.png';

export default function ResultScreen({ state, onRestart, onMenu }) {
  const isWin       = state.screen === 'win';
  const totalValue  = state.loot.reduce((s, a) => s + a.value, 0);
  const bestArtifact = state.loot.length > 0
    ? state.loot.reduce((b, a) => a.value > b.value ? a : b, state.loot[0])
    : null;
  const mins = Math.floor(state.timer / 60);
  const secs = Math.floor(state.timer % 60);

  return (
    <div className="flex flex-col items-center justify-center w-[100dvw] h-[100dvh] bg-background relative overflow-hidden px-2 py-2 md:px-0 md:py-0">
      <img src={isWin ? winBg : lossBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none" />
      {/* Ambient glow */}
      <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[280px] rounded-full blur-[130px] pointer-events-none ${isWin ? 'bg-primary/8' : 'bg-accent/8'}`} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="text-center relative z-10 max-w-lg w-full max-h-[96dvh] overflow-y-auto px-2 sm:px-4"
      >
        {/* Result title */}
        <div className="mb-4 md:mb-6">
          <p className={`text-xs font-mono tracking-[0.3em] mb-2 ${isWin ? 'text-primary/70' : 'text-accent/70'}`}>
            {isWin ? 'MISSION COMPLETE' : 'MISSION FAILED'}
          </p>
          <h1 className={`text-3xl sm:text-5xl md:text-7xl font-heading font-bold ${isWin ? 'text-primary' : 'text-accent'}`}>
            {isWin ? 'HEIST SUCCESS!' : 'BUSTED!'}
          </h1>
          {!isWin && state.lossReason && (
            <p className="text-muted-foreground font-mono text-xs sm:text-sm mt-2 md:mt-3">{state.lossReason}</p>
          )}
        </div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-3 sm:p-5 mb-3 md:mb-4"
        >
          <p className="text-xs font-mono text-muted-foreground mb-1 tracking-widest">FINAL SCORE</p>
          <p className="text-3xl sm:text-5xl md:text-6xl font-heading font-bold text-foreground">{state.score.toLocaleString()}</p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 md:mb-4"
        >
          {[
            { label: 'LOOT VALUE',   value: `$${totalValue}`,            col: 'text-primary' },
            { label: 'ITEMS STOLEN', value: state.loot.length,           col: 'text-foreground' },
            { label: 'TIME LEFT',    value: `${mins}:${secs.toString().padStart(2,'0')}`, col: 'text-foreground' },
            { label: 'ALARM LEVEL',  value: `${Math.floor(state.alarm)}%`, col: state.alarm > 75 ? 'text-accent' : 'text-foreground' },
          ].map(({ label, value, col }) => (
            <div key={label} className="bg-card rounded-lg border border-border p-2.5 sm:p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">{label}</p>
              <p className={`text-base sm:text-2xl font-heading font-bold ${col}`}>{value}</p>
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
            <p className="text-xs font-mono text-muted-foreground mb-1">BEST ARTIFACT</p>
            <p className="text-base sm:text-lg font-heading font-semibold text-primary">{bestArtifact.name}</p>
            <p className="text-xs sm:text-sm font-mono text-muted-foreground">${bestArtifact.value}</p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col gap-2 md:gap-3 items-center"
        >
          <button
            onClick={onRestart}
            className="w-[88%] sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-primary text-primary-foreground font-heading font-semibold text-base sm:text-lg rounded-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            {isWin ? 'PLAY AGAIN' : 'TRY AGAIN'}
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
