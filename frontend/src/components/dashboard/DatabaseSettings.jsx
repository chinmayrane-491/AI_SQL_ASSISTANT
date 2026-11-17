import React, { useState } from "react";
import {
  Database,
  CheckCircle2,
  Server,
  Layers,
  Moon,
  Sun,
  Shield,
  Clock,
  Plus,
  Table as TableIcon,
  Trash2,
  Play,
  Terminal,
  Code,
  Sparkles,
  X,
  AlertCircle,
} from "lucide-react";
import GlassCard from "../common/GlassCard";
import Button from "../common/Button";
import { useDatabase } from "../../context/DatabaseContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./DatabaseSettings.css";

const DATA_TYPES = [
  "INT",
  "BIGINT",
  "VARCHAR(255)",
  "VARCHAR(100)",
  "VARCHAR(50)",
  "TEXT",
  "DECIMAL(10,2)",
  "DECIMAL(15,2)",
  "DATETIME",
  "TIMESTAMP",
  "BOOLEAN",
  "FLOAT",
];

export default function DatabaseSettings() {
  const { databases, activeDb, selectDatabase, createDatabase, deleteDatabase, createTable } = useDatabase();
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const isAdmin = user?.role === "admin";

  // Toast feedback
  const [successToast, setSuccessToast] = useState("");
  const [errorToast, setErrorToast] = useState("");

  // Delete DB state (Admin only)
  const [dbToDelete, setDbToDelete] = useState(null);
  const [isDeletingDb, setIsDeletingDb] = useState(false);

  // Create Database State
  const [showCreateDbModal, setShowCreateDbModal] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [newDbDisplayName, setNewDbDisplayName] = useState("");
  const [newDbDesc, setNewDbDesc] = useState("");
  const [creatingDb, setCreatingDb] = useState(false);

  // Create Table State
  const [targetDbForTable, setTargetDbForTable] = useState(activeDb);
  const [newTableName, setNewTableName] = useState("");
  const [builderMode, setBuilderMode] = useState("visual"); // "visual" | "sql"
  const [columns, setColumns] = useState([
    { name: "id", type: "INT", isPrimaryKey: true, autoIncrement: true, nullable: false },
    { name: "name", type: "VARCHAR(255)", isPrimaryKey: false, autoIncrement: false, nullable: false },
    { name: "created_at", type: "DATETIME", isPrimaryKey: false, autoIncrement: false, nullable: false },
  ]);
  const [rawSql, setRawSql] = useState("");
  const [creatingTable, setCreatingTable] = useState(false);

  // Switch Active DB
  const handleSelectDb = (dbName) => {
    selectDatabase(dbName);
    setTargetDbForTable(dbName);
    setSuccessToast(`Active database switched to "${dbName}". All SQL queries will now execute on this database.`);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  // Submit Create Database
  const handleCreateDatabase = async (e) => {
    e.preventDefault();
    if (!newDbName.trim()) {
      setErrorToast("Database name is required.");
      return;
    }

    setCreatingDb(true);
    setErrorToast("");

    try {
      const cleanName = newDbName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
      await createDatabase(cleanName, newDbDisplayName, newDbDesc);
      setShowCreateDbModal(false);
      setNewDbName("");
      setNewDbDisplayName("");
      setNewDbDesc("");
      setTargetDbForTable(cleanName);
      setSuccessToast(`Database "${cleanName}" created successfully and set as active target!`);
      setTimeout(() => setSuccessToast(""), 5000);
    } catch (err) {
      setErrorToast(err.message || "Failed to create database.");
    } finally {
      setCreatingDb(false);
    }
  };

  // Admin Only: Permanently drop database
  const handleConfirmDeleteDb = async () => {
    if (!dbToDelete) return;
    setIsDeletingDb(true);
    setErrorToast("");
    try {
      await deleteDatabase(dbToDelete);
      setSuccessToast(`Database "${dbToDelete}" has been permanently dropped and deleted.`);
      setDbToDelete(null);
      setTimeout(() => setSuccessToast(""), 5000);
    } catch (err) {
      setErrorToast(err.message || "Failed to delete database.");
    } finally {
      setIsDeletingDb(false);
    }
  };

  // Add Column row in Table Builder
  const handleAddColumn = () => {
    setColumns((prev) => [
      ...prev,
      {
        name: `column_${prev.length + 1}`,
        type: "VARCHAR(255)",
        isPrimaryKey: false,
        autoIncrement: false,
        nullable: true,
      },
    ]);
  };

  // Remove Column row
  const handleRemoveColumn = (index) => {
    if (columns.length <= 1) {
      alert("A table must have at least one column.");
      return;
    }
    setColumns((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update specific column field
  const handleColumnChange = (index, field, value) => {
    setColumns((prev) =>
      prev.map((col, idx) => {
        if (idx !== index) return col;
        return { ...col, [field]: value };
      })
    );
  };

  // Compute live SQL preview
  const generateLiveSQL = () => {
    const cleanTable = newTableName.trim() || "table_name";
    const target = targetDbForTable || activeDb;

    const columnDefs = [];
    const pks = [];

    for (const col of columns) {
      const colName = col.name.trim() || "column";
      let def = `  \`${colName}\` ${col.type}`;
      if (!col.nullable) def += " NOT NULL";
      if (col.autoIncrement) def += " AUTO_INCREMENT";
      columnDefs.push(def);
      if (col.isPrimaryKey) {
        pks.push(`\`${colName}\``);
      }
    }

    if (pks.length > 0) {
      columnDefs.push(`  PRIMARY KEY (${pks.join(", ")})`);
    }

    return `CREATE TABLE IF NOT EXISTS \`${target}\`.\`${cleanTable}\` (\n${columnDefs.join(",\n")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  };

  // Submit Create Table
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (builderMode === "visual" && !newTableName.trim()) {
      setErrorToast("Please enter a valid table name.");
      return;
    }

    if (builderMode === "sql" && !rawSql.trim()) {
      setErrorToast("Please enter a valid CREATE TABLE SQL statement.");
      return;
    }

    setCreatingTable(true);
    setErrorToast("");

    try {
      const target = targetDbForTable || activeDb;
      const cleanTable = newTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

      await createTable({
        databaseName: target,
        tableName: cleanTable,
        columns: builderMode === "visual" ? columns : undefined,
        ddlQuery: builderMode === "sql" ? rawSql : undefined,
      });

      setSuccessToast(`Table "${cleanTable || "new_table"}" created successfully in "${target}"!`);
      if (builderMode === "visual") {
        setNewTableName("");
      } else {
        setRawSql("");
      }
      setTimeout(() => setSuccessToast(""), 5000);
    } catch (err) {
      setErrorToast(err.message || "Failed to create table in database.");
    } finally {
      setCreatingTable(false);
    }
  };

  return (
    <div className="settings-page-container">
      {/* Toast Notifications */}
      {successToast && (
        <div className="settings-toast-banner settings-toast-banner--success fade-in-up" role="alert">
          <CheckCircle2 size={18} className="toast-icon" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="settings-toast-banner settings-toast-banner--error fade-in-up" role="alert">
          <AlertCircle size={18} className="toast-icon" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Section 1: Active Database Switcher & Add DB Button */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2 className="settings-section-title">Database Environments & Switching</h2>
            <p className="settings-section-desc">
              Select or create databases connected to your AI SQL Assistant and schema explorer.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setShowCreateDbModal(true)}
            className="create-db-trigger-btn"
          >
            Create New Database
          </Button>
        </div>

        <div className="databases-cards-grid">
          {databases.map((db) => {
            const isSelected = activeDb === db.name;
            return (
              <GlassCard
                key={db.id}
                padding="default"
                className={`db-select-card ${isSelected ? "db-select-card--active" : ""}`}
                onClick={() => handleSelectDb(db.name)}
              >
                <div className="db-card-top">
                  <div className={`db-card-icon-badge ${isSelected ? "db-card-icon-badge--selected" : ""}`}>
                    <Database size={22} />
                  </div>

                  <div className="db-card-status-wrapper">
                    {isSelected ? (
                      <span className="db-active-badge">
                        <CheckCircle2 size={14} />
                        <span>Active Target</span>
                      </span>
                    ) : (
                      <span className="db-inactive-badge">Available</span>
                    )}

                    {isAdmin && db.name !== "ai_sql_assistant" && (
                      <button
                        type="button"
                        className="db-card-delete-icon-btn"
                        title={`Delete database "${db.name}" (Admin Only)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDbToDelete(db.name);
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete DB</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="db-card-info">
                  <h3 className="db-card-title">{db.displayName}</h3>
                  <code className="db-card-tech-name">{db.name}</code>
                  <p className="db-card-desc">{db.description}</p>
                </div>

                <div className="db-card-specs">
                  <div className="spec-item">
                    <Server size={13} />
                    <span>{db.host || "localhost"}:{db.port || 3306}</span>
                  </div>
                  <div className="spec-item">
                    <Layers size={13} />
                    <span>{db.tablesCount ?? 0} Tables</span>
                  </div>
                  <div className="spec-item">
                    <Clock size={13} />
                    <span>MySQL 8.0</span>
                  </div>
                </div>

                <div className="db-card-action">
                  <Button
                    variant={isSelected ? "primary" : "glass"}
                    size="sm"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectDb(db.name);
                    }}
                  >
                    {isSelected ? "Currently Active Target" : "Switch to this Database"}
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Section 2: Manual Table Creator (Schema Builder) */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2 className="settings-section-title">Manual Table Creator & DDL Builder</h2>
            <p className="settings-section-desc">
              Design new tables visually with custom column types or execute direct DDL statements inside your database.
            </p>
          </div>
        </div>

        <GlassCard padding="default" className="table-builder-card">
          <form onSubmit={handleCreateTable} className="table-builder-form">
            {/* Top Config Row */}
            <div className="builder-top-row">
              <div className="builder-field-group">
                <label className="builder-label">Target Database:</label>
                <select
                  value={targetDbForTable}
                  onChange={(e) => setTargetDbForTable(e.target.value)}
                  className="builder-select"
                >
                  {databases.map((db) => (
                    <option key={db.id} value={db.name}>
                      {db.displayName} ({db.name})
                    </option>
                  ))}
                </select>
              </div>

              {builderMode === "visual" && (
                <div className="builder-field-group builder-field-group--flex">
                  <label className="builder-label">New Table Name:</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="e.g. suppliers, inventory, payments"
                    className="builder-input"
                    required
                  />
                </div>
              )}

              {/* Mode Toggle */}
              <div className="builder-mode-toggle">
                <button
                  type="button"
                  className={`mode-tab-btn ${builderMode === "visual" ? "mode-tab-btn--active" : ""}`}
                  onClick={() => setBuilderMode("visual")}
                >
                  <TableIcon size={14} />
                  <span>Visual Builder</span>
                </button>
                <button
                  type="button"
                  className={`mode-tab-btn ${builderMode === "sql" ? "mode-tab-btn--active" : ""}`}
                  onClick={() => {
                    setBuilderMode("sql");
                    if (!rawSql) setRawSql(generateLiveSQL());
                  }}
                >
                  <Code size={14} />
                  <span>Raw DDL SQL</span>
                </button>
              </div>
            </div>

            {/* Visual Column Builder */}
            {builderMode === "visual" ? (
              <div className="columns-builder-section">
                <div className="columns-table-wrapper">
                  <table className="columns-builder-table">
                    <thead>
                      <tr>
                        <th>Column Name</th>
                        <th>Data Type</th>
                        <th title="Primary Key">Primary Key (PK)</th>
                        <th title="Auto Increment">Auto Increment</th>
                        <th title="Allow NULL values">Nullable</th>
                        <th style={{ width: "50px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              value={col.name}
                              onChange={(e) => handleColumnChange(idx, "name", e.target.value)}
                              placeholder="col_name"
                              className="col-input-name"
                              required
                            />
                          </td>
                          <td>
                            <select
                              value={col.type}
                              onChange={(e) => handleColumnChange(idx, "type", e.target.value)}
                              className="col-select-type"
                            >
                              {DATA_TYPES.map((dt) => (
                                <option key={dt} value={dt}>
                                  {dt}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={col.isPrimaryKey}
                              onChange={(e) => handleColumnChange(idx, "isPrimaryKey", e.target.checked)}
                              className="col-checkbox"
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={col.autoIncrement}
                              disabled={!col.type.includes("INT")}
                              onChange={(e) => handleColumnChange(idx, "autoIncrement", e.target.checked)}
                              className="col-checkbox"
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={col.nullable}
                              disabled={col.isPrimaryKey}
                              onChange={(e) => handleColumnChange(idx, "nullable", e.target.checked)}
                              className="col-checkbox"
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(idx)}
                              className="col-remove-btn"
                              title="Delete column"
                              disabled={columns.length === 1}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="builder-add-col-row">
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    icon={Plus}
                    onClick={handleAddColumn}
                  >
                    Add Column
                  </Button>
                </div>

                {/* Live SQL Preview Box */}
                <div className="live-sql-preview">
                  <div className="preview-label">
                    <Terminal size={13} />
                    <span>Live Generated MySQL DDL Statement:</span>
                  </div>
                  <pre className="preview-code-box">
                    <code>{generateLiveSQL()}</code>
                  </pre>
                </div>
              </div>
            ) : (
              /* Raw SQL Mode */
              <div className="raw-sql-section">
                <textarea
                  value={rawSql}
                  onChange={(e) => setRawSql(e.target.value)}
                  placeholder={`CREATE TABLE \`${targetDbForTable}\`.\`my_table\` (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  title VARCHAR(255) NOT NULL\n);`}
                  className="raw-sql-textarea"
                  rows={8}
                  required
                />
              </div>
            )}

            {/* Submit Action */}
            <div className="builder-footer-row">
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Play}
                loading={creatingTable}
              >
                Execute & Create Table in MySQL
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>

      {/* Section 3: Appearance & Theme Mode */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2 className="settings-section-title">Appearance & Color Theme</h2>
            <p className="settings-section-desc">
              Choose between Apple Light Glass or Deep Obsidian Dark Mode.
            </p>
          </div>
        </div>

        <div className="theme-toggle-card-wrapper">
          <GlassCard padding="default" className="theme-settings-card">
            <div className="theme-card-content">
              <div className="theme-icon-box">
                {isDark ? <Moon size={24} className="theme-icon-dark" /> : <Sun size={24} className="theme-icon-light" />}
              </div>
              <div className="theme-text-info">
                <h3>{isDark ? "Obsidian Dark Glass Mode" : "Apple Light Glass Mode"}</h3>
                <p>
                  {isDark
                    ? "Deep contrast OLED theme with subtle glowing specular highlights."
                    : "Clean, frosted glass light theme with high legibility and Apple ergonomics."}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={isDark ? Sun : Moon}
              onClick={toggleTheme}
            >
              Switch to {isDark ? "Light Mode" : "Dark Mode"}
            </Button>
          </GlassCard>
        </div>
      </div>

      {/* Section 4: AST Safety Guard Policy */}
      <div className="settings-section">
        <GlassCard padding="default" className="safety-info-card">
          <div className="safety-icon-wrapper">
            <Shield size={22} />
          </div>
          <div className="safety-info-text">
            <h4>AST Guard & Multi-DB Isolation</h4>
            <p>
              Every SQL statement generated for the active target is parsed into a syntax tree and checked for role compliance before execution. Unsafe WHERE clauses (e.g. <code>1=1</code>) and unauthorized schema modifications are blocked at the engine level.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Modal: Create New Database */}
      {showCreateDbModal && (
        <div className="modal-overlay">
          <GlassCard padding="large" className="create-db-modal-card">
            <div className="modal-header">
              <div className="modal-icon-badge modal-icon-badge--blue">
                <Database size={22} />
              </div>
              <div>
                <h3 className="modal-title">Create New MySQL Database</h3>
                <p className="modal-sub">Create an isolated database and register it as an active target.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateDbModal(false)}
                className="modal-close-icon-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDatabase} className="create-db-form">
              <div className="form-field-group">
                <label>Database Technical Name (MySQL):</label>
                <input
                  type="text"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  placeholder="e.g. ecommerce_db, inventory_store"
                  className="modal-input"
                  required
                />
                <span className="field-hint">Alphanumeric characters and underscores only.</span>
              </div>

              <div className="form-field-group">
                <label>Display Name (Workspace Label):</label>
                <input
                  type="text"
                  value={newDbDisplayName}
                  onChange={(e) => setNewDbDisplayName(e.target.value)}
                  placeholder="e.g. E-Commerce Production Warehouse"
                  className="modal-input"
                />
              </div>

              <div className="form-field-group">
                <label>Description (Optional):</label>
                <textarea
                  value={newDbDesc}
                  onChange={(e) => setNewDbDesc(e.target.value)}
                  placeholder="Brief description of data stored in this database..."
                  className="modal-textarea"
                  rows={2}
                />
              </div>

              <div className="modal-footer-actions">
                <Button
                  type="button"
                  variant="glass"
                  size="md"
                  onClick={() => setShowCreateDbModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={creatingDb}
                  icon={Sparkles}
                >
                  Create Database in MySQL
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Admin Only Delete Database Modal */}
      {dbToDelete && (
        <div className="modal-backdrop" onClick={() => !isDeletingDb && setDbToDelete(null)}>
          <GlassCard
            elevated
            padding="large"
            className="create-db-modal delete-db-modal scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row modal-header-row--danger">
              <div className="modal-header-title-group">
                <div className="modal-title-icon-box modal-title-icon-box--danger">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Delete MySQL Database</h3>
                  <p className="modal-subtitle">Administrator action: Drop database from MySQL server</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingDb && setDbToDelete(null)}
                className="modal-close-icon-btn"
                disabled={isDeletingDb}
              >
                <X size={18} />
              </button>
            </div>

            <div className="delete-db-content">
              <div className="delete-db-alert">
                <AlertCircle size={22} className="delete-db-alert-icon" />
                <div className="delete-db-alert-text">
                  <strong>Permanent Data Deletion Warning</strong>
                  <p>
                    Are you sure you want to drop database <code>`{dbToDelete}`</code>? This will execute <code>DROP DATABASE `{dbToDelete}`</code> in MySQL. All tables and records will be permanently erased.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <Button
                type="button"
                variant="glass"
                size="md"
                onClick={() => setDbToDelete(null)}
                disabled={isDeletingDb}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                loading={isDeletingDb}
                icon={Trash2}
                onClick={handleConfirmDeleteDb}
              >
                Yes, Delete Database
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
