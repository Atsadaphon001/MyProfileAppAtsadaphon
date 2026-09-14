const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs"); // เพิ่ม bcryptjs เพื่อความปลอดภัยของรหัสผ่าน
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ===============================
// MySQL Connection Pool
// ===============================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ip_std6730251387",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00",
});

const sessions = new Map();
const demoPasswords = new Map([
  ["admin", "admin"],
  ["user", "user"],
]);

function getSession(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  return token ? sessions.get(token) : null;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  const role = String(user.username || "").trim().toLowerCase() === "admin"
    ? "admin"
    : (user.role || "user");
  sessions.set(token, {
    id: user.id || user.user_id,
    username: user.username,
    name: user.name || user.username,
    role,
  });
  return token;
}

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ success: false, message: "เฉพาะผู้ดูแลระบบเท่านั้นที่ทำรายการนี้ได้" });
  }
  req.session = session;
  next();
}

function requireSession(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบก่อน" });
  }
  req.session = session;
  next();
}

const defaultSeedProducts = [
  { id: 10001, productCode: "LHC3249", product_name: "Energetic One Touch Tumbler", brand: "LocknLock", category: "แก้วเก็บความเย็น", color: "เลือกสีได้", storage: "550ml", price: 750, stock: 10, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop", description: "แก้วเก็บอุณหภูมิฝาเปิดแบบกดครั้งเดียว ความจุ 550 มล.", status: "Available" },
  { id: 10002, productCode: "LHC4320", product_name: "V Project Flat Table Mug", brand: "LocknLock", category: "แก้วเก็บความเย็น", color: "เลือกสีได้", storage: "730ml", price: 835, stock: 0, image: "https://images.unsplash.com/photo-1594700406777-45f8f9e6f2f3?q=80&w=600&auto=format&fit=crop", description: "แก้วทรง Mug สำหรับเครื่องดื่ม ความจุ 730 มล.", status: "Out of Stock" },
  { id: 10003, productCode: "LHC4246", product_name: "Wanna Be Tumbler Carry", brand: "LocknLock", category: "แก้วเดินทาง", color: "เลือกสีได้", storage: "450ml", price: 695, stock: 12, image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop", description: "กระบอกน้ำพกพาเก็บอุณหภูมิ ความจุ 450 มล.", status: "Available" },
  { id: 10004, productCode: "LHC4282", product_name: "Metro Mug", brand: "LocknLock", category: "แก้วเก็บความเย็น", color: "เลือกสีได้", storage: "600ml", price: 770, stock: 10, image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=600&auto=format&fit=crop", description: "แก้ว Metro Mug เก็บอุณหภูมิ ความจุ 600 มล.", status: "Available" },
  { id: 10005, productCode: "LHC4277S", product_name: "Metro Drive Tumbler", brand: "LocknLock", category: "แก้วเดินทาง", color: "เลือกสีได้", storage: "650ml", price: 795, stock: 8, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=600&auto=format&fit=crop", description: "แก้ว Tumbler สำหรับพกพา ความจุ 650 มล.", status: "Available" },
  { id: 10006, productCode: "LHC4274", product_name: "Metro Two Way Tumbler", brand: "LocknLock", category: "แก้วเก็บความเย็น", color: "เลือกสีได้", storage: "475ml", price: 835, stock: 0, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop", description: "แก้วเก็บอุณหภูมิ Metro แบบใช้งานได้สองรูปแบบ ความจุ 475 มล.", status: "Out of Stock" },
  { id: 10007, productCode: "LHC4276", product_name: "Shake It Bottle Pro Stainless", brand: "LocknLock", category: "สายออกกำลังกาย", color: "สเตนเลส", storage: "650ml", price: 780, stock: 9, image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=600&auto=format&fit=crop", description: "กระบอกน้ำสเตนเลสสำหรับเครื่องดื่ม ความจุ 650 มล.", status: "Available" },
  { id: 10008, productCode: "HAP509", product_name: "Double Wall Cold Cup", brand: "LocknLock", category: "แก้วกาแฟ", color: "เลือกสีได้", storage: "720ml", price: 250, stock: 15, image: "https://images.unsplash.com/photo-1589365278144-c9e705f843ba?q=80&w=600&auto=format&fit=crop", description: "แก้วน้ำผนังสองชั้นสำหรับเครื่องดื่มเย็น ความจุ 720 มล.", status: "Available" },
  { id: 10009, productCode: "LHC3292", product_name: "The First One Touch Tumbler", brand: "LocknLock", category: "แก้วเก็บความเย็น", color: "เลือกสีได้", storage: "480ml", price: 750, stock: 0, image: "https://images.unsplash.com/photo-1570784332176-fdd73da66f03?q=80&w=600&auto=format&fit=crop", description: "แก้วเก็บอุณหภูมิฝาเปิดแบบกดครั้งเดียว ความจุ 480 มล.", status: "Out of Stock" },
  { id: 10010, productCode: "LHC4219", product_name: "Metro Mug", brand: "LocknLock", category: "แก้วเก็บความเย็น", color: "เลือกสีได้", storage: "475ml", price: 695, stock: 0, image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=600&auto=format&fit=crop", description: "แก้ว Metro Mug เก็บอุณหภูมิ ความจุ 475 มล.", status: "Out of Stock" },
];

async function ensureUsersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const userCols = [
      { name: "email", def: "VARCHAR(255) NULL" },
      { name: "name", def: "VARCHAR(255) NULL" },
      { name: "role", def: "VARCHAR(50) DEFAULT 'user'" },
      { name: "created_at", def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
    ];
    for (const col of userCols) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
      } catch (err) {
        if (err.code !== "ER_DUP_FIELDNAME") {
          // ignore already existing
        }
      }
    }

    // สร้าง admin เริ่มต้นใน MySQL ถ้ายังไม่มี
    const [existingAdmin] = await pool.query("SELECT id FROM users WHERE LOWER(username) = 'admin'");
    if (existingAdmin.length === 0) {
      const adminPass = await bcrypt.hash("admin", 10);
      await pool.query(
        "INSERT INTO users (username, email, password, name, role) VALUES (?, ?, ?, ?, 'admin')",
        ["admin", "admin@gmail.com", adminPass, "Administrator"]
      );
      console.log("✅ Created default admin in phpMyAdmin users table");
    }
  } catch (err) {
    console.warn("Users table init warning:", err.message);
  }
}

async function ensureProductsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        productCode VARCHAR(100) NULL,
        brand VARCHAR(100) NULL,
        category VARCHAR(100) NULL,
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        color VARCHAR(100) NULL,
        storage VARCHAR(100) NULL,
        ram VARCHAR(100) NULL,
        image MEDIUMTEXT NULL,
        description TEXT NULL,
        status VARCHAR(50) DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const columnsToAdd = [
      { name: "product_name", def: "VARCHAR(255) NULL" },
      { name: "productCode", def: "VARCHAR(100) NULL" },
      { name: "brand", def: "VARCHAR(100) NULL" },
      { name: "category", def: "VARCHAR(100) NULL" },
      { name: "price", def: "DECIMAL(12,2) NOT NULL DEFAULT 0" },
      { name: "stock", def: "INT NOT NULL DEFAULT 0" },
      { name: "color", def: "VARCHAR(100) NULL" },
      { name: "storage", def: "VARCHAR(100) NULL" },
      { name: "ram", def: "VARCHAR(100) NULL" },
      { name: "image", def: "MEDIUMTEXT NULL" },
      { name: "description", def: "TEXT NULL" },
      { name: "status", def: "VARCHAR(50) DEFAULT 'Available'" },
      { name: "created_at", def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
    ];

    for (const col of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.def}`);
      } catch (err) {
        if (err.code !== "ER_DUP_FIELDNAME") {
          // column already exists
        }
      }
    }

    try {
      await pool.query("UPDATE products SET product_name = name WHERE (product_name IS NULL OR product_name = '') AND name IS NOT NULL");
    } catch (err) {}

  } catch (err) {
    console.warn("Products table init warning:", err.message);
  }
}

async function ensureOrderTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        customer_name VARCHAR(120) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        address TEXT NOT NULL,
        payment_method VARCHAR(30) NOT NULL DEFAULT 'cod',
        slip_url MEDIUMTEXT NULL,
        total DECIMAL(12,2) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try { await pool.query("ALTER TABLE orders ADD COLUMN slip_url MEDIUMTEXT NULL"); } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME") throw err;
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        quantity INT NOT NULL
      )
    `);
  } catch (err) {
    console.warn("Order tables init warning:", err.message);
  }
}

// ===============================
// TEST API
// ===============================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ChillCup API is running",
    version: "2.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, service: "chillcup-api", version: "2.0.0" });
});

