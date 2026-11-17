# 🐬 MySQL AI Chatbot — Enterprise SQL Workspace

<div align="center">

![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0-00758F?style=for-the-badge&logo=mysql&logoColor=white)
![Gemini 2.5](https://img.shields.io/badge/Gemini_2.5_Flash-Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React Vite](https://img.shields.io/badge/React_Vite-Tailwind_Glass-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Security RBAC](https://img.shields.io/badge/Security-RBAC_&_AST_Guard-E11D48?style=for-the-badge&logo=shield&logoColor=white)
![Rate Limited](https://img.shields.io/badge/Protected-Rate_Limited-10B981?style=for-the-badge&logo=fastapi&logoColor=white)

**An intelligent, multi-database conversational SQL platform powered by Gemini LLM and LangChain.**  
*Natural Language to verified MySQL 8.0 with multi-role RBAC enforcement, AST injection defenses, destructive query confirmation guards, and real-time schema exploration.*

[Features](#-key-features) • [Screenshots](#-screenshots--ui-showcase) • [Role Security Walkthrough](#-end-to-end-role-walkthrough--demo) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Reference](#-api-endpoints)

</div>

---

## 🌟 Key Features

- **🧠 Conversational Natural Language to SQL:** Ask questions in plain English or natural language; the AI converts requests into optimized MySQL 8.0 queries with structured syntax validation.
- **🛡️ Enterprise Multi-Role RBAC:**
  - **👑 Admin:** Full DDL & DML control (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `INSERT`, `UPDATE`, `DELETE`, `SELECT`), database creation and permanent deletion.
  - **✍️ Writer:** Data modification permitted (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). DDL operations are strictly blocked.
  - **📖 Reader:** Strict read-only mode (`SELECT` only, capped at 100 rows). All modifications and drops are blocked.
- **⚠️ Destructive Query Confirmation Guard:**
  - `SELECT` queries execute **seamlessly without extra confirmation**.
  - Destructive/Mutating queries (`DROP`, `TRUNCATE`, `DELETE`, `UPDATE`) trigger an interactive **Confirmation Guard** card requiring explicit user confirmation before touching the database.
- **🔒 AST SQL Injection Defense & Sandboxing:**
  - Parsed via `node-sql-parser` into an Abstract Syntax Tree (AST).
  - Multi-statement execution blocked (`multipleStatements: false`).
  - Dangerous commands (`SELECT INTO`, unindexed Cartesian joins, `WHERE 1=1` bypasses) are neutralized.
  - Connection execution timeout capped at 5000ms (`SET SESSION max_execution_time = 5000`).
- **🗄️ Multi-Database Environments & Switching:**
  - Seamlessly switch active target databases on the fly (`ai_sql_assistant`, `ai_sql_warehouse`, custom user databases).
  - Admin-only database creation and deletion with protected system schemas safeguard.
- **⚡ Production-Grade Security & Performance:**
  - `express-rate-limit` prevents DoS attacks and Gemini API token exhaustion.
  - `helmet` secures HTTP response headers.
  - Granular CORS whitelisting.
- **💎 Apple-Style Glassmorphism UI:**
  - Fluid responsive design for mobile, tablet, and desktop.
  - Typewriter streaming chat, interactive SQL copy/execute, and dynamic tabular result view.

---

## 📸 Screenshots & UI Showcase

<div align="center">

### 1. Modern Split Showcase Login Screen
*High-tech enterprise datacenter visuals, authentic MySQL 8.0 brand mark, and 1-click workspace role selectors.*

<img src="docs/screenshots/login-screen.jpg" alt="MySQL AI Chatbot Login Screen" width="850" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />

---

### 2. Intelligent AI Chat Workspace & Results Table
*Real-time conversational SQL generation, query explanations, and interactive tabular records viewer.*

<img src="docs/screenshots/chat-workspace.jpg" alt="AI Chat Workspace" width="850" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />

---

### 3. Multi-Role RBAC Security Cards
*Assigned roles, permitted query rules, write/DDL guards, and database connection pool separation.*

<img src="docs/screenshots/rbac-role-cards.png" alt="RBAC Role Cards" width="850" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />

---

### 4. Database Environments & Instant Target Switching
*Switch between production, analytics warehouse, and user-created databases with live table counts.*

| Database Environment Switcher | Active Tables Schema Overview |
| :---: | :---: |
| <img src="docs/screenshots/db-switcher.png" alt="Database Switcher" width="400" /> | <img src="docs/screenshots/tables-overview.png" alt="Tables Overview" width="400" /> |

</div>

---

## 🎬 End-to-End Role Walkthrough & Demo

This walkthrough demonstrates the end-to-end security cycle from **Login to Logout** across all three workspace roles.

```mermaid
flowchart TD
    Login["🔐 Login Screen (Select Role)"] --> Choice{Role Choice}
    
    Choice -->|Reader| R_Dash["📖 Reader Dashboard"]
    R_Dash --> R_Select["SELECT Query: 'Show customers' -> ✅ Executes Instantly"]
    R_Dash --> R_Delete["MUTATING Query: 'Delete customers' -> ❌ BLOCKED (RBAC Violation)"]
    R_Delete --> R_Logout["🚪 Logout"]
    
    Choice -->|Writer| W_Dash["✍️ Writer Dashboard"]
    W_Dash --> W_Select["SELECT Query -> ✅ Executes Instantly"]
    W_Dash --> W_Update["UPDATE/DELETE Query -> ⚠️ Confirmation Guard Triggered"]
    W_Update --> W_Confirm["User Clicks 'Confirm & Run' -> ✅ Executes on Writer Pool"]
    W_Dash --> W_Drop["DDL Query: 'Drop table' -> ❌ BLOCKED (DDL Restricted)"]
    W_Drop --> W_Logout["🚪 Logout"]
    
    Choice -->|Admin| A_Dash["👑 Admin Dashboard"]
    A_Dash --> A_All["DML & DDL Supported with Confirmation"]
    A_Dash --> A_Manage["Database Management -> Create / Drop Custom DBs"]
    A_Manage --> A_Logout["🚪 Logout"]
```

---

### Role 1: Reader (`reader@aisql.com`) — Strict Read-Only
1. **Sign In:** Click **Reader** role pill on login screen. Credentials auto-fill (`reader@aisql.com` / `password123`).
2. **Safe Query:** Ask *"List all products with price greater than 5000"*.
   - **Result:** ✅ AI generates `SELECT`, executes immediately on `ai_sql_reader` pool, and renders the data table.
3. **Attempt Modification:** Ask *"Delete inactive customers"* or *"Update product price"*.
   - **Result:** ❌ **STRICTLY BLOCKED**. System responds:
     > `Security Policy Violation: Your reader role cannot execute DELETE queries.`
4. **Logout:** Click avatar dropdown -> Sign Out.

---

### Role 2: Writer (`writer@aisql.com`) — Data Operations
1. **Sign In:** Click **Writer** role pill (`writer@aisql.com` / `password123`).
2. **Safe Query:** Ask *"Show total orders placed this week"*.
   - **Result:** ✅ Executes immediately without confirmation.
3. **Destructive/Mutating Query:** Ask *"Delete customers whose status is inactive"*.
   - **Result:** ⚠️ **Confirmation Guard Triggered**. The AI does **not** auto-run the query. A prominent confirmation card appears:
     > `⚠️ Confirmation Required to Run DELETE: This query will alter or remove records in database ai_sql_assistant.`
   - Click **`Confirm & Run DELETE`** -> Query executes securely on `writerDB` pool, returning affected rows count.
4. **Attempt DDL (Drop/Truncate):** Ask *"Drop table orders"*.
   - **Result:** ❌ **STRICTLY BLOCKED**. System responds:
     > `Security Policy Violation: Your writer role cannot execute DROP queries.`
5. **Logout:** Click avatar dropdown -> Sign Out.

---

### Role 3: Admin (`admin@aisql.com`) — Full Control & Management
1. **Sign In:** Click **Admin** role pill (`admin@aisql.com` / `password123`).
2. **Full DDL & DML:** Can run `CREATE TABLE`, `ALTER`, `DROP`, `TRUNCATE`, `INSERT`, `UPDATE`, `DELETE`.
3. **Safety Guard:** Destructive queries (`DROP TABLE`, `TRUNCATE`, `DELETE`) still prompt for confirmation to prevent accidental data loss.
4. **Database Environment Management:**
   - Navigate to **Database Settings**.
   - Click **Create New Database** -> Create a database (e.g. `ecommerce_db`).
   - Create tables visually or via custom DDL.
   - Admin-only **Delete DB** button appears on custom databases with a danger confirmation modal.
   - Primary database `ai_sql_assistant` and system schemas are protected from deletion.
5. **Logout:** Return to login screen.

---

## 🏗️ Architecture

```
                                      ┌─────────────────────────────────────────┐
                                      │        React + Vite Frontend (UI)       │
                                      │  - Liquid Glassmorphic Theme            │
                                      │  - Role Cards & Dynamic Auth Context    │
                                      │  - Typewriter Streaming Chat Workspace  │
                                      └────────────────────┬────────────────────┘
                                                           │ HTTP / Axios (CORS Whitelisted)
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │         Express 5 Backend Security      │
                                      │  - Helmet HTTP Security Headers         │
                                      │  - Express Rate Limiter (Anti-DDoS)     │
                                      │  - 60kb Request Body Size Limiter       │
                                      └────────────────────┬────────────────────┘
                                                           │
                                ┌──────────────────────────┴──────────────────────────┐
                                ▼                                                     ▼
                  ┌───────────────────────────┐                         ┌───────────────────────────┐
                  │    Gemini 2.5 + LangChain │                         │  node-sql-parser (AST)    │
                  │  - Schema Ingestion       │                         │  - Statement Count Check  │
                  │  - Structured Output      │                         │  - Operation Type Guard   │
                  │  - Natural Explanation    │                         │  - WHERE Clause Audit     │
                  └─────────────┬─────────────┘                         └─────────────┬─────────────┘
                                │                                                     │
                                └──────────────────────────┬──────────────────────────┘
                                                           │
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │    RBAC & Connection Pool Router        │
                                      │  - checkSQLPermission(role, operation)  │
                                      │  - Destructive Confirmation Guard       │
                                      └────────────────────┬────────────────────┘
                                                           │
                       ┌───────────────────────────────────┼───────────────────────────────────┐
                       ▼                                   ▼                                   ▼
         ┌───────────────────────────┐       ┌───────────────────────────┐       ┌───────────────────────────┐
         │       Reader Pool         │       │        Writer Pool        │       │        Admin Pool         │
         │  - SELECT Only            │       │  - INSERT, UPDATE, DELETE │       │  - DDL, CREATE, DROP      │
         │  - Max 100 Rows Limit     │       │  - Safe WHERE Enforced    │       │  - Multi-DB Admin Control │
         └─────────────┬─────────────┘       └─────────────┬─────────────┘       └─────────────┬─────────────┘
                       │                                   │                                   │
                       └───────────────────────────────────┼───────────────────────────────────┘
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │             MySQL 8.0 Server            │
                                      │  Port: 3306 • max_execution_time=5000ms │
                                      └─────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MySQL Server**: v8.0 or higher
- **Google Gemini API Key**: [Get API Key](https://aistudio.google.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/AI_SQL_Assistant.git
cd AI_SQL_Assistant
```

---

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (use `.env.example` as reference):
```env
# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# Primary MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_sql_assistant

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Connection Pools (Can use root for local dev, or dedicated users for production)
READ_DB_HOST=localhost
READ_DB_USER=ai_sql_reader
READ_DB_PASSWORD=your_reader_password
READ_DB_NAME=ai_sql_assistant

DB_READER_USER=ai_sql_reader
DB_READER_PASSWORD=your_reader_password

DB_WRITER_USER=ai_sql_writer
DB_WRITER_PASSWORD=your_writer_password

DB_ADMIN_USER=ai_sql_admin
DB_ADMIN_PASSWORD=your_admin_password
```

Start the backend server:
```bash
npm run dev
```
Backend will start on `http://localhost:5000`.

---

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

### 4. Database Setup (Optional Seed)
Create the database in MySQL:
```sql
CREATE DATABASE IF NOT EXISTS ai_sql_assistant;
USE ai_sql_assistant;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **👑 Admin** | `admin@aisql.com` | `password123` | Full DDL & DML, DB Creation/Deletion |
| **✍️ Writer** | `writer@aisql.com` | `password123` | SELECT, INSERT, UPDATE, DELETE (Confirmation Guard) |
| **📖 Reader** | `reader@aisql.com` | `password123` | Strict Read-Only (SELECT Max 100 Rows) |

---

## 📡 API Endpoints

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/ask` | Natural language question -> Generates SQL, executes SELECT or prompts confirmation for mutations | 30 req/min |
| `POST` | `/api/execute-confirmed` | Executes confirmed DML/DDL queries after user verification | 30 req/min |
| `GET` | `/api/schema` | Retrieves tables, columns, keys and relations for target database | 200 req/15min |
| `GET` | `/api/databases` | Lists non-system user databases | 200 req/15min |
| `POST` | `/api/database/create` | Creates a new MySQL database | 200 req/15min |
| `POST` | `/api/database/delete` | Permanently drops a database (Admin only) | 200 req/15min |
| `POST` | `/api/table/create` | Creates a table via visual builder or custom DDL | 200 req/15min |
| `GET` | `/api/health` | Backend server health check & status | Unlimited |

---

## 🛡️ Security Implementation Details

1. **AST Parsing & Validation:** Every query passes through `validateSQL()` using `node-sql-parser`. Multi-statements separated by `;` are rejected before hitting the database driver.
2. **WHERE Clause Guard:** `UPDATE` and `DELETE` queries are verified to ensure they have valid `column_ref` conditions. Blanket `WHERE 1=1` or `WHERE TRUE` conditions are blocked.
3. **Database Drop Safeguards:** System databases (`mysql`, `information_schema`, `performance_schema`, `sys`) and production root (`ai_sql_assistant`) are strictly protected from deletion.
4. **Execution Timeout:** Sessions enforce `SET SESSION max_execution_time = 5000` to prevent unindexed queries from hanging the connection pool.

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).

<div align="center">
  <sub>Built with ❤️ by <strong>Chinmay</strong> using Google Gemini &amp; MySQL</sub>
</div>
