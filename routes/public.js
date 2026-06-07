const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/public/banner - Fetch home banner configuration
router.get('/banner', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM home_banner ORDER BY id ASC LIMIT 1');
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({});
    }
  } catch (err) {
    console.error('Error fetching banner:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
