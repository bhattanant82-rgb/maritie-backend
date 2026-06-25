const db = require('./db');

async function runMigration() {
  console.log('Starting account system DB migration...');
  try {
    // 1. Add user_id column to orders if not exists
    await db.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
    `);
    console.log('Checked/Added user_id to orders table.');

    // 2. Add user_id column to consultations if not exists
    await db.query(`
      ALTER TABLE consultations 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
    `);
    console.log('Checked/Added user_id to consultations table.');

    // 3. Add profile_photo and last_login to users
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_photo TEXT,
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
    `);
    console.log('Checked/Added profile_photo and last_login columns to users table.');

    // 4. Add user_id and is_read to notifications if not exists
    await db.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE
    `);
    console.log('Checked/Added user_id and is_read columns to notifications table.');

    // 5. Create account_activities table
    await db.query(`
      CREATE TABLE IF NOT EXISTS account_activities (
        activity_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Checked/Created account_activities table.');

    // 6. Create wishlist table
    await db.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);
    console.log('Checked/Created wishlist table.');

    // 7. Migrate historical orders: link by email
    const orderMigration = await db.query(`
      UPDATE orders o
      SET user_id = u.id
      FROM users u
      WHERE LOWER(o.email) = LOWER(u.email) AND o.user_id IS NULL
    `);
    console.log(`Migrated ${orderMigration.rowCount} historical orders to their user accounts.`);

    // 8. Migrate historical consultations: link by email
    const consultMigration = await db.query(`
      UPDATE consultations c
      SET user_id = u.id
      FROM users u
      WHERE LOWER(c.email) = LOWER(u.email) AND c.user_id IS NULL
    `);
    console.log(`Migrated ${consultMigration.rowCount} historical consultations to their user accounts.`);

    console.log('Migration finished successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

runMigration();
