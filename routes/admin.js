// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/admin/stats — real dashboard stats from PostgreSQL
router.get('/stats', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Total products
    const prodResult = await db.query('SELECT COUNT(*) AS count FROM products');
    const totalProducts = parseInt(prodResult.rows[0].count, 10);

    // Total registered customers (non-admin users)
    const custResult = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'user'");
    const totalCustomers = parseInt(custResult.rows[0].count, 10);

    // Total revenue & orders — check if orders table exists
    let totalRevenue = 0;
    let totalOrders = 0;
    try {
      const ordResult = await db.query(
        "SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue FROM orders"
      );
      totalOrders = parseInt(ordResult.rows[0].count, 10);
      totalRevenue = parseFloat(ordResult.rows[0].revenue);
    } catch (e) {
      // orders table doesn't exist yet — that's fine, keep 0
    }

    // Low stock products (stock <= 5)
    const lowStockResult = await db.query('SELECT COUNT(*) AS count FROM products WHERE stock <= 5');
    const lowStockCount = parseInt(lowStockResult.rows[0].count, 10);

    // Overstock products (stock > 200)
    const overstockResult = await db.query('SELECT COUNT(*) AS count FROM products WHERE stock > 200');
    const overstockCount = parseInt(overstockResult.rows[0].count, 10);

    res.json({
      totalProducts,
      totalCustomers,
      totalRevenue,
      totalOrders,
      lowStockCount,
      overstockCount,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/admin/clear-products — remove ALL products (use carefully!)
router.delete('/clear-products', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM products');
    res.json({ msg: `Deleted ${result.rowCount} products` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/admin/notifications - Get all admin notifications
router.get('/notifications', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.*, 
              a.customer_name as apt_name, a.phone as apt_phone, a.service, a.date as booking_date, a.time as booking_time, a.status AS appointment_status,
              o.order_id as ord_id, o.customer_name as ord_name, o.phone as ord_phone, o.total, o.status as order_status
       FROM notifications n 
       LEFT JOIN appointments a ON n.appointment_id = a.id 
       LEFT JOIN orders o ON n.order_id = o.id
       ORDER BY n.created_at DESC LIMIT 50`
    );
    
    const unreadResult = await db.query('SELECT COUNT(*) FROM notifications WHERE is_read = false');
    const unreadCount = parseInt(unreadResult.rows[0].count, 10);
    
    res.json({ notifications: result.rows, unreadCount });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Marked as read' });
  } catch (err) {
    console.error('Update notification error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/appointments/:id/status - Update appointment status (approve/reject)
router.put('/appointments/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }
  
  try {
    const result = await db.query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Appointment not found' });
    res.json({ msg: `Appointment ${status}`, appointment: result.rows[0] });
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/admin/orders - Get all orders
router.get('/orders', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'shipped', 'completed', 'pending'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }
  
  try {
    const result = await db.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Order not found' });
    res.json({ msg: `Order ${status}`, order: result.rows[0] });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/admin/low-stock - Get products with low stock (<= 10)
router.get('/low-stock', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE stock <= 10 ORDER BY stock ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Low stock error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/banner - Update home banner config
router.put('/banner', verifyToken, requireRole('admin'), async (req, res) => {
  const { title, subtitle, button_text, button_link, button_enabled, image_url, video_url } = req.body;
  try {
    // Check if row exists
    const check = await db.query('SELECT id FROM home_banner LIMIT 1');
    if (check.rows.length > 0) {
      const id = check.rows[0].id;
      const result = await db.query(
        `UPDATE home_banner SET 
          title = $1, subtitle = $2, button_text = $3, button_link = $4, 
          button_enabled = $5, image_url = $6, video_url = $7 
         WHERE id = $8 RETURNING *`,
        [title, subtitle, button_text, button_link, button_enabled, image_url || '', video_url || '', id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await db.query(
        `INSERT INTO home_banner (title, subtitle, button_text, button_link, button_enabled, image_url, video_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, subtitle, button_text, button_link, button_enabled, image_url || '', video_url || '']
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Update banner error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/admin/consultations
router.get('/consultations', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM consultations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch consultations error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/consultations/:id/status
router.put('/consultations/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending Payment', 'Pending Approval', 'Confirmed', 'Meeting Scheduled', 'In Progress', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }
  
  try {
    const result = await db.query('UPDATE consultations SET booking_status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Consultation not found' });
    
    // Create Notification for user if applicable
    if (status === 'Confirmed') {
      await db.query(
        `INSERT INTO notifications (title, message, type, user_id) VALUES ($1, $2, 'consultation', $3)`,
        ['Consultation Approved', `Your consultation booking (${result.rows[0].booking_id}) has been approved.`, result.rows[0].user_id]
      );
    }
    
    res.json({ msg: `Consultation ${status}`, consultation: result.rows[0] });
  } catch (err) {
    console.error('Update consultation status error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/consultations/:id/meeting
router.put('/consultations/:id/meeting', verifyToken, requireRole('admin'), async (req, res) => {
  const { meetingLink, meetingDate, meetingTime } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE consultations SET meeting_link = $1, meeting_date = $2, meeting_time = $3, booking_status = 'Meeting Scheduled' WHERE id = $4 RETURNING *`, 
      [meetingLink, meetingDate, meetingTime, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Consultation not found' });
    
    // Notify user
    await db.query(
      `INSERT INTO notifications (title, message, type, user_id) VALUES ($1, $2, 'consultation', $3)`,
      ['Meeting Scheduled', `Your consultation meeting (${result.rows[0].booking_id}) is scheduled for ${meetingDate} at ${meetingTime}.`, result.rows[0].user_id]
    );
    
    res.json({ msg: `Meeting scheduled`, consultation: result.rows[0] });
  } catch (err) {
    console.error('Schedule meeting error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
