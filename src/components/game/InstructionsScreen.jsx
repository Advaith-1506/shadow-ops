import React from 'react';
import { motion } from 'framer-motion';
import instructionsBg from '../../../Background_images/ChatGPT Image May 17, 2026, 12_39_07 AM (2).png';

const DESKTOP_SECTIONS = [
  {
    title: 'OBJECTIVE',
    col: '#ffd54f',
    items: [
      'Steal at least 3 artifacts — including the Crown Jewel (★ high-value)',
      'Both players must reach the Getaway Van to escape',
      'Escape before the 10-minute timer runs out',
      'Keep the alarm bar below 100%',
    ],
  },
  {
    title: 'PLAYER 1 — FAST THIEF',
    col: '#4fc3f7',
    items: [
      'Move: W A S D',
      'Interact: E',
      'Special: Can crawl through vents to unlock doors',
      'Bonus: Faster base movement speed',
    ],
  },
  {
    title: 'PLAYER 2 — STRONG THIEF',
    col: '#ff8a65',
    items: [
      'Move: Arrow Keys',
      'Interact: Enter  or  Space',
      'Special: Can carry heavy artifacts (Marble Statue)',
      'Special: Can push crates to block camera lines',
    ],
  },
  {
    title: 'PLAYER 3 / 4 — EXTRA CREW',
    col: '#81c784',
    items: [
      'Player 3: Move T F G H, Interact R',
      'Player 4: Move I J K L, Interact O',
      'Roles mirror Fast/Strong archetypes to support larger heists',
    ],
  },
  {
    title: 'CO-OP PUZZLES',
    col: '#66bb6a',
    items: [
      'Double Plate Door (Archive): Both players must stand on separate green plates',
      'Laser Vault: Stand on the plate in Storage to disable vault lasers',
      'Switch Door: One player holds the purple switch while the other passes',
      'Vent Shortcut: Fast Thief enters vent in Storage to unlock the Storage↔Lobby door',
    ],
  },
  {
    title: 'HAZARDS',
    col: '#ef5350',
    items: [
      '🔴 Guards — circular patrol routes; entering radius raises alarm gradually',
      '📷 Cameras — sweeping cones; being seen raises alarm',
      '🔻 Lasers — crossing active beams raises alarm fast; step on vault plate to disable',
      'Physical contact with a guard = big alarm spike!',
    ],
  },
  {
    title: 'SCORING',
    col: '#ab47bc',
    items: [
      'Score = Loot Value + (Time Left × 2) − (Alarm Level × 1.5)',
      'Crown Jewel = $500 | Marble Statue = $220 | Others = $80–$150',
    ],
  },
];

export default function InstructionsScreen({ onBack }) {
  const isMobile = typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900);
  const sections = isMobile
    ? [
        {
          title: 'OBJECTIVE',
          col: '#ffd54f',
          items: [
            'Steal at least 3 artifacts, including the Crown Jewel (★ high-value)',
            'Escape to the van before the 10-minute timer expires',
            'Keep alarm under 100%',
          ],
        },
        {
          title: 'MAP MECHANICS',
          col: '#66bb6a',
          items: [
            'Vents unlock route access between rooms',
            'Switch-controlled door connects Lobby ↔ Archive',
            'Double plate door requires two players together',
            'Storage plate disables vault lasers',
          ],
        },
        {
          title: 'THREATS',
          col: '#ef5350',
          items: [
            'Guards detect in front/radius and chase on sight',
            'Cameras sweep cone vision',
            'Laser beams and guard contact raise alarm quickly',
          ],
        },
      ]
    : DESKTOP_SECTIONS;

  return (
    <div className="flex flex-col items-center justify-center w-[100dvw] h-[100dvh] bg-background px-2 py-2 md:px-4 md:py-6 overflow-hidden relative">
      <img src={instructionsBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full h-full relative z-10 flex flex-col"
      >
        <h2 className="text-xl md:text-5xl font-heading font-bold text-foreground mb-2 md:mb-5 text-center tracking-wide shrink-0">
          HOW TO PLAY
        </h2>

        <div className="space-y-2 md:space-y-4 overflow-y-auto pr-1 md:pr-2">
          {sections.map((sec, i) => (
            <motion.div
              key={sec.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card/95 rounded-lg border border-border p-2.5 md:p-4"
            >
              <h3 className="font-mono font-semibold text-[11px] md:text-lg mb-1.5 md:mb-3 tracking-wider" style={{ color: sec.col }}>
                {sec.title}
              </h3>
              <ul className="space-y-1 md:space-y-1.5">
                {sec.items.map((item, j) => (
                  <li key={j} className="text-[11px] md:text-base text-muted-foreground font-mono flex items-start gap-2">
                    <span className="text-muted-foreground/35 mt-0.5 shrink-0">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-2 md:mt-4 mb-1 md:mb-2 shrink-0">
          <button
            onClick={onBack}
            className="px-7 md:px-10 py-2 md:py-3 text-sm md:text-base bg-secondary text-secondary-foreground font-heading rounded-lg hover:bg-secondary/80 transition-all"
          >
            ← BACK TO MENU
          </button>
        </div>
      </motion.div>
    </div>
  );
}
