const path = require("path");
const fs = require("fs");
const localEnvPath = path.join(__dirname, ".env");
const fallbackEnvPath = path.join(__dirname, "backend", ".env");
const envPath = fs.existsSync(localEnvPath) && fs.statSync(localEnvPath).size > 0 ? localEnvPath : fallbackEnvPath;
require("dotenv").config({ path: envPath });
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data intentionally resets when the server restarts (as required by the exam).
let employees = [
  { id: "1", name: "John Doe", position: "Software Engineer", status: "Active", salary: 45000 },
  { id: "2", name: "Jane Smith", position: "HR Manager", status: "Active", salary: 52000 },
  { id: "3", name: "Alex Brown", position: "Accountant", status: "On Leave", salary: 32000 },
  { id: "4", name: "Mina Lee", position: "UX Designer", status: "Active", salary: 38000 },
  { id: "5", name: "Sam Wilson", position: "Sales Executive", status: "Active", salary: 27000 },
];
let nextId = 6;
const validTokens = new Set();
// Database mode is the default on the hosted server; set USE_MYSQL=false only for local in-memory development.
const useMysql = process.env.USE_MYSQL !== "false";
const pool = useMysql ? mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ip_std6730251387",
  waitForConnections: true,
  connectionLimit: 5,
  timezone: "+07:00",
}) : null;

function toApiEmployee(row) {
  return { id: String(row.Atsadaphon_ID_Employ ?? row.id), name: row.name, position: row.position, status: row.status, salary: Number(row.salary) };
}

