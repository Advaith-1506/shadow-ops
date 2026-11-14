import React from 'react';
import { motion } from 'framer-motion';
import pausePanel from '../../../museum_break_final_assets/pause/panel.png';

export default function PauseOverlay({ onResume, onQuit }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20"
    >
      <div className="text-center bg-center bg-cover px-6 md:px-10 py-6 md:py-8 rounded-xl max-w-[92vw]" style={{ backgroundImage: `url(${pausePanel})` }}>
        <h2 className="text-2xl md:text-5xl font-heading font-bold text-foreground mb-2">PAUSED</h2>
        <p className="text-muted-foreground font-mono text-xs md:text-base mb-5 md:mb-8">Press Escape to resume</p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={onResume}
            className="px-10 py-3 bg-primary text-primary-foreground font-heading font-semibold rounded-lg hover:bg-primary/90 transition-all"
          >
            RESUME
          </button>
          <button
            onClick={onQuit}
            className="px-10 py-3 bg-secondary text-secondary-foreground font-heading text-sm rounded-lg hover:bg-secondary/80 transition-all"
          >
            QUIT TO MENU
          </button>
        </div>
      </div>
    </motion.div>
  );
}
