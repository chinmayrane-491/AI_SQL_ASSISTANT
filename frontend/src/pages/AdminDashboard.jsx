import React, { useState } from "react";
import {
  ShieldCheck,
  Database,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Table as TableIcon,
  CheckCircle2,
  Lock,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import GlassCard from "../components/common/GlassCard";
import Button from "../components/common/Button";
import ChatWorkspace from "../components/chat/ChatWorkspace";
import SchemaExplorer from "../components/dashboard/SchemaExplorer";
import DatabaseSettings from "../components/dashboard/DatabaseSettings";
import TablesOverview from "../components/dashboard/TablesOverview";
import QueryHistory from "../components/dashboard/QueryHistory";
import { useDatabase } from "../context/DatabaseContext";
import "./DashboardCommon.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatQuestion, setChatQuestion] = useState("");
  const { activeDb, currentDbDetails } = useDatabase();

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* 1. Dedicated AI SQL Chat Workspace - Kept mounted so background responses & tab switches are never lost */}
      <div style={{ display: activeTab === "chat" ? "flex" : "none", flex: 1, height: "100%", minHeight: 0, flexDirection: "column" }}>
        <ChatWorkspace role="admin" initialQuestion={chatQuestion} />
      </div>

      {/* 2. Executive Dashboard Overview (Clean metrics & launchpad without duplicate chat) */}
      {activeTab === "dashboard" && (
        <div className="dashboard-content">
          <div className="workspace-hero">
            <h1 className="hero-title">Admin Database Control Center</h1>
            <p className="hero-subtitle">
              Active Target: <strong>{activeDb}</strong> &bull; Superadmin Privileges &bull; DDL & DML operations enabled.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="metrics-grid">
            <GlassCard padding="default" className="metric-card">
              <div className="metric-icon-badge metric-icon-badge--purple">
                <ShieldCheck size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-label">Security Role</span>
                <span className="metric-value">Superadmin</span>
                <span className="metric-caption">All Privileges Unlocked</span>
              </div>
            </GlassCard>

            <GlassCard padding="default" className="metric-card">
              <div className="metric-icon-badge metric-icon-badge--blue">
                <Database size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-label">Target DB</span>
                <span className="metric-value" title={activeDb}>{activeDb}</span>
                <span className="metric-caption">{currentDbDetails?.engine} &bull; {currentDbDetails?.host}</span>
              </div>
            </GlassCard>

            <GlassCard padding="default" className="metric-card">
              <div className="metric-icon-badge metric-icon-badge--green">
                <Layers size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-label">Connection Pool</span>
                <span className="metric-value">Admin & Write</span>
                <span className="metric-caption">Pool: ai_sql_admin</span>
              </div>
            </GlassCard>

            <GlassCard padding="default" className="metric-card">
              <div className="metric-icon-badge metric-icon-badge--orange">
                <Activity size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-label">Safety AST Guard</span>
                <span className="metric-value">Active</span>
                <span className="metric-caption">AST Parser & Validator</span>
              </div>
            </GlassCard>
          </div>

          {/* Quick Launchpad to AI Chatbot */}
          <GlassCard padding="large" className="chat-launchpad-card">
            <div className="launchpad-info">
              <div className="launchpad-sparkle">
                <Sparkles size={24} />
              </div>
              <div>
                <h2>Launch AI SQL Assistant</h2>
                <p>Convert complex administrative database tasks and queries into verified MySQL in real-time.</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setActiveTab("chat")}
            >
              Open AI SQL Chat
            </Button>
          </GlassCard>

          {/* Complete Database Tables Overview */}
          <TablesOverview onTableAction={(target) => setActiveTab(target === "settings" ? "settings" : "schema")} />
        </div>
      )}

      {/* 3. Schema Explorer */}
      {activeTab === "schema" && <SchemaExplorer />}

      {/* 4. Query History */}
      {activeTab === "history" && (
        <QueryHistory
          onRunInChat={(question) => {
            setChatQuestion(question);
            setActiveTab("chat");
          }}
        />
      )}

      {/* 5. Database Settings & Theme Mode */}
      {activeTab === "settings" && <DatabaseSettings />}
    </AppLayout>
  );
}
