import React from "react";
import "./GlassCard.css";

export default function GlassCard({
  children,
  className = "",
  elevated = false,
  padding = "default",
  style = {},
  ...props
}) {
  return (
    <div
      className={`glass-card ${elevated ? "glass-card--elevated" : ""} glass-card--pad-${padding} ${className}`}
      style={style}
      {...props}
    >
      <div className="glass-card-reflection" />
      <div className="glass-card-content">{children}</div>
    </div>
  );
}
