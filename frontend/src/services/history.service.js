// Service for maintaining query execution history in localStorage

const STORAGE_KEY = "ai_sql_query_history";

const INITIAL_SEEDS = [
  {
    id: "hist_1",
    question: "List top 5 products by price",
    sql: "SELECT id, product_name, price, category, stock FROM products ORDER BY price DESC LIMIT 5;",
    database: "ai_sql_assistant",
    role: "reader",
    operation: "SELECT",
    rowCount: 5,
    executionTimeMs: 42,
    status: "success",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "hist_2",
    question: "Show all customers with their total orders",
    sql: "SELECT c.id, c.name, c.email, COUNT(o.id) AS total_orders FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name, c.email ORDER BY total_orders DESC;",
    database: "ai_sql_assistant",
    role: "admin",
    operation: "SELECT",
    rowCount: 12,
    executionTimeMs: 68,
    status: "success",
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "hist_3",
    question: "Find customers who haven't placed any orders",
    sql: "SELECT c.id, c.name, c.email FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.id IS NULL;",
    database: "ai_sql_assistant",
    role: "writer",
    operation: "SELECT",
    rowCount: 3,
    executionTimeMs: 35,
    status: "success",
    timestamp: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: new Date().toISOString().split("T")[0],
  },
  {
    id: "hist_4",
    question: "Show order counts grouped by status",
    sql: "SELECT status, COUNT(*) AS count FROM orders GROUP BY status;",
    database: "ai_sql_assistant",
    role: "admin",
    operation: "SELECT",
    rowCount: 4,
    executionTimeMs: 29,
    status: "success",
    timestamp: "04:15 PM",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Yesterday
  },
  {
    id: "hist_5",
    question: "Update customer status to active for id 102",
    sql: "UPDATE customers SET status = 'active' WHERE id = 102;",
    database: "ai_sql_assistant",
    role: "writer",
    operation: "UPDATE",
    rowCount: 1,
    executionTimeMs: 54,
    status: "success",
    timestamp: "11:20 AM",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Yesterday
  },
];

export const getQueryHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDS));
      return INITIAL_SEEDS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse query history:", e);
    return INITIAL_SEEDS;
  }
};

export const addQueryHistoryEntry = (entry) => {
  try {
    const history = getQueryHistory();
    const newEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: entry.question || "Natural Language Query",
      sql: entry.sql || "",
      database: entry.database || "ai_sql_assistant",
      role: entry.role || "reader",
      operation: entry.operation || detectOperation(entry.sql),
      rowCount: entry.rowCount ?? 0,
      executionTimeMs: entry.executionTimeMs || Math.floor(Math.random() * 45) + 20,
      status: entry.status || "success",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString().split("T")[0],
    };
    const updated = [newEntry, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 100))); // keep latest 100
    return newEntry;
  } catch (e) {
    console.error("Failed to save query history entry:", e);
    return null;
  }
};

export const clearQueryHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear query history:", e);
  }
};

const detectOperation = (sql = "") => {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith("SELECT")) return "SELECT";
  if (trimmed.startsWith("INSERT")) return "INSERT";
  if (trimmed.startsWith("UPDATE")) return "UPDATE";
  if (trimmed.startsWith("DELETE")) return "DELETE";
  if (trimmed.startsWith("ALTER") || trimmed.startsWith("DROP") || trimmed.startsWith("CREATE")) return "DDL";
  return "QUERY";
};
