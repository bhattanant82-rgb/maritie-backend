const express = require('express');
const router = express.Router();
const db = require('../db');

// @route   POST /api/orders/checkout
// @desc    Process a new checkout order
// @access  Public
router.post('/checkout', async (req, res) => {
  try {
    const {
      customerName, email, phone,
      dob, tob, pob,
      purpose,
      consultationDate, consultationTime, consultationType,
      cartItems, subtotal, shippingFee, total,
      paymentMethod
    } = req.body;

    // Generate Order ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `ORD-${randomNum}`;

    const newOrder = await db.query(
      `INSERT INTO orders (
        order_id, customer_name, email, phone, 
        dob, tob, pob, purpose, 
        consultation_date, consultation_time, consultation_type,
        cart_items, subtotal, shipping_fee, total, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        orderId, customerName, email, phone,
        dob, tob, pob, purpose,
        consultationDate, consultationTime, consultationType,
        JSON.stringify(cartItems), subtotal, shippingFee, total, paymentMethod
      ]
    );

    // Create Notification for Admin
    await db.query(
      `INSERT INTO notifications (title, message, type, order_id) VALUES ($1, $2, $3, $4)`,
      ['New Checkout Order', `Order ${orderId} received from ${customerName}.`, 'order', newOrder.rows[0].id]
    );

    res.json({ success: true, order: newOrder.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
