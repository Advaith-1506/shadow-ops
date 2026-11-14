import React from 'react';
import { motion } from 'framer-motion';
import menuBg from '../../../Background_images/ChatGPT Image May 17, 2026, 12_39_06 AM (1).png';

export default function MenuScreen({ onStart, onInstructions, onLan }) {
  return (
    <div className="flex flex-col items-center justify-center w-[100dvw] h-[100dvh] bg-background relative overflow-hidden px-3 py-1 md:px-0 md:py-0">
      <img src={menuBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" />
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 left-1/3 w-[200px] h-[200px] bg-accent/5 rounded-full blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center relative z-10 w-full max-w-[560px] md:max-w-[1800px] flex flex-col items-center"
      >
        {/* Title */}
        <div className="mb-0.5 md:mb-2">
          <span className="text-[10px] md:text-2xl font-mono tracking-[0.28em] md:tracking-[0.42em] text-muted-foreground uppercase">
            A Co-op Stealth Heist
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-[18rem] leading-[0.86] font-heading font-bold tracking-tight text-foreground mb-0.5">
          MUSEUM
        </h1>
        <h1 className="text-3xl sm:text-5xl md:text-[18rem] leading-[0.86] font-heading font-bold tracking-tight text-primary -mt-0.5 md:-mt-10">
          BREAK
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground font-mono text-[10px] sm:text-sm md:text-3xl mt-1.5 md:mt-10 max-w-[95%] sm:max-w-md md:max-w-5xl mx-auto"
        >
          Two thieves. One museum. Steal the artifacts, avoid the guards, and escape before lockdown.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col md:flex-row md:justify-center gap-1.5 md:gap-6 mt-3 md:mt-16 items-center w-full"
        >
          <button
            onClick={onStart}
            className="w-[88%] sm:w-auto px-8 sm:px-12 md:px-24 py-3 sm:py-4 md:py-7 bg-primary text-primary-foreground font-heading font-semibold text-base sm:text-lg md:text-4xl rounded-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 border border-primary/50"
          >
            START HEIST
          </button>
          <button
            onClick={onInstructions}
            className="w-[88%] sm:w-auto px-8 sm:px-12 md:px-24 py-2.5 sm:py-3 md:py-6 bg-secondary text-secondary-foreground font-heading text-xs sm:text-sm md:text-3xl rounded-lg hover:bg-secondary/80 transition-all border border-white/15"
          >
            HOW TO PLAY
          </button>
          <button
            onClick={onLan}
            className="w-[88%] sm:w-auto px-8 sm:px-12 md:px-24 py-2.5 sm:py-3 md:py-6 bg-secondary/60 text-secondary-foreground font-heading text-xs sm:text-sm md:text-3xl rounded-lg hover:bg-secondary/80 transition-all border border-white/15"
          >
            LAN HOST / JOIN
          </button>
        </motion.div>

        {/* Player indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="hidden md:flex gap-16 mt-14 justify-center"
        >
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[#4fc3f7]/20 border border-[#4fc3f7]/40 flex items-center justify-center mx-auto mb-3">
              <span className="text-[#4fc3f7] font-mono font-bold text-3xl">P1</span>
            </div>
            <p className="text-2xl font-mono text-muted-foreground">Fast Thief</p>
            <p className="text-xl font-mono text-muted-foreground/60">WASD + E</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[#ff8a65]/20 border border-[#ff8a65]/40 flex items-center justify-center mx-auto mb-3">
              <span className="text-[#ff8a65] font-mono font-bold text-3xl">P2</span>
            </div>
            <p className="text-2xl font-mono text-muted-foreground">Strong Thief</p>
            <p className="text-xl font-mono text-muted-foreground/60">Arrows + Enter</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
