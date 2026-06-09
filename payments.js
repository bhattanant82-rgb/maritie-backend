const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const options = {
      amount: Math.round(amount * 100), // paise mein
      currency,
      receipt: receipt || 'receipt_' + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ msg: 'Could not create payment order' });
  }
});

// POST /api/payments/verify
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, msg: 'Payment verified' });
    } else {
      res.status(400).json({ success: false, msg: 'Payment verification failed' });
    }
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ msg: 'Server error during verification' });
  }
});

// GET /api/payments/history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const ordersResult = await db.query(
      `SELECT id, order_id as tx_id, 'Shop Order' as type, total as amount, status, created_at 
       FROM orders WHERE user_id = $1`,
      [req.user.id]
    );
    const consultationsResult = await db.query(
      `SELECT id, booking_id as tx_id, 'Consultation' as type, 100.00 as amount, payment_status as status, created_at 
       FROM consultations WHERE user_id = $1`,
      [req.user.id]
    );
    let history = [...ordersResult.rows, ...consultationsResult.rows];
    history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(history);
  } catch (err) {
    console.error('Fetch payment history error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
