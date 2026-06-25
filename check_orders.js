const db = require('./db');

async function migrate() {
  try {
    // Add razorpay_payment_id column if missing
    await db.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255) DEFAULT NULL
    `);
    console.log('✅ Added razorpay_payment_id column');

    // Add razorpay_order_id column if missing
    await db.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255) DEFAULT NULL
    `);
    console.log('✅ Added razorpay_order_id column');

    // Verify columns now exist
    const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position");
    console.log('\nAll columns:', res.rows.map(x => x.column_name).join(', '));

    // Show recent orders with the new columns
    const orders = await db.query("SELECT id, order_id, customer_name, email, total, razorpay_payment_id, razorpay_order_id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5");
    console.log('\nRecent orders:');
    orders.rows.forEach(row => console.log(JSON.stringify(row)));

    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e.message);
    process.exit(1);
  }
}

migrate();
