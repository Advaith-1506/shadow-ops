import React from "react";
import { ROLE_INFO } from "@/lib/game/roles";
export default function RoleCards({ selected, onSelect, players = [] }) {
  return (
    <div className="party-role-grid">
      {Object.entries(ROLE_INFO).map(([role, info]) => (
        <button
          key={role}
          type="button"
          aria-pressed={selected === role}
          className={selected === role ? "role-card chosen" : "role-card"}
          style={{ "--role": info.color }}
          onClick={() => onSelect(role)}
        >
          <span className="role-card-top">
            <b>{role}</b>
            <small>
              {players.filter((p) => p.role === role).length} selected
            </small>
          </span>
          <strong>{info.ability}</strong>
          <span>{info.description}</span>
          <small>
            {info.strength} · {info.cooldown}s cooldown
          </small>
        </button>
      ))}
    </div>
  );
}
