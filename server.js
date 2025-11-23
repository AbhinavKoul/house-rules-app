const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize database table
const initDB = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS acknowledgments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      dob DATE NOT NULL,
      govt_id_type VARCHAR(50) NOT NULL,
      govt_id_number VARCHAR(100) NOT NULL,
      acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      UNIQUE(email)
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('Database table initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDB();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Submit acknowledgment
app.post('/api/acknowledge', async (req, res) => {
  const { name, email, dob, govtIdType, govtIdNumber } = req.body;

  // Validation
  if (!name || !email || !dob || !govtIdType || !govtIdNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const query = `
      INSERT INTO acknowledgments (name, email, dob, govt_id_type, govt_id_number, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, acknowledged_at
    `;

    const result = await pool.query(query, [
      name,
      email,
      dob,
      govtIdType,
      govtIdNumber,
      ipAddress
    ]);

    res.json({
      success: true,
      message: 'Acknowledgment recorded successfully',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This email has already acknowledged the house rules' });
    }
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to record acknowledgment' });
  }
});

// Get all acknowledgments (admin endpoint)
app.get('/api/acknowledgments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, dob, govt_id_type, govt_id_number, acknowledged_at FROM acknowledgments ORDER BY acknowledged_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch acknowledgments' });
  }
});

// Check if email already acknowledged
app.get('/api/check-email/:email', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id FROM acknowledgments WHERE email = $1',
      [req.params.email]
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to check email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
