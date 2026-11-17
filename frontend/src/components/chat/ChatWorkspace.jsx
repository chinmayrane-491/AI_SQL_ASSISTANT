import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Play,
  Copy,
  Check,
  AlertTriangle,
  Database,
  Terminal,
  Table as TableIcon,
  ShieldAlert,
  Bot,
  User,
  RotateCcw,
  Calendar,
} from "lucide-react";
import GlassCard from "../common/GlassCard";
import Button from "../common/Button";
import apiClient from "../../services/api";
import { useDatabase } from "../../context/DatabaseContext";
import { useAuth } from "../../context/AuthContext";
import { addQueryHistoryEntry } from "../../services/history.service";
import "./ChatWorkspace.css";

const ROLE_SUGGESTIONS = {
  admin: [
    "Show all database tables",
    "List all customers with their total orders",
    "Show order counts grouped by status",
    "Find customers who haven't placed any orders",
  ],
  writer: [
    "Show all customers",
    "List recent orders placed this week",
    "Find customer by email address",
    "Count total products in stock",
  ],
  reader: [
    "Show all customers",
    "List top 5 products by price",
    "Total orders placed this month",
    "Show average order amount",
  ],
};

const getInitialWelcomeMessage = (role, activeDb) => ({
  id: "welcome",
  type: "assistant",
  displayedText: `Hello! I am AI_SQL_BOT configured for ${role.toUpperCase()} access on database "${activeDb}". Ask any question in natural language and I will convert it into verified, secure SQL.`,
  fullText: `Hello! I am AI_SQL_BOT configured for ${role.toUpperCase()} access on database "${activeDb}". Ask any question in natural language and I will convert it into verified, secure SQL.`,
  isTyping: false,
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  date: new Date().toISOString().split("T")[0],
});

