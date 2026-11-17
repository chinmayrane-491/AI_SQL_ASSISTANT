import React, { useState } from "react";
import {
  FileEdit,
  Database,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  Table as TableIcon,
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

export default function WriterDashboard() {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatQuestion, setChatQuestion] = useState("");
  const { activeDb, currentDbDetails } = useDatabase();

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* 1. Dedicated AI SQL Chat Workspace - Kept mounted so background responses & tab switches are never lost */}
      <div style={{ display: activeTab === "chat" ? "flex" : "none", flex: 1, height: "100%", minHeight: 0, flexDirection: "column" }}>
        <ChatWorkspace role="writer" initialQuestion={chatQuestion} />
      </div>

      {/* 2. Executive Dashboard Overview */}
      {activeTab === "dashboard" && (
        <div className="dashboard-content">
          <div className="workspace-hero">
            <h1 className="hero-title">Writer Data Operations Workspace</h1>
            <p className="hero-subtitle">
              Active Target: <strong>{activeDb}</strong> &bull; Insert, Update, and Delete permitted &bull; DDL operations strictly protected.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="metrics-grid">
            <GlassCard padding="default" className="metric-card">
              <div className="metric-icon-badge metric-icon-badge--blue">
                <FileEdit size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-label">Assigned Role</span>
                <span className="metric-value">Writer</span>
                <span className="metric-caption">DML Records Authorization</span>
              </div>
            </GlassCard>

            <GlassCard padding="default" className="metric-card">
              <div className="metric-icon-badge metric-icon-badge--green">
                <Database size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-label">DB Access Pool</span>
                <span className="metric-value" title={activeDb}>{activeDb}</span>
                <span className="metric-caption">Pool: ai_sql_writer</span>
              </div>
            </GlassCard>

            <GlassCard padding="default" className="metric-card">
              <div className="metric-icon-badge metric-icon-badge--orange">
                <Shield size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-label">DDL Policy</span>
                <span className="metric-value">Restricted</span>
                <span className="metric-caption">DROP & TRUNCATE Blocked</span>
              </div>
            </GlassCard>

            <GlassCard padding="default" className="metric-card">
              <div className="metric-icon-badge metric-icon-badge--purple">
                <Activity size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-label">Safety Guard</span>
                <span className="metric-value">Active</span>
                <span className="metric-caption">Unsafe WHERE Blocked</span>
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
                <p>Generate, verify, and execute safe DML updates, inserts, and record queries.</p>
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