// ===============================
// REGISTER API (สมัครสมาชิก)
// ===============================
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอก Username และ Password",
      });
    }

    if (String(username).trim() === "admin" && String(password).trim() === "admin") {
      const user = { id: 0, username: "admin", name: "Administrator", role: "admin" };
      return res.json({ success: true, message: "เข้าสู่ระบบ Admin สำเร็จ", user, token: createSession(user) });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = email ? String(email).trim() : null;

    // 1. ตรวจสอบว่า Username หรือ Email เคยสมัครไว้แล้วหรือไม่
    let checkSql = "SELECT id, username, email FROM users WHERE username = ?";
    const checkParams = [cleanUsername];

    if (cleanEmail) {
      checkSql += " OR email = ?";
      checkParams.push(cleanEmail);
    }

    const [existingUsers] = await pool.query(checkSql, checkParams);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers.find(
        (user) => user.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username นี้ถูกใช้งานไปแล้ว",
        });
      }

      if (cleanEmail) {
        const existingEmail = existingUsers.find(
          (user) => user.email && user.email.toLowerCase() === cleanEmail.toLowerCase()
        );
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email นี้ถูกใช้งานไปแล้ว",
          });
        }
      }
    }

    // 2. เข้ารหัส Password ด้วย bcrypt
    const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

    // 3. บันทึกผู้ใช้ใหม่ลงใน Database
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, name, role) VALUES (?, ?, ?, ?, 'user')",
      [
        cleanUsername,
        cleanEmail,
        hashedPassword,
        name ? String(name).trim() : cleanUsername,
      ]
    );

    res.status(201).json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Database Error",
      error: err.message,
    });
  }
});

