const db = require('./db');
db.query("SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status = 'confirmed' OR status = 'delivered'")
  .then(r => { console.log(r.rows); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
