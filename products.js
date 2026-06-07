const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add a product (Admin only)
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  [
    body('title').notEmpty().trim(),
    body('price').isNumeric(),
    body('category').notEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, price, discount, stock, category, image_path, description } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO products (title, price, discount, stock, category, image_path, description) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, price, discount || 0, stock || 0, category, image_path || '', description || '']
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Update a product (Admin only)
router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [
    body('title').optional().notEmpty().trim(),
    body('price').optional().isNumeric(),
  ],
  async (req, res) => {
    const { id } = req.params;
    const { title, price, discount, stock, category, image_path, description } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title=$${idx++}`); values.push(title); }
    if (price !== undefined) { fields.push(`price=$${idx++}`); values.push(price); }
    if (discount !== undefined) { fields.push(`discount=$${idx++}`); values.push(discount); }
    if (stock !== undefined) { fields.push(`stock=$${idx++}`); values.push(stock); }
    if (category !== undefined) { fields.push(`category=$${idx++}`); values.push(category); }
    if (image_path !== undefined) { fields.push(`image_path=$${idx++}`); values.push(image_path); }
    if (description !== undefined) { fields.push(`description=$${idx++}`); values.push(description); }

    if (fields.length === 0) return res.status(400).json({ msg: 'No fields to update' });

    values.push(id);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`;

    try {
      const result = await db.query(sql, values);
      if (result.rowCount === 0) return res.status(404).json({ msg: 'Product not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Delete a product (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM products WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Product not found' });
    res.json({ msg: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
