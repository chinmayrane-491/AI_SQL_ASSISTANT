import React from "react";
import { CheckCircle2 } from "lucide-react";
import "./RoleCard.css";

export default function RoleCard({
  role,
  title,
  description,
  icon: Icon,
  accent = "blue", // "purple" | "blue" | "green"
  selected = false,
  onSelect,
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(role)}
      className={`role-card role-card--${accent} ${selected ? "role-card--selected" : ""}`}
    >
      <div className="role-card-header">
        <div className="role-card-icon-wrapper">
          <Icon size={20} className="role-card-icon" />
        </div>
        <div className={`role-card-indicator ${selected ? "role-card-indicator--active" : ""}`}>
          {selected && <CheckCircle2 size={16} />}
        </div>
      </div>

      <div className="role-card-body">
        <h3 className="role-card-title">{title}</h3>
        <p className="role-card-desc">{description}</p>
      </div>

      {selected && <div className="role-card-glow" />}
    </button>
  );
}
