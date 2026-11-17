import React, { useState, useEffect } from "react";
import {
  Table as TableIcon,
  Columns,
  Key,
  Layers,
  ArrowRight,
  Database,
  Plus,
  Sparkles,
} from "lucide-react";
import GlassCard from "../common/GlassCard";
import Button from "../common/Button";
import apiClient from "../../services/api";
import { useDatabase } from "../../context/DatabaseContext";
import "./TablesOverview.css";

const KNOWN_TABLE_METADATA = {
  ai_sql_assistant: [
    {
      tableName: "customers",
      description: "Customer accounts, profile information, contact email, and membership status.",
      primaryKey: "id",
      columnsCount: 5,
      keyColumns: ["id", "name", "email", "status", "created_at"],
      category: "Core Business",
    },
    {
      tableName: "orders",
      description: "Sales orders, customer associations, order fulfillment dates, and total amount.",
      primaryKey: "id",
      columnsCount: 4,
      keyColumns: ["id", "customer_id", "total_amount", "order_date"],
      category: "Sales & Orders",
    },
    {
      tableName: "order_items",
      description: "Individual line items for each order, linking products with quantities and unit price.",
      primaryKey: "id",
      columnsCount: 5,
      keyColumns: ["id", "order_id", "product_id", "quantity", "unit_price"],
      category: "Sales & Orders",
    },
    {
      tableName: "products",
      description: "Catalog inventory, retail prices, stock quantities, and product specifications.",
      primaryKey: "id",
      columnsCount: 5,
      keyColumns: ["id", "title", "price", "stock_quantity", "category"],
      category: "Inventory",
    },
    {
      tableName: "invoices",
      description: "Billing invoices, payment tracking, customer invoice IDs, and transaction dates.",
      primaryKey: "id",
      columnsCount: 6,
      keyColumns: ["id", "customer_id", "order_id", "invoice_number", "amount", "status"],
      category: "Finance",
    },
    {
      tableName: "employees",
      description: "Internal company staff, job titles, department mappings, and hire dates.",
      primaryKey: "id",
      columnsCount: 5,
      keyColumns: ["id", "first_name", "last_name", "department", "hire_date"],
      category: "Administration",
    },
  ],
  ai_sql_warehouse: [
    {
      tableName: "transactions",
      description: "Aggregated ledger records, currency values, and payment processor confirmations.",
      primaryKey: "tx_id",
      columnsCount: 6,
      keyColumns: ["tx_id", "account_id", "amount", "type", "timestamp"],
      category: "Financial Ledger",
    },
    {
      tableName: "revenue_logs",
      description: "Historical revenue batches, monthly summaries, and gross profit metrics.",
      primaryKey: "log_id",
      columnsCount: 5,
      keyColumns: ["log_id", "period", "gross_revenue", "net_profit"],
      category: "Analytics",
    },
    {
      tableName: "audit_events",
      description: "System security logs, user role changes, and database modification traces.",
      primaryKey: "event_id",
      columnsCount: 6,
      keyColumns: ["event_id", "user_id", "action", "ip_address", "created_at"],
      category: "Security",
    },
    {
      tableName: "user_activity_archive",
      description: "User engagement archives, query execution history, and session duration data.",
      primaryKey: "archive_id",
      columnsCount: 5,
      keyColumns: ["archive_id", "session_id", "duration_seconds", "logged_at"],
      category: "Activity Logs",
    },
  ],
};

