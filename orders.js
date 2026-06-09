const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/orders/checkout
router.post('/checkout', async (req, res) => {
  try {
    const {
      customerName, email, phone,
      dob, tob, pob, purpose,
      consultationDate, consultationTime, consultationType,
      cartItems, subtotal, shippingFee, total,
      paymentMethod, razorpay_payment_id
    } = req.body;

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = await db.query(
      `INSERT INTO orders (
        order_id, customer_name, email, phone,
        dob, tob, pob, purpose,
        consultation_date, consultation_time, consultation_type,
        cart_items, subtotal, shipping_fee, total,
        payment_method, razorpay_payment_id, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'confirmed') RETURNING *`,
      [
        orderId, customerName, email, phone,
        dob||null, tob||null, pob||null, purpose||null,
        consultationDate||null, consultationTime||null, consultationType||null,
        JSON.stringify(cartItems||[]), subtotal||0, shippingFee||0, total||0,
        paymentMethod||'razorpay', razorpay_payment_id||null
      ]
    );

    // Notify admin
    try {
      await db.query(
        `INSERT INTO notifications (title, message, type) VALUES ($1,$2,'order')`,
        ['New Order', `Order ${orderId} received from ${customerName} - ₹${total}`]
      );
    } catch(e) { /* ignore notification error */ }

    res.json({ success: true, order: newOrder.rows[0] });
  } catch (err) {
    console.error('Orders error:', err.message);
    res.status(500).json({ success: false, msg: 'Server error: ' + err.message });
  }
});

// GET /api/orders/my
router.get('/my', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query('SELECT * FROM orders WHERE email = $1 ORDER BY created_at DESC', [decoded.email]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
