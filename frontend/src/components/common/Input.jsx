import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./Input.css";

export default function Input({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error = "",
  helperText = "",
  icon: Icon = null,
  disabled = false,
  autoComplete = "off",
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`input-group ${error ? "input-group--error" : ""} ${disabled ? "input-group--disabled" : ""} ${className}`}>
      {label && (
        <div className="input-label-row">
          <label htmlFor={id || name} className="input-label">
            {label}
            {required && <span className="input-required">*</span>}
          </label>
        </div>
      )}

      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon input-icon--start">
            <Icon size={18} />
          </span>
        )}

        <input
          id={id || name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`input-field ${Icon ? "input-field--has-start-icon" : ""} ${
            isPassword ? "input-field--has-end-icon" : ""
          }`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p className="input-error-msg" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="input-helper-msg">{helperText}</p>
      ) : null}
    </div>
  );
}
