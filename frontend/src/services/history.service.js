// Service for maintaining query execution history in localStorage

const STORAGE_KEY = "ai_sql_query_history";

const INITIAL_SEEDS = [
  {
    id: "hist_1",
    question: "List top 5 products by price",
    sql: "SELECT id, product_name, price, category, stock FROM products ORDER BY price DESC LIMIT 5;",
    database: "ai_sql_assistant",
    role: "reader",
    userEmail: "reader@aisql.com",
    userName: "reader",
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
    userEmail: "admin@aisql.com",
    userName: "admin",
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
    userEmail: "writer@aisql.com",
    userName: "writer",
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
    userEmail: "admin@aisql.com",
    userName: "admin",
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
    userEmail: "writer@aisql.com",
    userName: "writer",
    operation: "UPDATE",
    rowCount: 1,
    executionTimeMs: 54,
    status: "success",
    timestamp: "11:20 AM",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Yesterday
  },
  {
    id: "hist_6",
    question: "Show all database tables",
    sql: "SHOW TABLES;",
    database: "ai_sql_assistant",
    role: "reader",
    userEmail: "reader@aisql.com",
    userName: "reader",
    operation: "SHOW",
    rowCount: 6,
    executionTimeMs: 18,
    status: "success",
    timestamp: "10:05 AM",
    date: new Date().toISOString().split("T")[0],
  },
];

export const getQueryHistory = (currentUser = null) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDS));
      items = INITIAL_SEEDS;
    } else {
      items = JSON.parse(raw);
    }

    if (!currentUser) return items;

    const role = (currentUser.role || "reader").toLowerCase();
    // Admin sees all queries
    if (role === "admin") {
      return items;
    }

    // Reader & Writer see only queries executed by their role/user
    return items.filter((item) => {
      const itemRole = (item.role || "reader").toLowerCase();
      if (currentUser.email && item.userEmail && item.userEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }
      return itemRole === role;
    });
  } catch (e) {
    console.error("Failed to parse query history:", e);
    return INITIAL_SEEDS;
  }
};

export const addQueryHistoryEntry = (entry) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : INITIAL_SEEDS;
    const newEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: entry.question || "Natural Language Query",
      sql: entry.sql || "",
      database: entry.database || "ai_sql_assistant",
      role: (entry.role || "reader").toLowerCase(),
      userEmail: entry.userEmail || `${entry.role || "reader"}@aisql.com`,
      userName: entry.userName || entry.role || "User",
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
  if (trimmed.startsWith("SHOW")) return "SHOW";
  if (trimmed.startsWith("DESC")) return "DESCRIBE";
  if (trimmed.startsWith("INSERT")) return "INSERT";
  if (trimmed.startsWith("UPDATE")) return "UPDATE";
  if (trimmed.startsWith("DELETE")) return "DELETE";
  if (trimmed.startsWith("ALTER") || trimmed.startsWith("DROP") || trimmed.startsWith("CREATE")) return "DDL";
  return "QUERY";
};
