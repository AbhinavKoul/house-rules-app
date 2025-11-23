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
      number_of_guests INTEGER DEFAULT 1,
      relationship_type VARCHAR(50),
      additional_guests JSONB,
      acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      UNIQUE(email)
    );
  `;

  // Add new columns if they don't exist (for existing tables)
  const alterTableQuery = `
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN number_of_guests INTEGER DEFAULT 1;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN relationship_type VARCHAR(50);
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN additional_guests JSONB;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
    END $$;
  `;

  try {
    await pool.query(createTableQuery);
    await pool.query(alterTableQuery);
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
  const { name, email, dob, govtIdType, govtIdNumber, numberOfGuests, relationshipType, additionalGuests } = req.body;

  // Validation
  if (!name || !email || !dob || !govtIdType || !govtIdNumber || !numberOfGuests) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate number of guests
  const numGuests = parseInt(numberOfGuests);
  if (isNaN(numGuests) || numGuests < 1) {
    return res.status(400).json({ error: 'Number of guests must be at least 1' });
  }

  // If more than 1 guest, relationship type is required
  if (numGuests > 1 && !relationshipType) {
    return res.status(400).json({ error: 'Relationship type is required for multiple guests' });
  }

  // Validate additional guests details
  if (numGuests > 1) {
    if (!additionalGuests || !Array.isArray(additionalGuests)) {
      return res.status(400).json({ error: 'Additional guest details are required' });
    }

    if (additionalGuests.length !== numGuests - 1) {
      return res.status(400).json({ error: 'Number of additional guests does not match' });
    }

    // Validate each additional guest
    for (let i = 0; i < additionalGuests.length; i++) {
      const guest = additionalGuests[i];
      if (!guest.name || !guest.dob || !guest.govtIdType || !guest.govtIdNumber) {
        return res.status(400).json({ error: `Guest ${i + 2}: All fields are required` });
      }
    }
  }

  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const query = `
      INSERT INTO acknowledgments (name, email, dob, govt_id_type, govt_id_number, number_of_guests, relationship_type, additional_guests, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, acknowledged_at
    `;

    const result = await pool.query(query, [
      name,
      email,
      dob,
      govtIdType,
      govtIdNumber,
      numGuests,
      numGuests > 1 ? relationshipType : null,
      numGuests > 1 ? JSON.stringify(additionalGuests) : null,
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
      'SELECT id, name, email, dob, govt_id_type, govt_id_number, number_of_guests, relationship_type, additional_guests, acknowledged_at FROM acknowledgments ORDER BY acknowledged_at DESC'
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
