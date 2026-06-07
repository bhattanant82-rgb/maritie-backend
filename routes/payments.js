const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/payments/history
router.get('/history', verifyToken, async (req, res) => {
  try {
    // We fetch and combine payments from 'orders' and 'consultations'
    const ordersResult = await db.query(
      `SELECT id, order_id as tx_id, 'Shop Order' as type, total_amount as amount, status, created_at 
       FROM orders WHERE user_id = $1`,
      [req.user.id]
    );

    const consultationsResult = await db.query(
      `SELECT id, booking_id as tx_id, 'Consultation' as type, 100.00 as amount, payment_status as status, created_at 
       FROM consultations WHERE user_id = $1`,
      [req.user.id]
    );

    let history = [...ordersResult.rows, ...consultationsResult.rows];
    // Sort by created_at descending
    history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(history);
  } catch (err) {
    console.error('Fetch payment history error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