export default function TablesOverview({ onTableAction }) {
  const { activeDb, updateDatabaseTablesCount } = useDatabase();
  const [tablesList, setTablesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSchemaTables() {
      setLoading(true);
      try {
        const response = await apiClient.get("/schema", {
          params: { database: activeDb },
        });

        if (isMounted && response.data?.success) {
          const rawTables = response.data.data?.tables || [];

          if (rawTables.length > 0) {
            const liveTables = rawTables.map((t) => {
              const known = (KNOWN_TABLE_METADATA[activeDb] || []).find(
                (k) => k.tableName.toLowerCase() === (t.tableName || "").toLowerCase()
              );

              return {
                tableName: t.tableName,
                description: known?.description || `Database table storing ${t.tableName} records in ${activeDb}.`,
                primaryKey: t.columns?.find((c) => c.isPrimaryKey)?.name || known?.primaryKey || "id",
                columnsCount: t.columns?.length || known?.columnsCount || 4,
                keyColumns: t.columns?.slice(0, 5).map((c) => c.name) || known?.keyColumns || [],
                category: known?.category || "User Table",
              };
            });

            setTablesList(liveTables);
            if (updateDatabaseTablesCount) updateDatabaseTablesCount(activeDb, liveTables.length);
          } else {
            // Database is real but currently has 0 tables
            setTablesList([]);
            if (updateDatabaseTablesCount) updateDatabaseTablesCount(activeDb, 0);
          }
        } else {
          // Fallback only if known database (ai_sql_assistant / ai_sql_warehouse)
          const fallback = KNOWN_TABLE_METADATA[activeDb] || [];
          if (isMounted) {
            setTablesList(fallback);
            if (updateDatabaseTablesCount) updateDatabaseTablesCount(activeDb, fallback.length);
          }
        }
      } catch {
        const fallback = KNOWN_TABLE_METADATA[activeDb] || [];
        if (isMounted) {
          setTablesList(fallback);
          if (updateDatabaseTablesCount) updateDatabaseTablesCount(activeDb, fallback.length);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSchemaTables();

    return () => {
      isMounted = false;
    };
  }, [activeDb]);

  return (
    <div className="tables-overview-section">
      <div className="tables-overview-header">
        <div>
          <h3 className="tables-overview-title">
            Database Tables Overview (<code>{activeDb}</code>)
          </h3>
          <p className="tables-overview-subtitle">
            {tablesList.length === 0
              ? `Database "${activeDb}" currently contains 0 tables.`
              : `Showing all ${tablesList.length} active tables in "${activeDb}" database schema.`}
          </p>
        </div>
      </div>

      {tablesList.length === 0 ? (
        <GlassCard padding="large" className="empty-tables-card fade-in-up">
          <div className="empty-tables-icon-badge">
            <TableIcon size={34} />
          </div>
          <h4 className="empty-tables-title">No Tables Found in <code>{activeDb}</code></h4>
          <p className="empty-tables-desc">
            This database is currently empty. You can easily create new tables using the <strong>Table Creator</strong> in Settings or by running a <code>CREATE TABLE</code> query in AI SQL Chat!
          </p>
          <div className="empty-tables-action-row">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                if (onTableAction) onTableAction("settings");
              }}
            >
              Create Table in {activeDb}
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="tables-overview-grid">
          {tablesList.map((table) => (
            <GlassCard key={table.tableName} padding="default" className="table-full-card">
              <div className="table-card-top-row">
                <div className="table-icon-pill">
                  <TableIcon size={18} />
                </div>
                <span className="table-category-tag">{table.category}</span>
              </div>

              <div className="table-info-block">
                <h4 className="table-name-heading">{table.tableName}</h4>
                <p className="table-desc-text">{table.description}</p>
              </div>

              {/* Columns preview pill list */}
              <div className="table-cols-preview">
                <div className="table-meta-stat">
                  <Columns size={13} className="meta-icon" />
                  <span>{table.columnsCount} Columns</span>
                </div>
                <div className="table-meta-stat">
                  <Key size={13} className="meta-icon" />
                  <span>PK: {table.primaryKey}</span>
                </div>
              </div>

              <div className="table-columns-chip-list">
                {table.keyColumns.map((col) => (
                  <span key={col} className={`col-chip ${col === table.primaryKey ? "col-chip--pk" : ""}`}>
                    {col === table.primaryKey && <Key size={10} />}
                    <span>{col}</span>
                  </span>
                ))}
              </div>

              <div className="table-card-footer">
                <button
                  type="button"
                  onClick={() => {
                    if (onTableAction) onTableAction(table.tableName);
                  }}
                  className="table-explore-link"
                >
                  <span>Inspect Schema</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
