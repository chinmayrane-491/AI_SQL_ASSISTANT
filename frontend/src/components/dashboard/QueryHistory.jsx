import React, { useState, useEffect } from "react";
import {
  History,
  Terminal,
  Search,
  Copy,
  Check,
  Play,
  Trash2,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Database,
  Filter,
  Sparkles,
  Shield,
  User,
} from "lucide-react";
import GlassCard from "../common/GlassCard";
import Button from "../common/Button";
import { getQueryHistory, clearQueryHistory } from "../../services/history.service";
import { useDatabase } from "../../context/DatabaseContext";
import { useAuth } from "../../context/AuthContext";
import "./QueryHistory.css";

export default function QueryHistory({ onRunInChat }) {
  const { activeDb } = useDatabase();
  const { user } = useAuth();
  const currentRole = (user?.role || "reader").toLowerCase();

  const [historyItems, setHistoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("ALL");
  const [selectedDb, setSelectedDb] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = () => {
    // getQueryHistory automatically isolates reader/writer to only their queries, and gives admin all queries
    const items = getQueryHistory(user);
    setHistoryItems(items);
  };

  const handleCopy = (id, sql) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your query execution history?")) {
      clearQueryHistory();
      setHistoryItems([]);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(historyItems, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai_sql_query_history_${currentRole}_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter items based on search query, operation, db, and admin role selector
  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sql.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesOp =
      selectedOperation === "ALL" ||
      item.operation.toUpperCase() === selectedOperation.toUpperCase();

    const matchesDb = selectedDb === "ALL" || item.database === selectedDb;

    const matchesRole =
      currentRole !== "admin" ||
      selectedRoleFilter === "ALL" ||
      (item.role || "reader").toLowerCase() === selectedRoleFilter.toLowerCase();

    return matchesSearch && matchesOp && matchesDb && matchesRole;
  });

  // Group items day-wise
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const groupedHistory = filteredItems.reduce((acc, item) => {
    let groupKey = "Earlier";
    if (item.date === todayStr) {
      groupKey = "Today";
    } else if (item.date === yesterdayDate) {
      groupKey = "Yesterday";
    } else if (item.date) {
      try {
        const d = new Date(item.date);
        groupKey = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      } catch {
        groupKey = "Earlier";
      }
    }

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});

  // Metrics
  const totalCount = historyItems.length;
  const successCount = historyItems.filter((i) => i.status === "success").length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;
  const avgLatency =
    totalCount > 0
      ? Math.round(
          historyItems.reduce((acc, curr) => acc + (curr.executionTimeMs || 30), 0) / totalCount
        )
      : 35;

  return (
    <div className="query-history-page">
      {/* Top Header & Metrics */}
      <div className="history-header-row">
        <div>
          <h1 className="history-main-title">
            {currentRole === "admin"
              ? "Enterprise Audit Log (All Roles)"
              : `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Query History`}
          </h1>
          <p className="history-subtitle">
            {currentRole === "admin" ? (
              <>
                Administrator audit trail displaying <strong>all SQL queries</strong> across Reader, Writer, and Admin workspaces on <strong>{activeDb}</strong>.
              </>
            ) : currentRole === "writer" ? (
              <>
                Audited query history for <strong>{user?.email || "Writer User"}</strong> (Permitted: SELECT, INSERT, UPDATE, DELETE).
              </>
            ) : (
              <>
                Audited query history for <strong>{user?.email || "Reader User"}</strong> (Permitted: Strict Read-Only SELECT).
              </>
            )}
          </p>
        </div>

        <div className="history-actions-row">
          <Button variant="glass" size="sm" icon={Download} onClick={handleExport} disabled={totalCount === 0}>
            Export JSON
          </Button>
          <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClear} disabled={totalCount === 0} className="clear-history-btn">
            Clear History
          </Button>
        </div>
      </div>

      {/* Admin Privilege Banner with Role Switch Filter */}
      {currentRole === "admin" && (
        <div className="admin-role-filter-banner fade-in-up">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} color="#7C3AED" />
            <span>
              <strong>Admin Privilege Mode:</strong> You can see all executions across every user role. Filter by role:
            </span>
          </div>

          <div className="role-filter-pills">
            {[
              { id: "ALL", label: "All Roles" },
              { id: "READER", label: "📖 Reader Queries" },
              { id: "WRITER", label: "✍️ Writer Queries" },
              { id: "ADMIN", label: "👑 Admin Queries" },
            ].map((rf) => (
              <button
                key={rf.id}
                type="button"
                className={`filter-pill ${selectedRoleFilter === rf.id ? "filter-pill--active" : ""}`}
                onClick={() => setSelectedRoleFilter(rf.id)}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="history-metrics-bar">
        <GlassCard padding="small" className="hist-metric-card">
          <div className="hist-metric-icon hist-metric-icon--blue">
            <History size={18} />
          </div>
          <div>
            <span className="hist-metric-lbl">Total Executions</span>
            <span className="hist-metric-val">{totalCount}</span>
          </div>
        </GlassCard>

        <GlassCard padding="small" className="hist-metric-card">
          <div className="hist-metric-icon hist-metric-icon--green">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="hist-metric-lbl">Success Rate</span>
            <span className="hist-metric-val">{successRate}%</span>
          </div>
        </GlassCard>

        <GlassCard padding="small" className="hist-metric-card">
          <div className="hist-metric-icon hist-metric-icon--purple">
            <Clock size={18} />
          </div>
          <div>
            <span className="hist-metric-lbl">Avg Response Time</span>
            <span className="hist-metric-val">{avgLatency}ms</span>
          </div>
        </GlassCard>

        <GlassCard padding="small" className="hist-metric-card">
          <div className="hist-metric-icon hist-metric-icon--amber">
            <Database size={18} />
          </div>
          <div>
            <span className="hist-metric-lbl">Target Database</span>
            <span className="hist-metric-val hist-metric-val--db">{activeDb}</span>
          </div>
        </GlassCard>
      </div>

      {/* Search & Filter Toolbar */}
      <GlassCard padding="small" className="history-toolbar-card">
        <div className="toolbar-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search questions, SQL commands, or user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="toolbar-filters-group">
          {/* Operation Filter Pills */}
          <div className="filter-pills-row">
            {["ALL", "SELECT", "SHOW", "INSERT", "UPDATE", "DELETE"].map((op) => (
              <button
                key={op}
                type="button"
                className={`filter-pill ${selectedOperation === op ? "filter-pill--active" : ""}`}
                onClick={() => setSelectedOperation(op)}
              >
                {op}
              </button>
            ))}
          </div>

          {/* Database Selector Pill */}
          <select
            className="history-db-filter-select"
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value)}
          >
            <option value="ALL">All Databases</option>
            <option value="ai_sql_assistant">ai_sql_assistant</option>
            <option value="ai_sql_warehouse">ai_sql_warehouse</option>
          </select>
        </div>
      </GlassCard>

      {/* Day-Wise Grouped Query History List */}
      <div className="history-timeline-container">
        {Object.keys(groupedHistory).length === 0 ? (
          <GlassCard padding="large" className="empty-history-card">
            <Terminal size={36} className="empty-icon" />
            <h3>No Queries Found for {currentRole.toUpperCase()}</h3>
            <p>
              {searchQuery
                ? `No execution records match "${searchQuery}". Try adjusting your filters.`
                : currentRole === "admin"
                ? "No queries have been executed across workspaces yet. Ask questions in AI SQL Chat to record history."
                : `You haven't run any queries as ${currentRole.toUpperCase()} yet. Ask questions in the AI SQL Chat tab to generate and execute queries.`}
            </p>
          </GlassCard>
        ) : (
          Object.entries(groupedHistory).map(([dayLabel, items]) => (
            <div key={dayLabel} className="history-day-section">
              {/* Day Header Badge */}
              <div className="day-divider-pill">
                <Calendar size={13} />
                <span>{dayLabel}</span>
                <span className="day-count-badge">
                  {items.length} {items.length === 1 ? "query" : "queries"}
                </span>
              </div>

              {/* Items in this day */}
              <div className="history-cards-list">
                {items.map((item) => {
                  const itemRole = (item.role || "reader").toLowerCase();
                  return (
                    <GlassCard key={item.id} padding="default" className="history-item-card">
                      <div className="history-item-header">
                        <div className="question-info">
                          <div className="question-sparkle">
                            <Sparkles size={16} />
                          </div>
                          <h3 className="history-question-text">{item.question}</h3>
                        </div>

                        <div className="history-badges-row">
                          {/* Role Badge */}
                          <span className={`role-tag role-tag--${itemRole}`}>
                            {itemRole === "admin" ? "👑 Admin" : itemRole === "writer" ? "✍️ Writer" : "📖 Reader"}
                          </span>

                          <span className={`op-tag op-tag--${(item.operation || "select").toLowerCase()}`}>
                            {item.operation || "SELECT"}
                          </span>

                          <span className="db-tag">
                            <Database size={11} />
                            {item.database}
                          </span>

                          <span className={`status-tag status-tag--${item.status}`}>
                            {item.status === "success" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* SQL Preview Box */}
                      <div className="history-sql-box">
                        <code>{item.sql}</code>
                      </div>

                      {/* Card Footer: Metadata & Quick Actions */}
                      <div className="history-item-footer">
                        <div className="footer-meta">
                          <span className="meta-time">
                            <Clock size={12} />
                            {item.timestamp}
                          </span>
                          <span className="meta-dot">&bull;</span>
                          <span className="meta-latency">{item.executionTimeMs || 42}ms execution</span>
                          <span className="meta-dot">&bull;</span>
                          <span className="meta-rows">{item.rowCount || 0} rows</span>
                          <span className="meta-dot">&bull;</span>
                          <span className="user-tag" title="Executed By">
                            <User size={11} />
                            {item.userEmail || `${itemRole}@aisql.com`}
                          </span>
                        </div>

                        <div className="footer-actions">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.sql)}
                            className="action-link-btn"
                            title="Copy SQL"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check size={14} className="copied-icon" />
                                <span className="copied-text">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copy SQL</span>
                              </>
                            )}
                          </button>

                          {onRunInChat && (
                            <button
                              type="button"
                              onClick={() => onRunInChat(item.question)}
                              className="action-link-btn action-link-btn--primary"
                              title="Run again in AI Chat"
                            >
                              <Play size={13} />
                              <span>Ask in Chat</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
