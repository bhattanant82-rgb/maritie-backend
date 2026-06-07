// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const path = require('path');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Custom Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const time = new Date().toISOString().replace('T', ' ').substr(0, 19);
    console.log(`INFO:     ${req.ip.replace('::ffff:', '')} - "${req.method} ${req.originalUrl} HTTP/${req.httpVersion}" ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/public', require('./routes/public'));

// Simple health check
app.get('/', (req, res) => res.send('MARUTIE Backend Running'));

app.listen(PORT, () => {
  console.log(`
  ===========================================
    MARUTIE ASTRO VASTU SERVER STARTED
  ===========================================
    Server:   http://localhost:${PORT}
    Backend:  Node.js + Express + PostgreSQL
  ===========================================
  Waiting for requests...
  `);
});
