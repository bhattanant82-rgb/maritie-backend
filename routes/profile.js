// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get own profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, full_name as name, email, mobile, dob, tob, pob FROM users WHERE id=$1', [req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update profile (name, mobile)
router.put(
  '/',
  verifyToken,
  [
    body('name').optional().isLength({ min: 2 }).trim().escape(),
    body('mobile').optional().isLength({ min: 2 }).trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, mobile, dob, tob, pob } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`full_name=$${idx++}`); values.push(name); }
    if (mobile !== undefined) { fields.push(`mobile=$${idx++}`); values.push(mobile); }
    if (dob !== undefined) { fields.push(`dob=$${idx++}`); values.push(dob || null); }
    if (tob !== undefined) { fields.push(`tob=$${idx++}`); values.push(tob || null); }
    if (pob !== undefined) { fields.push(`pob=$${idx++}`); values.push(pob || null); }
    if (fields.length === 0) return res.status(400).json({ msg: 'No fields to update' });
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id=$${idx} RETURNING id, full_name as name, email, mobile, dob, tob, pob`;
    values.push(req.user.id);
    try {
      const result = await db.query(sql, values);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Change password
router.put(
  '/password',
  verifyToken,
  [body('oldPassword').exists(), body('newPassword').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { oldPassword, newPassword } = req.body;
    try {
      const userResult = await db.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
      const bcrypt = require('bcryptjs');
      const match = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
      if (!match) return res.status(400).json({ msg: 'Old password incorrect' });
      const hashed = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hashed, req.user.id]);
      res.json({ msg: 'Password updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// --- ADDRESSES ---

// Get all addresses
router.get('/addresses', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add new address
router.post('/addresses', verifyToken, async (req, res) => {
  const { type, name, phone, street, city, state, zip, country, is_default } = req.body;
  if (!name || !phone || !street || !city || !state || !zip) {
    return res.status(400).json({ msg: 'Please provide all required fields' });
  }
  
  try {
    if (is_default) {
      await db.query('UPDATE addresses SET is_default = false WHERE user_id=$1', [req.user.id]);
    }
    
    const result = await db.query(
      `INSERT INTO addresses (user_id, type, name, phone, street, city, state, zip, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, type || 'shipping', name, phone, street, city, state, zip, country || 'India', is_default || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete address
router.delete('/addresses/:id', verifyToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Address not found' });
    res.json({ msg: 'Address deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- NOTIFICATIONS ---

// Get user notifications
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
