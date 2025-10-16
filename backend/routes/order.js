const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/auth"); 
// helper to format numbers
const toMoney = (n) => Number((Number(n) || 0).toFixed(2));

/**
 * POST /api/orders
 * Body:
 * {
 *   userID: string,
 *   addressID: number,
 *   paymentID?: string,
 *   trackingNumber?: string,
 *   items: [{ productID, name, price, quantity }]
 * }
 */
router.post("/", authMiddleware,async (req, res) => {
  const {  addressID, paymentID = null, trackingNumber = null, items } = req.body;
userID = req.user.userID;
  if (!userID) return res.status(400).json({ message: "Missing userID" });
  if (!addressID) return res.status(400).json({ message: "Missing addressID" });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: "Cart is empty" });

  const conn = await pool.getConnection();

  try {
    // ✅ Step 1: Check if address exists for this user
    const [addressRows] = await conn.query(
      "SELECT addressID FROM addresses WHERE addressID = ? AND userID = ?",
      [addressID, userID]
    );
    if (!addressRows.length) {
      conn.release();
      return res.status(404).json({ message: "Address not found for this user" });
    }

    // ✅ Step 2: Calculate order total
    let total = 0;
    const normalized = items.map((it) => {
      const price = toMoney(it.price);
      const qty = Math.max(1, Number(it.quantity) || 1);
      const lineTotal = toMoney(price * qty);
      total += lineTotal;
      return {
        productID: Number(it.productID) || null,
        name: it.name || "Item",
        price,
        quantity: qty,
      };
    });
    total = toMoney(total);

    await conn.beginTransaction();

    // ✅ Step 3: Insert into orders
    const [orderRes] = await conn.query(
      `INSERT INTO orders 
       (userID, addressID, paymentID, total, status, created_at, trackingNumber)
       VALUES (?, ?, ?, ?, 'Order Placed', NOW(), ?)`,
      [userID, addressID, paymentID, total, trackingNumber]
    );
    const orderID = orderRes.insertId;

    // ✅ Step 4: Insert order items
    const insertSQL =
      "INSERT INTO order_items (orderID, productID, name, price, quantity) VALUES (?, ?, ?, ?, ?)";
    for (const it of normalized) {
      await conn.query(insertSQL, [orderID, it.productID, it.name, it.price, it.quantity]);
    }

    await conn.commit();

    res.status(201).json({
      message: "Order placed successfully",
      orderID,
      total,
    });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error placing order:", err);
    res.status(500).json({ message: "Error placing order" });
  } finally {
    conn.release();
  }
});

/**
 * GET /api/orders/:userID
 * Returns all orders for a given user (and their items)
 */
router.get("/:userID", authMiddleware,async (req, res) => {
  const { userID } = req.params;
  const conn = await pool.getConnection();

  try {
    const [orders] = await conn.query(
      "SELECT * FROM orders WHERE userID = ? ORDER BY orderID DESC",
      [userID]
    );
    if (!orders.length) {
      conn.release();
      return res.json([]);
    }

    const orderIDs = orders.map((o) => o.orderID);
    const placeholders = orderIDs.map(() => "?").join(",");
    const [items] = await conn.query(
      `SELECT * FROM order_items WHERE orderID IN (${placeholders})`,
      orderIDs
    );

    const itemMap = new Map();
    for (const it of items) {
      if (!itemMap.has(it.orderID)) itemMap.set(it.orderID, []);
      itemMap.get(it.orderID).push(it);
    }

    const results = orders.map((o) => ({
      ...o,
      items: itemMap.get(o.orderID) || [],
    }));

    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Error fetching orders" });
  } finally {
    conn.release();
  }
});

module.exports = router;
