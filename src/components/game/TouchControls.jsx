import React, { useRef, useState } from 'react';

function dirFromVector(dx, dy) {
  const dead = 14;
  if (Math.hypot(dx, dy) < dead) return { up: false, down: false, left: false, right: false };
  return {
    up: dy < -8,
    down: dy > 8,
    left: dx < -8,
    right: dx > 8,
  };
}

export default function TouchControls({ onChange }) {
  const padRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [pid, setPid] = useState(null);
  const interactHeld = useRef(false);

  const emit = (extra = {}) => {
    const d = dirFromVector(knob.x, knob.y);
    onChange?.({ ...d, interact: interactHeld.current, ...extra });
  };

  const pointerPos = (e) => {
    const r = padRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = Math.min(r.width, r.height) * 0.32;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    return { x: dx, y: dy };
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        ref={padRef}
        className="pointer-events-auto absolute left-4 bottom-6 w-32 h-32 rounded-full border border-white/25 bg-black/35 backdrop-blur-sm touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setPid(e.pointerId);
          const p = pointerPos(e);
          setKnob(p);
          onChange?.({ ...dirFromVector(p.x, p.y), interact: interactHeld.current });
        }}
        onPointerMove={(e) => {
          if (pid !== e.pointerId) return;
          e.preventDefault();
          const p = pointerPos(e);
          setKnob(p);
          onChange?.({ ...dirFromVector(p.x, p.y), interact: interactHeld.current });
        }}
        onPointerUp={(e) => {
          if (pid !== e.pointerId) return;
          e.preventDefault();
          setPid(null);
          setKnob({ x: 0, y: 0 });
          emit({ up: false, down: false, left: false, right: false });
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 w-12 h-12 -ml-6 -mt-6 rounded-full bg-white/35 border border-white/45"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      <button
        className="pointer-events-auto absolute right-5 bottom-8 w-24 h-24 rounded-full border border-[#ffd166]/70 bg-[#ffd166]/25 text-[#ffe8a3] font-heading text-lg touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          interactHeld.current = true;
          emit({ interact: true });
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          interactHeld.current = false;
          emit({ interact: false });
        }}
        onPointerCancel={() => {
          interactHeld.current = false;
          emit({ interact: false });
        }}
      >
        ACT
      </button>
    </div>
  );
}

