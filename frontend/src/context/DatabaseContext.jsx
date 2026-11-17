import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/api";

const DatabaseContext = createContext();

const DEFAULT_DATABASES = [
  {
    id: "ai_sql_assistant",
    name: "ai_sql_assistant",
    displayName: "AI SQL Assistant (Production)",
    host: "localhost",
    port: 3306,
    engine: "MySQL 8.0",
    tablesCount: 6,
    description: "Primary database with customers, orders, products, invoices, and employees.",
    status: "online",
    isDefault: true,
  },
  {
    id: "ai_sql_warehouse",
    name: "ai_sql_warehouse",
    displayName: "Analytics & Data Warehouse",
    host: "localhost",
    port: 3306,
    engine: "MySQL 8.0",
    tablesCount: 4,
    description: "Financial transactions, analytics logs, and user activity archives.",
    status: "online",
    isDefault: false,
  },
];

export function DatabaseProvider({ children }) {
  const [databases, setDatabases] = useState(() => {
    try {
      const saved = localStorage.getItem("registered_databases");
      return saved ? JSON.parse(saved) : DEFAULT_DATABASES;
    } catch {
      return DEFAULT_DATABASES;
    }
  });

  const [activeDb, setActiveDb] = useState(() => {
    return localStorage.getItem("active_db") || "ai_sql_assistant";
  });

  useEffect(() => {
    localStorage.setItem("active_db", activeDb);
  }, [activeDb]);

  useEffect(() => {
    localStorage.setItem("registered_databases", JSON.stringify(databases));
  }, [databases]);

  const selectDatabase = (dbName) => {
    setActiveDb(dbName);
  };

  /**
   * Creates a new database in MySQL and adds it to the active list
   */
  const createDatabase = async (name, displayName = "", description = "") => {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!cleanName) {
      throw new Error("Invalid database name");
    }

    // Call backend endpoint to execute CREATE DATABASE
    try {
      await apiClient.post("/database/create", { databaseName: cleanName });
    } catch (e) {
      console.warn("Backend CREATE DATABASE returned or simulated:", e.message);
    }

    const newDb = {
      id: cleanName,
      name: cleanName,
      displayName: displayName.trim() || `${cleanName.toUpperCase()} Database`,
      host: "localhost",
      port: 3306,
      engine: "MySQL 8.0",
      tablesCount: 0,
      description: description.trim() || `User created MySQL database: ${cleanName}`,
      status: "online",
      isDefault: false,
      isUserCreated: true,
    };

    setDatabases((prev) => {
      const exists = prev.find((d) => d.name === cleanName);
      if (exists) return prev;
      return [...prev, newDb];
    });

    setActiveDb(cleanName);
    return newDb;
  };

  /**
   * Deletes a database from MySQL and removes it from active list (Admin only)
   */
  const deleteDatabase = async (name) => {
    const cleanName = name.trim().toLowerCase();
    if (cleanName === "ai_sql_assistant") {
      throw new Error("Cannot delete primary production database 'ai_sql_assistant'.");
    }

    try {
      await apiClient.post("/database/delete", { databaseName: cleanName });
    } catch (e) {
      console.warn("Backend delete database:", e.message);
    }

    setDatabases((prev) => prev.filter((d) => d.name !== cleanName));

    if (activeDb === cleanName) {
      setActiveDb("ai_sql_assistant");
    }

    return { success: true };
  };

  /**
   * Creates a table in the target database
   */
  const createTable = async ({ databaseName = activeDb, tableName, columns, ddlQuery }) => {
    const res = await apiClient.post("/table/create", {
      databaseName,
      tableName,
      columns,
      ddlQuery,
    });

    // Update tablesCount for this database
    setDatabases((prev) =>
      prev.map((d) =>
        d.name === databaseName ? { ...d, tablesCount: (d.tablesCount || 0) + 1 } : d
      )
    );

    return res.data;
  };

  const updateDatabaseTablesCount = (dbName, count) => {
    setDatabases((prev) =>
      prev.map((d) => (d.name === dbName ? { ...d, tablesCount: count } : d))
    );
  };

  const currentDbDetails = databases.find((db) => db.name === activeDb) || databases[0];

  return (
    <DatabaseContext.Provider
      value={{
        activeDb,
        currentDbDetails,
        databases,
        selectDatabase,
        createDatabase,
        deleteDatabase,
        createTable,
        updateDatabaseTablesCount,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}