async function initializeDatabase() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await pool.query(`INSERT INTO users (username, email, password, name, role)
    VALUES ('admin', 'admin@atsadaphon.local', 'admin', 'Administrator', 'admin')
    ON DUPLICATE KEY UPDATE password = 'admin', name = 'Administrator', role = 'admin'`);
  await pool.query(`CREATE TABLE IF NOT EXISTS Atsadaphon_Employee (
    Atsadaphon_ID_Employ INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    position VARCHAR(150) NOT NULL,
    status ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
    salary DECIMAL(12, 2) NOT NULL,
    PRIMARY KEY (Atsadaphon_ID_Employ)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM Atsadaphon_Employee");
  if (Number(rows[0].total) === 0) {
    await pool.query(`INSERT INTO Atsadaphon_Employee (name, position, status, salary) VALUES
      ('John Doe', 'Software Engineer', 'Active', 45000),
      ('Jane Smith', 'HR Manager', 'Active', 52000),
      ('Alex Brown', 'Accountant', 'On Leave', 32000),
      ('Mina Lee', 'UX Designer', 'Active', 38000),
      ('Sam Wilson', 'Sales Executive', 'Active', 27000)`);
  }
}

app.get("/", (_req, res) => res.json({ success: true, message: "Atsadaphon HR API is running" }));
app.get("/api/health", (_req, res) => res.json({ success: true, service: "atsadaphon-hr-api" }));

app.post("/api/login", async (req, res, next) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return res.status(400).json({ success: false, message: "กรุณากรอก Username และ Password" });
  }
  try {
    if (pool) {
      const [rows] = await pool.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username.trim()]);
      const account = rows[0];
      if (!account) return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      const storedPassword = String(account.password || "");
      const validPassword = storedPassword.startsWith("$2")
        ? await bcrypt.compare(password, storedPassword)
        : storedPassword === password;
      const accountRole = String(account.username || "").toLowerCase() === "admin" ? "admin" : String(account.role || "user").toLowerCase();
      if (!validPassword || accountRole !== "admin") {
        return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }
      const token = crypto.randomBytes(32).toString("hex");
      validTokens.add(token);
      return res.json({ success: true, token, user: { id: account.id ?? account.user_id, username: account.username, name: account.name || account.username, role: "admin" } });
    }
    // Local fallback is for development only. Enable MySQL to authenticate against phpMyAdmin's users table.
    if (username.trim() === "admin" && password === "admin") {
      const token = crypto.randomBytes(32).toString("hex");
      validTokens.add(token);
      return res.json({ success: true, token, user: { id: 1, username: "admin", name: "Administrator", role: "admin" } });
    }
    return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  } catch (err) { next(err); }
});

app.use("/api/employees", (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !validTokens.has(token)) return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบก่อน" });
  next();
});

app.get("/api/employees", async (_req, res, next) => {
  try {
    if (pool) {
      const [rows] = await pool.query("SELECT Atsadaphon_ID_Employ, name, position, status, salary FROM Atsadaphon_Employee ORDER BY Atsadaphon_ID_Employ");
      return res.json(rows.map(toApiEmployee));
    }
    return res.json(employees);
  } catch (err) { next(err); }
});

app.post("/api/employees", async (req, res, next) => {
  const { name, position, salary } = req.body || {};
  const parsedSalary = Number(salary);
  if (typeof name !== "string" || !name.trim() || typeof position !== "string" || !position.trim() || salary === "" || salary == null || !Number.isFinite(parsedSalary) || parsedSalary < 0) {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อ ตำแหน่ง และเงินเดือนให้ถูกต้อง" });
  }
  try {
    if (pool) {
      const [result] = await pool.query("INSERT INTO Atsadaphon_Employee (name, position, status, salary) VALUES (?, ?, 'Active', ?)", [name.trim(), position.trim(), parsedSalary]);
      return res.status(201).json({ id: String(result.insertId), name: name.trim(), position: position.trim(), status: "Active", salary: parsedSalary });
    }
    const employee = { id: String(nextId++), name: name.trim(), position: position.trim(), status: "Active", salary: parsedSalary };
    employees.push(employee);
    return res.status(201).json(employee);
  } catch (err) { next(err); }
});

app.put("/api/employees/:id/status", async (req, res, next) => {
  if (pool) {
    try {
      const [result] = await pool.query("UPDATE Atsadaphon_Employee SET status = IF(status = 'Active', 'On Leave', 'Active') WHERE Atsadaphon_ID_Employ = ?", [req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ success: false, message: "ไม่พบพนักงาน" });
      const [rows] = await pool.query("SELECT Atsadaphon_ID_Employ, name, position, status, salary FROM Atsadaphon_Employee WHERE Atsadaphon_ID_Employ = ?", [req.params.id]);
      return res.json(toApiEmployee(rows[0]));
    } catch (err) { return next(err); }
  }
  const employee = employees.find((item) => item.id === req.params.id);
  if (!employee) return res.status(404).json({ success: false, message: "ไม่พบพนักงาน" });
  employee.status = employee.status === "Active" ? "On Leave" : "Active";
  return res.json(employee);
});

app.put("/api/employees/:id", async (req, res, next) => {
  const { name, position, salary } = req.body || {};
  const parsedSalary = Number(salary);
  if (typeof name !== "string" || !name.trim() || typeof position !== "string" || !position.trim() || salary === "" || salary == null || !Number.isFinite(parsedSalary) || parsedSalary < 0) {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อ ตำแหน่ง และเงินเดือนให้ถูกต้อง" });
  }
  try {
    if (pool) {
      const [result] = await pool.query("UPDATE Atsadaphon_Employee SET name = ?, position = ?, salary = ? WHERE Atsadaphon_ID_Employ = ?", [name.trim(), position.trim(), parsedSalary, req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ success: false, message: "ไม่พบพนักงาน" });
      const [rows] = await pool.query("SELECT Atsadaphon_ID_Employ, name, position, status, salary FROM Atsadaphon_Employee WHERE Atsadaphon_ID_Employ = ?", [req.params.id]);
      return res.json(toApiEmployee(rows[0]));
    }
    const employee = employees.find((item) => item.id === req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: "ไม่พบพนักงาน" });
    Object.assign(employee, { name: name.trim(), position: position.trim(), salary: parsedSalary });
    return res.json(employee);
  } catch (err) { next(err); }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  if (pool) {
    try {
      const [result] = await pool.query("DELETE FROM Atsadaphon_Employee WHERE Atsadaphon_ID_Employ = ?", [req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ success: false, message: "ไม่พบพนักงาน" });
      return res.json({ success: true });
    } catch (err) { return next(err); }
  }
  const index = employees.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ success: false, message: "ไม่พบพนักงาน" });
  employees.splice(index, 1);
  return res.json({ success: true });
});

function kMeans1D(values, k = 3) {
  if (!values.length) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const count = Math.min(k, sorted.length);
  let centers = Array.from({ length: count }, (_, i) => sorted[Math.floor((i + 0.5) * sorted.length / count)]);
  let groups = [];
  for (let iteration = 0; iteration < 100; iteration++) {
    groups = centers.map(() => []);
    for (const value of values) {
      let closest = 0;
      for (let i = 1; i < centers.length; i++) if (Math.abs(value - centers[i]) < Math.abs(value - centers[closest])) closest = i;
      groups[closest].push(value);
    }
    const updated = groups.map((group, i) => group.length ? group.reduce((sum, n) => sum + n, 0) / group.length : centers[i]);
    if (updated.every((center, i) => Math.abs(center - centers[i]) < 1e-8)) break;
    centers = updated;
  }
  return groups.map((group, i) => ({ center: group.length ? group.reduce((sum, n) => sum + n, 0) / group.length : centers[i], count: group.length })).filter((group) => group.count > 0).sort((a, b) => a.center - b.center).map((group, i) => ({ group: `Tier ${i + 1}`, centroid: Math.round(group.center * 100) / 100, count: group.count }));
}

app.get("/api/employees/salary-clusters", async (_req, res, next) => {
  try {
    let salaries;
    if (pool) {
      const [rows] = await pool.query("SELECT salary FROM Atsadaphon_Employee");
      salaries = rows.map((row) => Number(row.salary));
    } else salaries = employees.map((employee) => Number(employee.salary));
    salaries = salaries.filter((salary) => Number.isFinite(salary));
    return res.json({ success: true, clusters: kMeans1D(salaries, 3) });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
});

const PORT = Number(process.env.PORT) || 3101;
async function start() {
  if (pool) await initializeDatabase();
  app.listen(PORT, "0.0.0.0", () => console.log(`Atsadaphon HR API listening on port ${PORT}${pool ? " (MySQL)" : " (in-memory)"}`));
}
start().catch((err) => {
  console.error("Could not initialize the HR database:", err.code || err.message || "Unknown database connection error");
  process.exit(1);
});
