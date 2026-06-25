const db = require('./db');
async function run() {
  try {
    const userRes = await db.query("SELECT * FROM users WHERE email = 'bhattanant82@gmail.com'");
    console.log("USER:", userRes.rows);

    const ordersRes = await db.query("SELECT * FROM orders WHERE email = 'bhattanant82@gmail.com'");
    console.log("ORDERS COUNT:", ordersRes.rows.length);
    console.log("ORDERS:", ordersRes.rows.map(o => ({ id: o.order_id, name: o.customer_name, total: o.total })));
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
