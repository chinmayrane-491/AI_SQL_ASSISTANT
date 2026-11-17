import React from "react";
import "./Button.css";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = "left",
  className = "",
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`btn btn--${variant} btn--${size} ${fullWidth ? "btn--full-width" : ""} ${
        loading ? "btn--loading" : ""
      } ${className}`}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="spinner-svg">
            <circle
              className="spinner-track"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              className="spinner-head"
              d="M12 3a9 9 0 0 1 9 9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}

      <span className={`btn-content ${loading ? "btn-content--hidden" : ""}`}>
        {Icon && iconPosition === "left" && <Icon className="btn-icon btn-icon--left" size={18} />}
        <span>{children}</span>
        {Icon && iconPosition === "right" && <Icon className="btn-icon btn-icon--right" size={18} />}
      </span>
    </button>
  );
}
