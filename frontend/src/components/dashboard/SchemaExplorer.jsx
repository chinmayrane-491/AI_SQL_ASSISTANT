import React, { useState, useEffect } from "react";
import { Database, Table, Key, Hash, Calendar, Type, RefreshCw, Layers } from "lucide-react";
import GlassCard from "../common/GlassCard";
import apiClient from "../../services/api";
import { useDatabase } from "../../context/DatabaseContext";
import "./SchemaExplorer.css";

const ALL_TABLES_FALLBACK = {
  ai_sql_assistant: [
    {
      tableName: "customers",
      columns: [
        { name: "id", dataType: "int", isPrimaryKey: true },
        { name: "name", dataType: "varchar(255)", isPrimaryKey: false },
        { name: "email", dataType: "varchar(255)", isPrimaryKey: false },
        { name: "status", dataType: "varchar(50)", isPrimaryKey: false },
        { name: "created_at", dataType: "timestamp", isPrimaryKey: false },
      ],
    },
    {
      tableName: "orders",
      columns: [
        { name: "id", dataType: "int", isPrimaryKey: true },
        { name: "customer_id", dataType: "int", isPrimaryKey: false },
        { name: "total_amount", dataType: "decimal(10,2)", isPrimaryKey: false },
        { name: "order_date", dataType: "datetime", isPrimaryKey: false },
      ],
    },
    {
      tableName: "order_items",
      columns: [
        { name: "id", dataType: "int", isPrimaryKey: true },
        { name: "order_id", dataType: "int", isPrimaryKey: false },
        { name: "product_id", dataType: "int", isPrimaryKey: false },
        { name: "quantity", dataType: "int", isPrimaryKey: false },
        { name: "unit_price", dataType: "decimal(10,2)", isPrimaryKey: false },
      ],
    },
    {
      tableName: "products",
      columns: [
        { name: "id", dataType: "int", isPrimaryKey: true },
        { name: "title", dataType: "varchar(200)", isPrimaryKey: false },
        { name: "price", dataType: "decimal(10,2)", isPrimaryKey: false },
        { name: "stock_quantity", dataType: "int", isPrimaryKey: false },
        { name: "category", dataType: "varchar(100)", isPrimaryKey: false },
      ],
    },
    {
      tableName: "invoices",
      columns: [
        { name: "id", dataType: "int", isPrimaryKey: true },
        { name: "customer_id", dataType: "int", isPrimaryKey: false },
        { name: "order_id", dataType: "int", isPrimaryKey: false },
        { name: "invoice_number", dataType: "varchar(100)", isPrimaryKey: false },
        { name: "amount", dataType: "decimal(10,2)", isPrimaryKey: false },
        { name: "status", dataType: "varchar(50)", isPrimaryKey: false },
      ],
    },
    {
      tableName: "employees",
      columns: [
        { name: "id", dataType: "int", isPrimaryKey: true },
        { name: "first_name", dataType: "varchar(100)", isPrimaryKey: false },
        { name: "last_name", dataType: "varchar(100)", isPrimaryKey: false },
        { name: "department", dataType: "varchar(100)", isPrimaryKey: false },
        { name: "hire_date", dataType: "date", isPrimaryKey: false },
      ],
    },
  ],
  ai_sql_warehouse: [
    {
      tableName: "transactions",
      columns: [
        { name: "tx_id", dataType: "varchar(64)", isPrimaryKey: true },
        { name: "account_id", dataType: "varchar(64)", isPrimaryKey: false },
        { name: "amount", dataType: "decimal(15,2)", isPrimaryKey: false },
        { name: "type", dataType: "varchar(32)", isPrimaryKey: false },
        { name: "timestamp", dataType: "timestamp", isPrimaryKey: false },
      ],
    },
    {
      tableName: "revenue_logs",
      columns: [
        { name: "log_id", dataType: "int", isPrimaryKey: true },
        { name: "period", dataType: "varchar(20)", isPrimaryKey: false },
        { name: "gross_revenue", dataType: "decimal(15,2)", isPrimaryKey: false },
        { name: "net_profit", dataType: "decimal(15,2)", isPrimaryKey: false },
      ],
    },
    {
      tableName: "audit_events",
      columns: [
        { name: "event_id", dataType: "int", isPrimaryKey: true },
        { name: "user_id", dataType: "int", isPrimaryKey: false },
        { name: "action", dataType: "varchar(100)", isPrimaryKey: false },
        { name: "ip_address", dataType: "varchar(45)", isPrimaryKey: false },
        { name: "created_at", dataType: "datetime", isPrimaryKey: false },
      ],
    },
  ],
};