export default function ChatWorkspace({ role = "reader", initialQuestion = "" }) {
  const { activeDb } = useDatabase();
  const { user } = useAuth();
  const storageKey = `ai_sql_chat_v2_${activeDb}_${role}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load stored chat history:", e);
    }
    return [getInitialWelcomeMessage(role, activeDb)];
  });

  const [inputQuestion, setInputQuestion] = useState(initialQuestion || "");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Safety Confirmation Modal state for DML/DDL operations
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    sql: "",
    operationType: "",
    dangerLevel: "moderate",
    typedConfirm: "",
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // If initialQuestion changes externally (e.g. from Query History click), populate input
  useEffect(() => {
    if (initialQuestion) {
      setInputQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  // Reload messages when target database or role changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load chat history on DB change:", e);
    }
    setMessages([getInitialWelcomeMessage(role, activeDb)]);
  }, [storageKey, activeDb, role]);

  // Persist messages whenever updated and not currently streaming
  useEffect(() => {
    try {
      const sanitized = messages.map((m) => ({
        ...m,
        isTyping: false,
        displayedText: m.fullText || m.displayedText,
      }));
      localStorage.setItem(storageKey, JSON.stringify(sanitized));
    } catch (e) {
      console.error("Failed to save chat to localStorage:", e);
    }
  }, [messages, storageKey]);

  // Clear chat handler
  const handleClearChat = () => {
    if (window.confirm("Do you want to reset this chat conversation?")) {
      const welcome = [getInitialWelcomeMessage(role, activeDb)];
      setMessages(welcome);
      localStorage.setItem(storageKey, JSON.stringify(welcome));
    }
  };

  const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.reader;

  const handleCopySQL = (id, sql) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Typewriter streaming simulation for bot response
  const streamBotResponse = (aiMsgData, originalQuery) => {
    const messageId = `ai_${Date.now()}`;
    const fullText = aiMsgData.text || "Query processed successfully.";
    const today = new Date().toISOString().split("T")[0];

    // Record into Query Execution History in real time
    if (aiMsgData.sql) {
      addQueryHistoryEntry({
        question: originalQuery || "Natural Language Query",
        sql: aiMsgData.sql,
        database: activeDb,
        role: role,
        rowCount: aiMsgData.rowCount || 0,
        status: aiMsgData.isError ? "blocked" : "success",
      });
    }

    const completeMsg = {
      id: messageId,
      type: "assistant",
      displayedText: fullText,
      fullText: fullText,
      sql: aiMsgData.sql,
      operation: aiMsgData.operation,
      requiresConfirmation: aiMsgData.requiresConfirmation || false,
      dangerLevel: aiMsgData.dangerLevel || "moderate",
      executionResult: aiMsgData.executionResult || null,
      rowCount: aiMsgData.rowCount,
      rows: aiMsgData.rows,
      tables: aiMsgData.tables,
      isTyping: false,
      isError: aiMsgData.isError,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: today,
    };

    // Immediately persist to localStorage so even if user switches tab right now, answer is never lost
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const withoutIncomplete = saved.filter((m) => m.id !== messageId);
      localStorage.setItem(storageKey, JSON.stringify([...withoutIncomplete, completeMsg]));
    } catch (e) {
      console.error("Immediate persist error:", e);
    }

    // Insert message with empty displayed text and isTyping = true
    setMessages((prev) => [
      ...prev,
      {
        ...completeMsg,
        displayedText: "",
        isTyping: true,
      },
    ]);

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      currentIndex += 3; // Smooth 3 chars per tick
      if (currentIndex >= fullText.length) {
        clearInterval(typingInterval);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, displayedText: fullText, isTyping: false }
              : m
          )
        );
      } else {
        const partial = fullText.slice(0, currentIndex);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, displayedText: partial } : m
          )
        );
      }
    }, 16);
  };

  const handleSend = async (questionText = inputQuestion) => {
    const query = questionText.trim();
    if (!query || loading) return;

    const today = new Date().toISOString().split("T")[0];
    const userMessageId = `user_${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      type: "user",
      displayedText: query,
      fullText: query,
      isTyping: false,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: today,
    };

    // Immediately persist user message
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      localStorage.setItem(storageKey, JSON.stringify([...saved, userMsg]));
    } catch (e) {
      console.error("Immediate userMsg persist error:", e);
    }

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setLoading(true);

    try {
      // Call backend /api/ask endpoint with database and role
      const response = await apiClient.post("/ask", { question: query, database: activeDb, role: role });

      if (response.data && response.data.success) {
        const result = response.data.data;
        if (response.data.requiresConfirmation) {
          streamBotResponse(
            {
              text: `⚠️ Safety Notice: This ${result.operation} query modifies database state on "${activeDb}". Confirmation is required before running this query.`,
              sql: result.sql,
              operation: result.operation,
              requiresConfirmation: true,
              dangerLevel: result.dangerLevel || "moderate",
            },
            query
          );
        } else {
          // Record successful safe query into query history
          addQueryHistoryEntry({
            question: query,
            sql: result.sql,
            database: activeDb,
            role: role,
            userEmail: user?.email || `${role}@aisql.com`,
            userName: user?.displayName || role,
            rowCount: result.rowCount || 0,
            operation: result.operation || "SELECT",
            status: "success",
          });

          streamBotResponse(
            {
              text: result.explanation || "Query generated and executed successfully against active database.",
              sql: result.sql,
              rowCount: result.rowCount,
              rows: result.rows,
              tables: result.tables,
            },
            query
          );
        }
      } else {
        streamBotResponse(
          {
            isError: true,
            text: response.data?.message || "The query was rejected or could not be executed safely.",
          },
          query
        );
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to process query safely.";
      streamBotResponse(
        {
          isError: true,
          text: `Error: ${errMsg}`,
        },
        query
      );
    } finally {
      setLoading(false);
    }
  };

  const [executingMsgId, setExecutingMsgId] = useState(null);

  // Confirm and execute destructive query
  const handleConfirmExecution = async (msg) => {
    setExecutingMsgId(msg.id);
    try {
      const res = await apiClient.post("/execute-confirmed", {
        sql: msg.sql,
        operation: msg.operation,
        database: activeDb,
        role: role,
        confirmed: true,
      });

      const messageText = res.data?.message || `Successfully executed ${msg.operation} query.`;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? {
              ...m,
              requiresConfirmation: false,
              executionResult: messageText,
            }
            : m
        )
      );

      // Record into query history
      addQueryHistoryEntry({
        question: `[Confirmed ${msg.operation}] ${msg.sql}`,
        sql: msg.sql,
        database: activeDb,
        role: role,
        userEmail: user?.email || `${role}@aisql.com`,
        userName: user?.displayName || role,
        rowCount: res.data?.data?.affectedRows || 0,
        operation: msg.operation,
        status: "success",
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to execute confirmed query.");
    } finally {
      setExecutingMsgId(null);
    }
  };

  // Cancel destructive query
  const handleCancelExecution = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
            ...m,
            requiresConfirmation: false,
            executionResult: "Operation cancelled by user.",
          }
          : m
      )
    );
  };

  const handleExecuteSQL = (sql) => {
    const trimmed = sql.trim().toLowerCase();
    const isDestructive = trimmed.startsWith("drop") || trimmed.startsWith("truncate");
    const isWrite = trimmed.startsWith("delete") || trimmed.startsWith("update") || trimmed.startsWith("insert");

    if (isDestructive) {
      setConfirmModal({
        isOpen: true,
        sql,
        operationType: trimmed.split(" ")[0].toUpperCase(),
        dangerLevel: "high",
        typedConfirm: "",
      });
      return;
    }

    if (isWrite) {
      setConfirmModal({
        isOpen: true,
        sql,
        operationType: trimmed.split(" ")[0].toUpperCase(),
        dangerLevel: "moderate",
        typedConfirm: "",
      });
      return;
    }

    alert(`Executing safe query on [${activeDb}]:\n${sql}`);
  };

  // Helper to format date labels
  const getDateLabel = (dateStr) => {
    if (!dateStr) return "Today";
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="chat-workspace">
      {/* Workspace Top Toolbar */}
      <div className="chat-top-bar">
        <div className="chat-bot-status-indicator">
          <span className="bot-pulse-dot" />
          <span className="bot-title-text">AI_SQL_BOT</span>
          <span className="bot-model-pill">Gemini &bull; {activeDb}</span>
        </div>

        <div className="chat-top-actions">
          <button
            type="button"
            onClick={handleClearChat}
            className="chat-clear-btn"
            title="Reset conversation"
          >
            <RotateCcw size={12} />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Messages stream */}
      <div className="chat-messages-container">
        {messages.map((msg, index) => {
          // Check if date divider is needed
          const prevMsg = messages[index - 1];
          const showDateDivider = !prevMsg || prevMsg.date !== msg.date;

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && msg.date && (
                <div className="chat-date-divider">
                  <div className="chat-date-divider-pill">
                    <Calendar size={11} />
                    <span>{getDateLabel(msg.date)}</span>
                  </div>
                </div>
              )}

              <div
                className={`chat-bubble-row ${msg.type === "user" ? "chat-bubble-row--user" : "chat-bubble-row--assistant"
                  }`}
              >
                {msg.type === "assistant" && (
                  <div className={`assistant-avatar ${msg.isTyping ? "assistant-avatar--typing" : ""}`}>
                    <Sparkles size={16} />
                  </div>
                )}

                <div
                  className={`chat-bubble ${msg.type === "user" ? "chat-bubble--user" : "chat-bubble--assistant"
                    } ${msg.isError ? "chat-bubble--error" : ""}`}
                >
                  {/* Assistant Header Badge */}
                  {msg.type === "assistant" && (
                    <div className="assistant-bubble-header">
                      <span className="assistant-bot-title">AI_SQL_BOT</span>
                      <span className="assistant-db-tag">{activeDb}</span>
                      {msg.isTyping ? (
                        <span className="bot-typing-badge">
                          <span className="typing-live-dot" />
                          typing...
                        </span>
                      ) : (
                        <span className="bubble-timestamp-inline">{msg.timestamp}</span>
                      )}
                    </div>
                  )}

                  <div className="bubble-text-content">
                    <span className="bubble-text">{msg.displayedText}</span>
                    {msg.isTyping && <span className="typewriter-cursor" />}
                  </div>

                  {/* Show SQL code block once typing is done or available */}
                  {!msg.isTyping && msg.sql && (
                    <div className="sql-preview-card fade-in-up">
                      <div className="sql-header">
                        <div className="sql-header-title">
                          <Terminal size={14} className="sql-icon" />
                          <span>Generated SQL &bull; {activeDb}</span>
                        </div>
                        <div className="sql-actions">
                          <button
                            type="button"
                            onClick={() => handleCopySQL(msg.id, msg.sql)}
                            className="sql-action-btn"
                            title="Copy SQL"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={14} className="copied-icon" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExecuteSQL(msg.sql)}
                            className="sql-action-btn sql-action-btn--execute"
                            title="Execute Query"
                          >
                            <Play size={14} />
                            <span>Execute</span>
                          </button>
                        </div>
                      </div>

                      <pre className="sql-code-block">
                        <code>{msg.sql}</code>
                      </pre>
                    </div>
                  )}

                  {/* Destructive Query Confirmation Card */}
                  {!msg.isTyping && msg.requiresConfirmation && !msg.executionResult && (
                    <div className="destructive-confirmation-card fade-in-up">
                      <div className="destructive-confirmation-header">
                        <AlertTriangle size={20} className="destructive-icon" />
                        <div>
                          <h4 className="destructive-title">
                            ⚠️ Confirmation Required to Run {msg.operation}
                          </h4>
                          <p className="destructive-desc">
                            This query will alter or remove records in database <strong>{activeDb}</strong>. Confirmation is required before running this query.
                          </p>
                        </div>
                      </div>

                      <div className="destructive-actions">
                        <Button
                          variant={msg.dangerLevel === "high" ? "danger" : "primary"}
                          size="sm"
                          icon={Play}
                          loading={executingMsgId === msg.id}
                          onClick={() => handleConfirmExecution(msg)}
                        >
                          Confirm &amp; Run {msg.operation}
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          disabled={executingMsgId === msg.id}
                          onClick={() => handleCancelExecution(msg.id)}
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Execution Feedback Banner */}
                  {!msg.isTyping && msg.executionResult && (
                    <div className="execution-success-banner fade-in-up">
                      <Check size={16} className="execution-success-icon" />
                      <span>{msg.executionResult}</span>
                    </div>
                  )}

                  {/* Query Results Table if available */}
                  {!msg.isTyping && msg.rows && msg.rows.length > 0 && (
                    <div className="results-table-card fade-in-up">
                      <div className="results-header">
                        <div className="results-title">
                          <TableIcon size={14} />
                          <span>Query Results ({activeDb})</span>
                        </div>
                        <span className="results-count-badge">
                          {msg.rowCount || msg.rows.length} rows returned
                        </span>
                      </div>

                      <div className="results-table-wrapper">
                        <table className="results-table">
                          <thead>
                            <tr>
                              {Object.keys(msg.rows[0]).map((col) => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.rows.map((row, i) => (
                              <tr key={i}>
                                {Object.values(row).map((val, cellIdx) => (
                                  <td key={cellIdx}>{String(val)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {msg.type === "user" && (
                    <div className="user-bubble-footer">
                      <span className="bubble-timestamp">{msg.timestamp}</span>
                      {(!messages[index + 1] || messages[index + 1].type !== "assistant") && !loading && (
                        <button
                          type="button"
                          className="retry-question-btn"
                          onClick={() => handleSend(msg.fullText || msg.displayedText)}
                          title="Generate answer for this question"
                        >
                          <Sparkles size={11} />
                          <span>Generate SQL Answer</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {msg.type === "user" && (
                  <div className="user-message-avatar">
                    <User size={15} />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* AI_SQL_BOT Typing Indicator */}
        {loading && (
          <div className="chat-bubble-row chat-bubble-row--assistant fade-in-up">
            <div className="assistant-avatar assistant-avatar--typing">
              <Sparkles size={16} />
            </div>
            <div className="chat-bubble chat-bubble--assistant chat-bubble--typing-card">
              <div className="typing-header">
                <span className="typing-bot-name">AI_SQL_BOT</span>
                <span className="typing-badge">
                  <span className="typing-live-dot" />
                  typing...
                </span>
              </div>
              <div className="typing-body">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="typing-label">
                  AI_SQL_BOT is analyzing schema &amp; generating SQL for <code>{activeDb}</code>...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div className="suggestions-container">
        <span className="suggestions-label">Suggestions:</span>
        <div className="suggestions-scroll">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(suggestion)}
              className="suggestion-pill"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="chat-input-wrapper">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="chat-input-form"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={`Ask any question about "${activeDb}" in natural language...`}
            className="chat-input-field"
            disabled={loading}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={!inputQuestion.trim()}
            icon={Send}
            className="chat-send-btn"
          >
            Send
          </Button>
        </form>
      </div>

      {/* Confirmation Modal for DML/DDL Safety */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <GlassCard padding="large" className="confirm-modal-card">
            <div className="modal-header">
              <div className={`modal-icon-badge modal-icon-badge--${confirmModal.dangerLevel}`}>
                {confirmModal.dangerLevel === "high" ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
              </div>
              <h3 className="modal-title">
                {confirmModal.dangerLevel === "high" ? "High Risk DDL Operation" : "Confirm Data Modification"}
              </h3>
            </div>

            <p className="modal-desc">
              You are about to execute a <strong>{confirmModal.operationType}</strong> query on database <strong>{activeDb}</strong>.
              {confirmModal.dangerLevel === "high" && " This action will alter or drop schema structures and cannot be undone."}
            </p>

            <div className="modal-sql-box">
              <code>{confirmModal.sql}</code>
            </div>

            {confirmModal.dangerLevel === "high" && (
              <div className="danger-confirm-input">
                <label>Type <strong>CONFIRM</strong> to proceed:</label>
                <input
                  type="text"
                  value={confirmModal.typedConfirm}
                  onChange={(e) => setConfirmModal((prev) => ({ ...prev, typedConfirm: e.target.value }))}
                  placeholder="CONFIRM"
                  className="input-field"
                />
              </div>
            )}

            <div className="modal-footer-actions">
              <Button
                variant="glass"
                size="md"
                onClick={() => setConfirmModal({ isOpen: false, sql: "", operationType: "", dangerLevel: "moderate", typedConfirm: "" })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={confirmModal.dangerLevel === "high" && confirmModal.typedConfirm !== "CONFIRM"}
                onClick={async () => {
                  try {
                    const res = await apiClient.post("/execute-confirmed", {
                      sql: confirmModal.sql,
                      operation: confirmModal.operationType,
                      database: activeDb,
                      role: role,
                      confirmed: true,
                    });
                    alert(res.data?.message || `Successfully executed ${confirmModal.operationType} query.`);
                  } catch (err) {
                    alert(err.response?.data?.message || err.message || "Failed to execute query.");
                  } finally {
                    setConfirmModal({ isOpen: false, sql: "", operationType: "", dangerLevel: "moderate", typedConfirm: "" });
                  }
                }}
              >
                Execute {confirmModal.operationType}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
