const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/appointments
router.post('/', async (req, res) => {
  const { name, phone, service, date, time, notes } = req.body;
  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ msg: 'Please provide all required fields' });
  }

  try {
    // Insert appointment
    const aptResult = await db.query(
      `INSERT INTO appointments (customer_name, phone, service, date, time, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [name, phone, service, date, time]
    );
    const appointment = aptResult.rows[0];

    // Insert notification for admin
    await db.query(
      `INSERT INTO notifications (title, message, type, appointment_id)
       VALUES ($1, $2, $3, $4)`,
      [
        'New Booking Request',
        `New booking for ${service} by ${name} (${phone}) on ${date} at ${time}.`,
        'booking',
        appointment.id
      ]
    );

    res.status(201).json({ msg: 'Appointment created successfully', appointment });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
