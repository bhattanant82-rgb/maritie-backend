require('dotenv').config({ path: '../.env' });
const jwt = require('jsonwebtoken');

async function testCheckout() {
  const token = jwt.sign({ id: 1, role: 'user', email: 'anantbhatt9081@gmail.com' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
  const data = {
    customerName: "Test User",
    email: "anantbhatt9081@gmail.com",
    phone: "9999999999",
    total: 100,
    cartItems: [{ id: 1, title: "Test Item", price: 100, quantity: 1 }],
    razorpay_payment_id: "pay_MockPaymentId123",
    razorpay_order_id: "order_MockOrderId123",
    payment_status: "Paid"
  };

  try {
    const response = await fetch("http://localhost:5000/api/orders/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(data)
    });
    
    const text = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", text);

    if (response.ok) {
      const db = require('./db');
      const res = await db.query("SELECT id, order_id, customer_name, total, razorpay_payment_id, razorpay_order_id FROM orders ORDER BY created_at DESC LIMIT 1");
      console.log("\nLatest DB record:");
      console.log(JSON.stringify(res.rows[0], null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

testCheckout();
