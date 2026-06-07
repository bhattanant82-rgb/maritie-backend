// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// List all users - admin only
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query('SELECT id, full_name as name, email, role, is_blocked as blocked FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Block / unblock user
router.patch('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  const { blocked } = req.body; // true or false
  const userId = req.params.id;
  try {
    await db.query('UPDATE users SET is_blocked=$1 WHERE id=$2', [blocked, userId]);
    res.json({ msg: 'User status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete user
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const userId = req.params.id;
  try {
    await db.query('DELETE FROM users WHERE id=$1', [userId]);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
