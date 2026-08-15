const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

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
// GET PRODUCTS
// ===============================
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY id ASC
    `);

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

    const [rows] = await conn.query(
      "SELECT DATABASE() AS db"
    );

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