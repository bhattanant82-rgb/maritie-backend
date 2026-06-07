CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  city VARCHAR(255),
  dob DATE,
  birth_time TIME,
  blocked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  phone VARCHAR(50),
  service VARCHAR(255) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time VARCHAR(50) NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'booking',
  is_read BOOLEAN DEFAULT false,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS home_banner (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) DEFAULT 'Wear the Earth. Own the Street.',
  subtitle VARCHAR(255) DEFAULT 'Essentials 2026',
  button_text VARCHAR(100) DEFAULT 'Explore Collection',
  button_link VARCHAR(255) DEFAULT '#products',
  button_enabled BOOLEAN DEFAULT true,
  image_url TEXT DEFAULT '',
  video_url TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(5,2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  description TEXT,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
