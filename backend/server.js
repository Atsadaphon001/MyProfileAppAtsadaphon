const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs"); // เพิ่ม bcryptjs เพื่อความปลอดภัยของรหัสผ่าน

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

// ===============================
// TEST API
// ===============================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
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
app.post("/api/products", async (req, res) => {
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
app.put("/api/products/:id", async (req, res) => {
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
app.delete("/api/products/:id", async (req, res) => {
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