// ===============================
// LOGIN API (เข้าสู่ระบบ)
// ===============================
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอก Username และ Password",
      });
    }

    const demoUsername = String(username).trim().toLowerCase();
    const demoPassword = String(password).trim();
    if ((demoUsername === "admin" || demoUsername === "user") && demoPasswords.get(demoUsername) === demoPassword) {
      const demoUser = demoUsername === "admin"
        ? { id: 0, username: "admin", name: "Administrator", role: "admin" }
        : { id: 1, username: "user", name: "Demo Customer", role: "user" };
      return res.json({ success: true, message: "เข้าสู่ระบบสำเร็จ", user: demoUser, token: createSession(demoUser) });
    }

    // ดึงข้อมูล User จากตาราง users
    const [users] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [String(username).trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    const user = users[0];

    // ตรวจสอบ Password (รองรับทั้ง bcrypt และ plaintext สำหรับข้อมูลเก่า)
    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(String(password).trim(), user.password);
    } else {
      isMatch = user.password === String(password).trim();
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id || user.user_id,
        username: user.username,
        email: user.email || "",
        name: user.name || user.username,
        role: String(user.username || "").trim().toLowerCase() === "admin" ? "admin" : (user.role || "user"),
      },
      token: createSession(user),
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Database Error",
      error: err.message,
    });
  }
});

