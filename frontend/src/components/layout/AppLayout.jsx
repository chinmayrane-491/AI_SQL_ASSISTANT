import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Database,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  BookOpen,
  Menu,
  X,
  Server,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDatabase } from "../../context/DatabaseContext";
import { useTheme } from "../../context/ThemeContext";
import "./AppLayout.css";

export default function AppLayout({
  activeTab = "chat",
  onTabChange,
  children,
}) {
  const { user, logout } = useAuth();
  const { activeDb, databases, selectDatabase } = useDatabase();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false);

  const role = user?.role || "reader";

  const getRoleDetails = () => {
    switch (role) {
      case "admin":
        return {
          name: "Admin",
          icon: ShieldCheck,
          accentClass: "role-badge--admin",
        };
      case "writer":
        return {
          name: "Writer",
          icon: Database,
          accentClass: "role-badge--writer",
        };
      default:
        return {
          name: "Reader",
          icon: BookOpen,
          accentClass: "role-badge--reader",
        };
    }
  };

  const roleDetails = getRoleDetails();
  const RoleIcon = roleDetails.icon;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "AI SQL Chat", icon: MessageSquare },
    { id: "schema", label: "Database Schema", icon: Database },
    { id: "history", label: "Query History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="app-container">
      {/* Background Floating Liquid Glass Specular Orbs */}
      <div className="layout-orb layout-orb--1" />
      <div className="layout-orb layout-orb--2" />
      <div className="layout-orb layout-orb--3" />
      <div className="layout-orb layout-orb--4" />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Liquid Glass Sidebar */}
      <aside className={`app-sidebar ${mobileMenuOpen ? "app-sidebar--open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-badge-layout">
            <div className="brand-logo-icon">
              <Sparkles size={18} />
            </div>
            <div className="brand-titles">
              <span className="brand-main-title">AI SQL Assistant</span>
              <span className="brand-sub-title">Intelligent DB Workspace</span>
            </div>
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <span className="nav-group-label">WORKSPACE</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onTabChange) onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`nav-item ${isActive ? "nav-item--active" : ""}`}
              >
                <Icon size={18} className="nav-item-icon" />
                <span className="nav-item-text">{item.label}</span>
                {isActive && <div className="nav-item-active-pill" />}
              </button>
            );
          })}
        </nav>

        {/* User Card at Bottom of Sidebar */}
        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-avatar">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.displayName || "User"}</span>
              <span className="user-email" title={user?.email}>{user?.email || "user@workspace.com"}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="user-logout-btn"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Header */}
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
              <span className="breadcrumb-root">Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {activeTab === "chat" ? "AI SQL Chat" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </span>
            </div>
          </div>

          <div className="header-right">
            {/* Database Switcher in Header */}
            <div className="db-selector-wrapper">
              <button
                type="button"
                onClick={() => setDbDropdownOpen(!dbDropdownOpen)}
                className="db-status-pill db-status-pill--interactive"
                title="Active Target Database (Click to switch)"
              >
                <Server size={14} className="db-icon" />
                <span className="db-name">{activeDb}</span>
                <span className="status-dot status-dot--online" />
                <ChevronDown size={13} className="db-chevron" />
              </button>

              {dbDropdownOpen && (
                <>
                  <div className="db-dropdown-backdrop" onClick={() => setDbDropdownOpen(false)} />
                  <div className="db-dropdown-menu fade-in-up">
                    <div className="db-dropdown-header">
                      <span>Select Target Database</span>
                      <span className="db-count-tag">{databases.length} Registered</span>
                    </div>

                    <div className="db-dropdown-list">
                      {databases.map((db) => {
                        const isActive = activeDb === db.name;
                        return (
                          <button
                            key={db.id}
                            type="button"
                            className={`db-dropdown-item ${isActive ? "db-dropdown-item--active" : ""}`}
                            onClick={() => {
                              selectDatabase(db.name);
                              setDbDropdownOpen(false);
                            }}
                          >
                            <div className="db-dropdown-item-icon">
                              <Database size={15} />
                            </div>
                            <div className="db-dropdown-info">
                              <span className="db-dropdown-name">{db.name}</span>
                              <span className="db-dropdown-sub">{db.displayName}</span>
                            </div>
                            {isActive && <Check size={16} className="db-active-check" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="db-dropdown-footer">
                      <button
                        type="button"
                        className="db-manage-btn"
                        onClick={() => {
                          setDbDropdownOpen(false);
                          if (onTabChange) onTabChange("settings");
                        }}
                      >
                        <Plus size={13} />
                        <span>Manage or Create Databases</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-header-btn"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={17} className="sun-icon" /> : <Moon size={17} className="moon-icon" />}
            </button>

            {/* Role Indicator Badge */}
            <div className={`role-badge ${roleDetails.accentClass}`}>
              <RoleIcon size={14} />
              <span>{roleDetails.name} Access</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className={`app-content-body ${activeTab === "chat" ? "app-content-body--chat" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
