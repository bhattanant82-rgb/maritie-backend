// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Helper to generate JWT
function generateToken(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// Register
router.post(
  '/register',
  [
    body('name').isLength({ min: 2 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password } = req.body;
    try {
      // check if user exists
      const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
      if (existing.rowCount > 0) return res.status(400).json({ msg: 'User already exists' });
      const hashed = await bcrypt.hash(password, 10);
      const role = (email === process.env.ADMIN_EMAIL) ? 'admin' : 'user';
      const result = await db.query(
        'INSERT INTO users (full_name, email, password_hash, role, mobile) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, role',
        [name, email, hashed, role, '']
      );
      const token = generateToken(result.rows[0]);
      res.json({ token, role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Login
router.post(
  '/login',
  [body('email').isEmail(), body('password').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    try {
      const result = await db.query('SELECT * FROM users WHERE email=$1', [email]);
      if (result.rowCount === 0) return res.status(400).json({ msg: 'Invalid credentials' });
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
      // Map full_name to name for token generation if needed
      user.name = user.full_name;
      const token = generateToken(user);
      res.json({ token, role: user.role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Get current user (protected)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query('SELECT id, full_name as name, email, role FROM users WHERE id=$1', [decoded.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Invalid token' });
  }
});

module.exports = router;
