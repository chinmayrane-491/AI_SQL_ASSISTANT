import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Database,
  BookOpen,
  Mail,
  Lock,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Server,
  Terminal,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

const ROLE_PROFILES = {
  admin: {
    role: "admin",
    title: "Admin",
    email: "admin@aisql.com",
    password: "password123",
    tag: "Full Access",
    color: "#8b5cf6",
    desc: "DDL, Schema & DB Admin",
  },
  writer: {
    role: "writer",
    title: "Writer",
    email: "writer@aisql.com",
    password: "password123",
    tag: "Read + Write",
    color: "#2563eb",
    desc: "DML queries & data updates",
  },
  reader: {
    role: "reader",
    title: "Reader",
    email: "reader@aisql.com",
    password: "password123",
    tag: "Read-Only",
    color: "#10b981",
    desc: "Strict SELECT queries only",
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("admin");
  const [email, setEmail] = useState("admin@aisql.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Switch role and pre-fill credentials
  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    const profile = ROLE_PROFILES[roleKey];
    if (profile) {
      setEmail(profile.email);
      setPassword(profile.password);
      setErrors({});
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setServerError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      await login({
        email,
        password,
        requestedRole: selectedRole,
        rememberMe,
      });

      // Redirect to the role workspace dashboard
      navigate(`/${selectedRole}`);
    } catch (err) {
      setServerError(err.message || "Failed to authenticate. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="psd-login-wrapper">
      {/* Dynamic warm diagonal gradient backdrop bands */}
      <div className="bg-diagonal-accent bg-diagonal-accent--1" />
      <div className="bg-diagonal-accent bg-diagonal-accent--2" />
      <div className="bg-diagonal-accent bg-diagonal-accent--3" />

      {/* Main Centered Floating Card */}
      <div className="psd-login-card">
        {/* Left Side: Premium MySQL AI Showcase Panel */}
        <div className="psd-left-showcase">
          {/* High-tech Datacenter & MySQL Server Background */}
          <div className="showcase-bg-image" />
          <div className="showcase-tech-grid-overlay" />
          <div className="showcase-gradient-overlay" />

          <div className="showcase-content">
            {/* Proper MySQL Logo & Brand Identity */}
            <div className="mysql-brand-header">
              <div className="mysql-logo-container">
                <div className="mysql-logo-icon-box">
                  <Database size={20} className="mysql-db-icon" />
                  <span className="mysql-dolphin-icon">🐬</span>
                </div>
                <div className="mysql-brand-titles">
                  <div className="mysql-logo-title-row">
                    <span className="mysql-main-logo-text">MySQL</span>
                    <span className="mysql-tag-chip">8.0</span>
                  </div>
                  <span className="mysql-sub-logo-tag">AI Database Workspace</span>
                </div>
              </div>

              <div className="mysql-status-live-chip">
                <span className="live-status-dot" />
                <span>Connected</span>
              </div>
            </div>

            {/* Bold Headline */}
            <div className="showcase-headline-group">
              <h1 className="showcase-headline">
                MySQL AI<br />
                Chatbot.
              </h1>
              <p className="showcase-description">
                Intelligent conversational database assistant for MySQL. Query multiple databases, manage user roles, inspect schemas, and execute verified SQL queries in real time.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="showcase-features-list">
              <div className="showcase-feature-item">
                <CheckCircle2 size={16} className="feature-icon" />
                <span>Natural Language to MySQL 8.0</span>
              </div>
              <div className="showcase-feature-item">
                <ShieldCheck size={16} className="feature-icon" />
                <span>Strict RBAC Security (Admin, Writer, Reader)</span>
              </div>
              <div className="showcase-feature-item">
                <Database size={16} className="feature-icon" />
                <span>Multi-Database Switching &amp; Schema DDL</span>
              </div>
            </div>

            {/* Tech Specs Footer */}
            <div className="showcase-footer-note">
              <span className="footer-tech-tag">MySQL Engine</span>
              <span className="footer-tech-divider">•</span>
              <span className="footer-tech-tag">Gemini AI</span>
              <span className="footer-tech-divider">•</span>
              <span className="footer-tech-tag">Port 3306</span>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Form Container */}
        <div className="psd-right-form-panel">
          <div className="form-header-area">
            <h2 className="form-title">Sign In</h2>
            <p className="form-subtitle">
              Choose your workspace role to load demo credentials
            </p>
          </div>

          {/* Error Notification */}
          {serverError && (
            <div className="psd-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="psd-form" noValidate>
            {/* Role Quick Selector Pills */}
            <div className="psd-role-group">
              <label className="psd-field-label">WORKSPACE ROLE</label>
              <div className="psd-role-pills">
                <button
                  type="button"
                  className={`psd-role-pill ${selectedRole === "admin" ? "psd-role-pill--active psd-role-pill--admin" : ""}`}
                  onClick={() => handleSelectRole("admin")}
                >
                  <ShieldCheck size={15} />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  className={`psd-role-pill ${selectedRole === "writer" ? "psd-role-pill--active psd-role-pill--writer" : ""}`}
                  onClick={() => handleSelectRole("writer")}
                >
                  <Database size={15} />
                  <span>Writer</span>
                </button>
                <button
                  type="button"
                  className={`psd-role-pill ${selectedRole === "reader" ? "psd-role-pill--active psd-role-pill--reader" : ""}`}
                  onClick={() => handleSelectRole("reader")}
                >
                  <BookOpen size={15} />
                  <span>Reader</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div className="psd-field-group">
              <label htmlFor="psd-email" className="psd-field-label">
                EMAIL ID
              </label>
              <div className={`psd-input-wrapper ${errors.email ? "psd-input-wrapper--error" : ""}`}>
                <Mail size={16} className="psd-input-icon" />
                <input
                  id="psd-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="name@company.com"
                  className="psd-input"
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="psd-field-error">{errors.email}</span>}
            </div>

            {/* Password Field */}
            <div className="psd-field-group">
              <label htmlFor="psd-password" className="psd-field-label">
                PASSWORD
              </label>
              <div className={`psd-input-wrapper ${errors.password ? "psd-input-wrapper--error" : ""}`}>
                <Lock size={16} className="psd-input-icon" />
                <input
                  id="psd-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="••••••••"
                  className="psd-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="psd-pwd-toggle"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="psd-field-error">{errors.password}</span>}
            </div>

            {/* Remember Credentials Checkbox */}
            <div className="psd-utilities-row">
              <label className="psd-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="psd-checkbox"
                />
                <span className="psd-checkbox-custom">
                  {rememberMe && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="psd-checkbox-text">
                  Remember credentials &amp; session
                </span>
              </label>
            </div>

            {/* Main Crimson Gradient Pill Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="psd-submit-pill-btn"
            >
              {loading ? (
                <span className="psd-btn-loading">
                  <span className="psd-spinner" />
                  <span>AUTHENTICATING...</span>
                </span>
              ) : (
                <span>LOGIN</span>
              )}
            </button>
          </form>

          {/* Clean Role Guidance Footer */}
          <div className="psd-form-footer-hint">
            <span>
              Configured for <strong>{selectedRole.toUpperCase()}</strong> access on MySQL localhost:3306
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