// ===============================
// CHANGE PASSWORD API
// ===============================
app.put("/api/account/password", requireSession, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const cleanCurrentPassword = String(currentPassword || "").trim();
    const cleanNewPassword = String(newPassword || "").trim();

    if (!cleanCurrentPassword || cleanNewPassword.length < 6) {
      return res.status(400).json({ success: false, message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    const username = String(req.session.username).trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(cleanNewPassword, 10);

    if (demoPasswords.has(username)) {
      if (demoPasswords.get(username) !== cleanCurrentPassword) {
        return res.status(401).json({ success: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      }
      demoPasswords.set(username, cleanNewPassword);
      try {
        await pool.query("UPDATE users SET password = ? WHERE LOWER(username) = ?", [hashedPassword, username]);
      } catch (err) {
        console.warn("MySQL user password update note:", err.message);
      }
      return res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    }

    const [users] = await pool.query("SELECT id, password FROM users WHERE id = ?", [req.session.id]);
    if (!users.length) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
    }

    const storedPassword = String(users[0].password || "");
    const isMatch = storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")
      ? await bcrypt.compare(cleanCurrentPassword, storedPassword)
      : storedPassword === cleanCurrentPassword;
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    const newHashedPassword = await bcrypt.hash(cleanNewPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [newHashedPassword, req.session.id]);
    res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "ไม่สามารถเปลี่ยนรหัสผ่านได้" });
  }
});

// ===============================
// GET PRODUCTS (รองรับการค้นหาผ่าน ?q=)
// ===============================
app.get("/api/products", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  const searchQuery = req.query.q ? String(req.query.q).trim() : "";
  try {
    let sql = `
      SELECT
        id,
        COALESCE(product_name, '') AS product_name,
        COALESCE(productCode, '') AS productCode,
        COALESCE(brand, '') AS brand,
        COALESCE(category, '') AS category,
        COALESCE(price, 0) AS price,
        COALESCE(stock, 0) AS stock,
        COALESCE(color, '') AS color,
        COALESCE(storage, '') AS storage,
        COALESCE(ram, '') AS ram,
        COALESCE(image, '') AS image,
        COALESCE(description, '') AS description,
        COALESCE(status, 'Available') AS status,
        created_at
      FROM products
    `;

    const queryParams = [];

    if (searchQuery) {
      sql += ` WHERE product_name LIKE ? OR brand LIKE ? OR category LIKE ? OR productCode LIKE ?`;
      const term = `%${searchQuery}%`;
      queryParams.push(term, term, term, term);
    }

    sql += ` ORDER BY id ASC`;

    const [rows] = await pool.query(sql, queryParams);
    return res.json(rows);
  } catch (err) {
    console.warn("GET PRODUCTS DB ERROR:", err.message);
    res.status(500).json({ success: false, message: "Database Error", error: err.message });
  }
});

// ===============================
// ADD PRODUCT
// ===============================
app.post("/api/products", requireAdmin, async (req, res) => {
  try {
    const {
      product_name,
      productCode,
      brand,
      category,
      price,
      stock,
      color,
      storage,
      ram,
      image,
      description,
      status,
    } = req.body;

    if (!product_name || !String(product_name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO products
      (
        product_name,
        productCode,
        brand,
        category,
        price,
        stock,
        color,
        storage,
        ram,
        image,
        description,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        String(product_name).trim(),
        productCode || null,
        brand || null,
        category || null,
        Number(price) || 0,
        Number(stock) || 0,
        color || null,
        storage || null,
        ram || null,
        image || null,
        description || null,
        status || "Available",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      productId: result.insertId,
    });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Database Error",
      error: err.message,
    });
  }
});

