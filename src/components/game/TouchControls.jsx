import React, { useEffect, useRef, useState } from "react";
import {
  createControllerInput,
  neutralInput,
  bindInputRelease,
} from "@/lib/party/controllerInput";
export default function TouchControls({
  onChange,
  player,
  compact = false,
  haptics = false,
  enabled = true,
}) {
  const callback = useRef(onChange);
  callback.current = onChange;
  const [input, setInput] = useState(neutralInput),
    [knob, setKnob] = useState({ x: 0, y: 0 });
  const joystick = useRef(null),
    movePointer = useRef(null),
    model = useRef(null);
  if (!model.current)
    model.current = createControllerInput((next) => {
      setInput(next);
      callback.current?.(next);
    });
  const clear = () => {
    model.current.clear();
    movePointer.current = null;
    setKnob({ x: 0, y: 0 });
  };
  useEffect(() => {
    const release = () => {
      model.current.clear();
      movePointer.current = null;
      setKnob({ x: 0, y: 0 });
    };
    return bindInputRelease(window, document, release);
  }, []);
  useEffect(() => {
    if (!enabled) clear();
  }, [enabled]);
  function start(e, control) {
    e.preventDefault();
    if (!enabled || !model.current.start(e.pointerId, control)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (haptics) navigator.vibrate?.(12);
    if (control === "move") {
      movePointer.current = e.pointerId;
      move(e);
    }
  }
  function move(e) {
    if (e.pointerId !== movePointer.current) return;
    const r = joystick.current.getBoundingClientRect();
    const radius = r.width * 0.34;
    const d = model.current.move(
      e.pointerId,
      e.clientX - r.left - r.width / 2,
      e.clientY - r.top - r.height / 2,
      radius,
    );
    if (d) setKnob({ x: d.x, y: d.y });
  }
  function end(e) {
    model.current.end(e.pointerId);
    if (movePointer.current === e.pointerId) {
      movePointer.current = null;
      setKnob({ x: 0, y: 0 });
    }
  }
  const events = (control) => ({
    onPointerDown: (e) => start(e, control),
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  });
  const cooldown = Math.ceil(player?.abilityCooldown || 0);
  return (
    <div
      className={`phone-controls ${compact ? "compact-controls" : ""} ${!enabled ? "controls-disabled" : ""}`}
    >
      <div className="joystick-area">
        <div
          ref={joystick}
          role="group"
          aria-label="Movement joystick"
          data-testid="joystick"
          className={`phone-joystick ${input.up || input.down || input.left || input.right ? "moving" : ""}`}
          {...events("move")}
          onPointerMove={move}
        >
          <span className="joystick-guides">
            ↑<br />
            ←　 →<br />↓
          </span>
          <div
            className="joystick-knob"
            style={{ transform: `translate(${knob.x}px,${knob.y}px)` }}
          />
        </div>
        <small>
          {input.up || input.down || input.left || input.right
            ? "MOVING"
            : "DRAG TO MOVE"}
        </small>
      </div>
      <div className="phone-action-area">
        <button
          aria-label="Interact"
          className={`phone-action interact ${input.interact ? "pressed" : ""}`}
          {...events("interact")}
        >
          <b>INTERACT</b>
          <small>
            {player?.downed
              ? "AWAIT REVIVE"
              : player?.nearPrompt?.text?.replace(/^\[E\]\s*/, "") ||
                "HOLD TO REVIVE"}
          </small>
        </button>
        <button
          aria-label="Use ability"
          className={`phone-action ability ${input.ability ? "pressed" : ""}`}
          style={{
            "--role-color": player?.role === "Decoy" ? "#d1a2ff" : "#65d7ff",
          }}
          {...events("ability")}
        >
          <b>{cooldown ? `${cooldown}s` : "ABILITY"}</b>
          <small>
            {cooldown
              ? "RECHARGING"
              : player?.role === "Decoy"
                ? "NOISE MAKER"
                : player?.role === "Scout"
                  ? "RECON PULSE"
                  : player?.role === "Hacker"
                    ? "SYSTEM OVERRIDE"
                    : "SILENT TAKEDOWN"}
          </small>
          <span
            className="ability-charge"
            style={{
              width: `${cooldown ? Math.max(0, 100 - (cooldown / 18) * 100) : 100}%`,
            }}
          />
        </button>
      </div>
    </div>
  );
}
