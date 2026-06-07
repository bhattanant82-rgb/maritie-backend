const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyTokenOptional, verifyToken } = require('../middleware/auth');

// Generate unique booking ID
function generateBookingId() {
  return 'CONS-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// POST /api/consultations
// Create a new consultation request (Pending Payment)
router.post('/', verifyTokenOptional, async (req, res) => {
  const { 
    name, email, phone, 
    dob, tob, pob, 
    consultationType, 
    preferredDate, preferredTime, 
    notes 
  } = req.body;

  if (!name || !email || !phone || !consultationType || !preferredDate || !preferredTime) {
    return res.status(400).json({ msg: 'Please provide all required fields' });
  }

  const userId = req.user ? req.user.id : null;
  const bookingId = generateBookingId();

  try {
    const result = await db.query(
      `INSERT INTO consultations (
        booking_id, user_id, customer_name, email, phone, 
        date_of_birth, time_of_birth, place_of_birth, 
        consultation_type, preferred_date, preferred_time, notes,
        payment_status, booking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending Payment', 'Pending Payment')
      RETURNING *`,
      [bookingId, userId, name, email, phone, dob || null, tob || null, pob || null, consultationType, preferredDate, preferredTime, notes || '']
    );

    res.status(201).json({ msg: 'Consultation created, pending payment', consultation: result.rows[0] });
  } catch (err) {
    console.error('Error creating consultation:', err);
    res.status(500).json({ msg: 'Server error while creating consultation' });
  }
});

// POST /api/consultations/:id/verify-payment
// Mock payment verification and update status
router.post('/:id/verify-payment', async (req, res) => {
  const { method, transactionId } = req.body;
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE consultations 
       SET payment_status = 'Completed', booking_status = 'Pending Approval' 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Consultation not found' });
    }

    const consultation = result.rows[0];

    // Create Admin Notification
    await db.query(
      `INSERT INTO notifications (title, message, type)
       VALUES ($1, $2, 'consultation')`,
      [
        'New Premium Consultation',
        `New paid booking (${consultation.booking_id}) for ${consultation.consultation_type} by ${consultation.customer_name}.`
      ]
    );

    res.json({ msg: 'Payment successful, booking pending approval', consultation });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ msg: 'Server error during payment verification' });
  }
});

// GET /api/consultations/my
// Get consultations for the logged-in user
router.get('/my', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM consultations WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user consultations:', err);
    res.status(500).json({ msg: 'Server error fetching consultations' });
  }
});

module.exports = router;