export default function SchemaExplorer({ onSelectTable }) {
  const { activeDb } = useDatabase();
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/schema", { params: { database: activeDb } });
      if (response.data && response.data.success && response.data.data?.tables) {
        setSchemaData(response.data.data);
        if (response.data.data.tables.length > 0) {
          setSelectedTable(response.data.data.tables[0]);
        }
      } else {
        const fallback = ALL_TABLES_FALLBACK[activeDb] || ALL_TABLES_FALLBACK.ai_sql_assistant;
        setSchemaData({ database: activeDb, tables: fallback });
        setSelectedTable(fallback[0]);
      }
    } catch {
      const fallback = ALL_TABLES_FALLBACK[activeDb] || ALL_TABLES_FALLBACK.ai_sql_assistant;
      setSchemaData({ database: activeDb, tables: fallback });
      setSelectedTable(fallback[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, [activeDb]);

  const getDataTypeIcon = (dataType) => {
    const dt = String(dataType).toLowerCase();
    if (dt.includes("int") || dt.includes("decimal") || dt.includes("float") || dt.includes("number")) return Hash;
    if (dt.includes("date") || dt.includes("time")) return Calendar;
    return Type;
  };

  return (
    <div className="schema-explorer-container">
      {/* Tables List Pane */}
      <div className="schema-sidebar">
        <div className="schema-sidebar-header">
          <div className="schema-title">
            <Database size={16} className="schema-db-icon" />
            <span>{schemaData?.database || activeDb}</span>
          </div>
          <button
            type="button"
            onClick={fetchSchema}
            className="schema-refresh-btn"
            title="Refresh Schema"
          >
            <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
          </button>
        </div>

        <div className="schema-tables-list">
          {schemaData?.tables?.map((table) => (
            <button
              key={table.tableName}
              type="button"
              onClick={() => {
                setSelectedTable(table);
                if (onSelectTable) onSelectTable(table.tableName);
              }}
              className={`schema-table-item ${selectedTable?.tableName === table.tableName ? "schema-table-item--active" : ""
                }`}
            >
              <Table size={15} />
              <span className="table-item-name">{table.tableName}</span>
              <span className="table-col-count">{table.columns?.length || 0} cols</span>
            </button>
          ))}
        </div>
      </div>

      {/* Columns and Details Pane */}
      <div className="schema-details-pane">
        {selectedTable ? (
          <GlassCard padding="default" className="table-details-card">
            <div className="table-details-header">
              <div>
                <h3 className="table-details-name">{selectedTable.tableName}</h3>
                <p className="table-details-meta">
                  Database Table &bull; {selectedTable.columns?.length || 0} Defined Columns &bull; Database: {activeDb}
                </p>
              </div>
            </div>

            <div className="columns-table-wrapper">
              <table className="columns-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                    <th>Key</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTable.columns?.map((col) => {
                    const colName = col.name || col.columnName;
                    const colType = col.dataType || col.columnType || "varchar";
                    const isPK = col.isPrimaryKey;
                    const TypeIcon = getDataTypeIcon(colType);

                    return (
                      <tr key={colName}>
                        <td className="col-name-cell">
                          <TypeIcon size={14} className="col-type-icon" />
                          <span className="col-name-text">{colName}</span>
                        </td>
                        <td>
                          <span className="col-type-badge">{colType}</span>
                        </td>
                        <td>
                          {isPK && (
                            <span className="col-pk-badge">
                              <Key size={12} />
                              <span>PRIMARY</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        ) : (
          <div className="schema-empty-state">
            <Table size={32} />
            <p>Select a table to inspect columns and structure</p>
          </div>
        )}
      </div>
    </div>
  );
}
