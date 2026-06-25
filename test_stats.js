require('dotenv').config({ path: '../.env' });
const jwt = require('jsonwebtoken');

async function getStats() {
  const token = jwt.sign({ id: 1, email: 'anantbhatt9081@gmail.com', role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
  try {
    const response = await fetch("http://localhost:5000/api/admin/stats", {
      headers: { "Authorization": "Bearer " + token }
    });
    console.log(await response.json());
  } catch (err) {
    console.error(err);
  }
}

getStats();
