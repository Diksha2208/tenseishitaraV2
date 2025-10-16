// backend/routes/addresses.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/auth"); 
// GET /api/addresses?userID=abc123
router.get("/",  authMiddleware, async (req, res) => {
  const userID = req.user.userID;
console.log(userID)
  

  try {
    const [rows] = await pool.query(
      "SELECT * FROM addresses WHERE userID = ? ORDER BY is_primary DESC, addressID DESC",
      [userID]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET addresses error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/addresses
// body: { userID, fullName, country, address, unit?, city, state, zipCode, phoneNum, is_primary? }
router.post("/",  authMiddleware,async (req, res) => {
  const {
    fullName, country, address, unit = null,
    city, state, zipCode, phoneNum, is_primary = 0,
  } = req.body;
const userID = req.user.userID;
    console.log(userID);
  if (!userID || !fullName || !country || !address || !city || !state || !zipCode || !phoneNum) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // if setting this as primary, unset others for this user
    if (Number(is_primary) === 1) {
      await conn.query("UPDATE addresses SET is_primary = 0 WHERE userID = ?", [userID]);
    }

    const [result] = await conn.query(
      `INSERT INTO addresses 
       (userID, fullName, country, address, unit, city, state, zipCode, phoneNum, is_primary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userID, fullName, country, address, unit, city, state, zipCode, phoneNum, is_primary ? 1 : 0]
    );

    await conn.commit();
    res.status(201).json({ addressID: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error("POST address error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
});

module.exports = router;
