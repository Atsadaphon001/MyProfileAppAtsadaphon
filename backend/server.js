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

function getSession(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  return token ? sessions.get(token) : null;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    id: user.id || user.user_id,
    username: user.username,
    name: user.name || user.username,
    role: user.role || "user",
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

async function ensureOrderTables() {
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
      quantity INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
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
    if ((demoUsername === "admin" || demoUsername === "user") && demoPassword === demoUsername) {
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
        role: user.role || "user",
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
// GET PRODUCTS (รองรับการค้นหาผ่าน ?q=)
// ===============================
app.get("/api/products", async (req, res) => {
  try {
    const searchQuery = req.query.q ? String(req.query.q).trim() : "";
    
    let sql = `
      SELECT
        id,
        product_name,
        productCode,
        brand,
        category,
        price,
        stock,
        color,
        storage,
        ram,
        COALESCE(image,'') AS image,
        COALESCE(description,'') AS description,
        COALESCE(status,'Available') AS status,
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

    res.json(rows);
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Database Error",
      error: err.message,
    });
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

    if (!Number.isInteger(productId) || productId <= 0) {
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

    if (!Number.isInteger(productId) || productId <= 0) {
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
app.post("/api/orders", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const session = getSession(req);
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
const PORT = Number(process.env.PORT) || 3101;

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL Connected");

    const [rows] = await conn.query("SELECT DATABASE() AS db");
    console.log("Current Database:", rows[0].db);

    await ensureOrderTables();
    console.log("Order tables ready");

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