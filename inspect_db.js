const db = require('./db');

async function inspect() {
  try {
    const resUsers = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log("USERS COLUMNS:");
    resUsers.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    const resOrders = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
    console.log("\nORDERS COLUMNS:");
    resOrders.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    
    const resConsult = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'consultations'");
    console.log("\nCONSULTATIONS COLUMNS:");
    resConsult.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

  } catch (e) {
    console.error('Inspection failed:', e);
  } finally {
    process.exit();
  }
}
inspect();
