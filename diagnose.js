const db = require('./db');
async function run() {
  try {
    console.log('\n=== ALL ORDERS IN DATABASE ===');
    const allOrders = await db.query('SELECT order_id, customer_name, email, total, status, created_at FROM orders ORDER BY created_at DESC');
    console.log('Total orders:', allOrders.rows.length);
    allOrders.rows.forEach(o => console.log(` - ${o.order_id} | ${o.customer_name} | ${o.email} | ₹${o.total} | ${o.status}`));

    console.log('\n=== ORDERS FOR bhattanant82@gmail.com (exact) ===');
    const exactMatch = await db.query("SELECT * FROM orders WHERE email = 'bhattanant82@gmail.com'");
    console.log('Count:', exactMatch.rows.length);

    console.log('\n=== ORDERS FOR bhattanant82@gmail.com (case-insensitive) ===');
    const caseMatch = await db.query("SELECT * FROM orders WHERE LOWER(email) = LOWER('bhattanant82@gmail.com')");
    console.log('Count:', caseMatch.rows.length);
    caseMatch.rows.forEach(o => console.log(` - ${o.order_id} | email in DB: "${o.email}" | ₹${o.total}`));

    console.log('\n=== USER RECORD ===');
    const user = await db.query("SELECT id, full_name, email, role, mobile, created_at FROM users WHERE email = 'bhattanant82@gmail.com'");
    console.log('User:', user.rows[0]);

    console.log('\n=== JWT_SECRET CHECK ===');
    console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET value:', process.env.JWT_SECRET);

    console.log('\n=== ORDERS TABLE COLUMNS ===');
    const cols = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position");
    console.log(cols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

    console.log('\n=== CART_ITEMS SAMPLE ===');
    const sample = await db.query("SELECT order_id, cart_items FROM orders LIMIT 3");
    sample.rows.forEach(o => console.log(`${o.order_id}: ${typeof o.cart_items === 'object' ? JSON.stringify(o.cart_items).slice(0,150) : String(o.cart_items).slice(0,150)}`));

  } catch(e) {
    console.error('DIAGNOSTIC ERROR:', e);
  }
  process.exit();
}
run();
