const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function inspect() {
  const client = await pool.connect();
  try {
    const resUsers = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log("USERS:", resUsers.rows);

    const resOrders = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
    console.log("ORDERS:", resOrders.rows);
    
    const resConsult = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'consultations'");
    console.log("CONSULTATIONS:", resConsult.rows);

  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}
inspect();
