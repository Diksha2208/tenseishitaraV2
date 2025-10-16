const express = require('express');
const db = require('../db');
const router = express.Router();
const authMiddleware = require("../middleware/auth"); 
// ----------------- Get cart-----------------
router.get('/', authMiddleware,(req, res) => {
  const sessionId = req.session.id;
  const userId = req.session.user?.id || null;
  console.log(req);
  db.query(
    'SELECT c.id, p.name, p.price, c.quantity, o.option_value, o.image_url FROM carts c LEFT JOIN products p ON c.product_id = p.id LEFT JOIN product_options o ON c.selected_option_id = o.id WHERE c.session_id = ? OR c.user_id = ?',
    [sessionId, userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// ----------------- Add to cart -----------------
router.post('/add',authMiddleware, (req, res) => {
  const sessionId = req.session.id;
  const userId = req.session.user?.id || null;
    console.log(req);
  const { product_id, selected_option_id, quantity } = req.body;

  db.query(
    'INSERT INTO carts (session_id, user_id, product_id, selected_option_id, quantity) VALUES (?, ?, ?, ?, ?)',
    [sessionId, userId, product_id, selected_option_id || null, quantity || 1],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Added to cart' });
    }
  );
});

// ----------------- Clear cart after checkout -----------------
router.delete('/clear', authMiddleware,(req, res) => {
  const sessionId = req.session.id;
  const userId = req.session.user?.id || null;
  db.query(
    'DELETE FROM carts WHERE session_id = ? OR user_id = ?',
    [sessionId, userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Cart cleared' });
    }
  );
});


module.exports = router;