// ===============================
// EDIT PRODUCT
// ===============================
app.put("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const {
      product_name,
      productCode,
      brand,
      category,
      price,
      stock,
      color,
      storage,
      ram,
      image,
      description,
      status,
    } = req.body;

    if (!product_name || !String(product_name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE products
      SET
        product_name=?,
        productCode=?,
        brand=?,
        category=?,
        price=?,
        stock=?,
        color=?,
        storage=?,
        ram=?,
        image=?,
        description=?,
        status=?
      WHERE id=?
      `,
      [
        String(product_name).trim(),
        productCode || null,
        brand || null,
        category || null,
        Number(price) || 0,
        Number(stock) || 0,
        color || null,
        storage || null,
        ram || null,
        image || null,
        description || null,
        status || "Available",
        productId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      productId,
    });
  } catch (err) {
    console.error("EDIT PRODUCT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Database Error",
      error: err.message,
    });
  }
});

// ===============================
// DELETE PRODUCT
// ===============================
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const [result] = await pool.query(
      "DELETE FROM products WHERE id=?",
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Database Error",
      error: err.message,
    });
  }
});

// ===============================
// CREATE ORDER (ตัดสต็อกแบบ transaction)
// ===============================
app.post("/api/orders", requireSession, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const session = req.session;
    const { items, customerName, phone, address, paymentMethod = "cod", slipUrl = null } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !customerName || !phone || !address) {
      return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลการสั่งซื้อให้ครบถ้วน" });
    }
    if (paymentMethod === "transfer" && !slipUrl) {
      return res.status(400).json({ success: false, message: "กรุณาแนบสลิปโอนเงินก่อนยืนยันคำสั่งซื้อ" });
    }

    await connection.beginTransaction();
    const lockedItems = [];
    let total = 0;
    for (const item of items) {
      const quantity = Number(item.quantity);
      const productId = Number(item.productId);
      if (!Number.isInteger(quantity) || quantity < 1 || !Number.isInteger(productId)) {
        throw new Error("รายการสินค้าไม่ถูกต้อง");
      }
      const [rows] = await connection.query(
        "SELECT id, product_name, price, stock FROM products WHERE id=? FOR UPDATE",
        [productId]
      );
      const product = rows[0];
      if (!product) throw new Error("ไม่พบสินค้าบางรายการ");
      if (product.stock < quantity) throw new Error(`สินค้า ${product.product_name} เหลือไม่พอ`);
      total += Number(product.price) * quantity;
      lockedItems.push({ ...product, quantity });
    }

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, customer_name, phone, address, payment_method, slip_url, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [session?.id || null, String(customerName).trim(), String(phone).trim(), String(address).trim(), paymentMethod, slipUrl, total, paymentMethod === "transfer" ? "awaiting_verification" : "pending"]
    );
    for (const item of lockedItems) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)",
        [orderResult.insertId, item.id, item.product_name, item.price, item.quantity]
      );
      if (paymentMethod !== "transfer") {
        await connection.query("UPDATE products SET stock = stock - ? WHERE id=?", [item.quantity, item.id]);
      }
    }
    await connection.commit();
    res.status(201).json({ success: true, orderId: orderResult.insertId, total });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ success: false, message: err.message || "ไม่สามารถสร้างคำสั่งซื้อได้" });
  } finally {
    connection.release();
  }
});

app.get("/api/orders", requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.query("SELECT id, customer_name, phone, address, payment_method, slip_url, total, status, created_at FROM orders ORDER BY id DESC");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: "ไม่สามารถโหลดคำสั่งซื้อได้" });
  }
});

app.patch("/api/orders/:id/verify-payment", requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query("SELECT * FROM orders WHERE id=? FOR UPDATE", [Number(req.params.id)]);
    const order = orders[0];
    if (!order || order.status !== "awaiting_verification") return res.status(400).json({ success: false, message: "คำสั่งซื้อไม่อยู่ในสถานะรอตรวจสอบ" });
    const [items] = await connection.query("SELECT product_id, quantity FROM order_items WHERE order_id=?", [order.id]);
    for (const item of items) {
      const [products] = await connection.query("SELECT stock, product_name FROM products WHERE id=? FOR UPDATE", [item.product_id]);
      if (!products[0] || products[0].stock < item.quantity) throw new Error(`สินค้า ${products[0]?.product_name || "บางรายการ"} เหลือไม่พอ`);
      await connection.query("UPDATE products SET stock=stock-? WHERE id=?", [item.quantity, item.product_id]);
    }
    await connection.query("UPDATE orders SET status='paid' WHERE id=?", [order.id]);
    await connection.commit();
    res.json({ success: true, message: "ยืนยันการชำระเงินแล้ว" });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ success: false, message: err.message || "ตรวจสอบสลิปไม่สำเร็จ" });
  } finally { connection.release(); }
});

// ===============================
// 404
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = Number(process.env.PORT) || 3026;

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL Connected");

    const [rows] = await conn.query("SELECT DATABASE() AS db");
    console.log("Current Database:", rows[0].db);

    await ensureUsersTable();
    await ensureProductsTable();
    await ensureOrderTables();
    console.log("Database tables ready");

    conn.release();
  } catch (err) {
    console.error("❌ MySQL Connection Error");
    console.error(err);
  }
})();

app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ API: http://localhost:${PORT}/api/products`);
  console.log("=================================");
});
