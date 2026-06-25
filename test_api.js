const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const dotenvPath = fs.existsSync(path.join(__dirname, '.env')) ? path.join(__dirname, '.env') : path.join(__dirname, '..', '.env');
require('dotenv').config({ path: dotenvPath });

const token = jwt.sign({ id: 2, email: 'bhattanant82@gmail.com', role: 'admin' }, process.env.JWT_SECRET);

console.log('Test token:', token);

async function test() {
  const res = await fetch('http://localhost:5000/api/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const text = await res.text();
  console.log('Profile Response:', res.status, text);
}
test();
