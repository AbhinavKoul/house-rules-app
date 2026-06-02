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
      number_of_children INTEGER DEFAULT 0,
      relationship_type VARCHAR(50),
      additional_guests JSONB,
      check_in_date DATE NOT NULL,
      check_out_date DATE NOT NULL,
      cancelled BOOLEAN DEFAULT FALSE,
      acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45)
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
        ALTER TABLE acknowledgments ADD COLUMN number_of_children INTEGER DEFAULT 0;
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
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN check_in_date DATE;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN check_out_date DATE;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN cancelled BOOLEAN DEFAULT FALSE;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN emergency_contact_name VARCHAR(255);
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN emergency_contact_phone VARCHAR(20);
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      BEGIN
        ALTER TABLE acknowledgments ADD COLUMN emergency_contact_relationship VARCHAR(50);
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
    END $$;
  `;

  // Drop old email unique constraint if it exists
  const dropEmailConstraintQuery = `
    DO $$
    BEGIN
      ALTER TABLE acknowledgments DROP CONSTRAINT IF EXISTS acknowledgments_email_key;
    EXCEPTION
      WHEN undefined_object THEN NULL;
    END $$;
  `;

  // Create partial unique index to prevent duplicate bookings for same dates
  const createUniqueIndexQuery = `
    CREATE UNIQUE INDEX IF NOT EXISTS unique_active_booking_dates
    ON acknowledgments (check_in_date, check_out_date)
    WHERE cancelled = FALSE;
  `;

  try {
    await pool.query(createTableQuery);
    await pool.query(alterTableQuery);
    await pool.query(dropEmailConstraintQuery);
    await pool.query(createUniqueIndexQuery);
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
  const { name, email, dob, govtIdType, govtIdNumber, numberOfGuests, numberOfChildren, relationshipType, additionalGuests, checkInDate, checkOutDate, emergencyContactName, emergencyContactPhone, emergencyContactRelationship } = req.body;

  // Validation
  if (!name || !email || !dob || !govtIdType || !govtIdNumber || !numberOfGuests || !checkInDate || !checkOutDate) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate emergency contact fields
  if (!emergencyContactName || !emergencyContactPhone || !emergencyContactRelationship) {
    return res.status(400).json({ error: 'Emergency contact details are required (name, phone, and relationship)' });
  }

  // Validate emergency contact phone format
  const phoneClean = emergencyContactPhone.replace(/[\s\-]/g, '');
  if (!/^\+?\d{7,15}$/.test(phoneClean)) {
    return res.status(400).json({ error: 'Please enter a valid emergency contact phone number (7-15 digits)' });
  }

  const validRelationships = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];
  if (!validRelationships.includes(emergencyContactRelationship)) {
    return res.status(400).json({ error: 'Please select a valid relationship type for emergency contact' });
  }

  // Validate dates
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    return res.status(400).json({ error: 'Check-in date cannot be in the past' });
  }

  if (checkOut <= checkIn) {
    return res.status(400).json({ error: 'Check-out date must be after check-in date' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate number of guests (adults)
  const numGuests = parseInt(numberOfGuests);
  if (isNaN(numGuests) || numGuests < 1) {
    return res.status(400).json({ error: 'Number of adults must be at least 1' });
  }

  // Validate number of children
  const numChildren = numberOfChildren ? parseInt(numberOfChildren) : 0;
  if (isNaN(numChildren) || numChildren < 0) {
    return res.status(400).json({ error: 'Number of children must be 0 or more' });
  }

  // If more than 1 adult or has children, relationship type is required
  const totalPeople = numGuests + numChildren;
  if (totalPeople > 1 && !relationshipType) {
    return res.status(400).json({ error: 'Relationship type is required for multiple people' });
  }

  // Validate additional adult guests details (children don't need IDs)
  if (numGuests > 1) {
    if (!additionalGuests || !Array.isArray(additionalGuests)) {
      return res.status(400).json({ error: 'Additional adult guest details are required' });
    }

    if (additionalGuests.length !== numGuests - 1) {
      return res.status(400).json({ error: 'Number of additional adult guests does not match' });
    }

    // Validate each additional adult guest
    for (let i = 0; i < additionalGuests.length; i++) {
      const guest = additionalGuests[i];
      if (!guest.name || !guest.dob || !guest.govtIdType || !guest.govtIdNumber) {
        return res.status(400).json({ error: `Adult Guest ${i + 2}: All fields are required` });
      }
    }
  }

  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    // Check for overlapping bookings
    const overlapQuery = `
      SELECT id FROM acknowledgments
      WHERE cancelled = FALSE
      AND (
        (check_in_date <= $1 AND check_out_date > $1) OR
        (check_in_date < $2 AND check_out_date >= $2) OR
        (check_in_date >= $1 AND check_out_date <= $2)
      )
    `;

    const overlapResult = await pool.query(overlapQuery, [checkInDate, checkOutDate]);

    if (overlapResult.rows.length > 0) {
      return res.status(409).json({ error: 'These dates are already booked. Please select different dates.' });
    }

    const query = `
      INSERT INTO acknowledgments (name, email, dob, govt_id_type, govt_id_number, number_of_guests, number_of_children, relationship_type, additional_guests, check_in_date, check_out_date, ip_address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, acknowledged_at, check_in_date, check_out_date
    `;

    const result = await pool.query(query, [
      name,
      email,
      dob,
      govtIdType,
      govtIdNumber,
      numGuests,
      numChildren,
      totalPeople > 1 ? relationshipType : null,
      numGuests > 1 ? JSON.stringify(additionalGuests) : null,
      checkInDate,
      checkOutDate,
      ipAddress,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship
    ]);

    res.json({
      success: true,
      message: 'Acknowledgment recorded successfully',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'These dates are already booked' });
    }
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to record acknowledgment' });
  }
});

// Get all acknowledgments (admin endpoint)
app.get('/api/acknowledgments', async (req, res) => {
  // Require authentication
  const hostKey = req.headers['x-host-key'];

  if (!hostKey || hostKey !== process.env.HOST_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing host key' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, dob, govt_id_type, govt_id_number, number_of_guests, number_of_children, relationship_type, additional_guests, check_in_date, check_out_date, cancelled, acknowledged_at, ip_address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship FROM acknowledgments ORDER BY check_in_date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch acknowledgments' });
  }
});

// Get blocked dates (for frontend date picker)
app.get('/api/blocked-dates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT check_in_date, check_out_date FROM acknowledgments WHERE cancelled = FALSE ORDER BY check_in_date'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

// Cancel booking (host override to unblock dates)
app.post('/api/cancel-booking', async (req, res) => {
  const { bookingId, hostKey } = req.body;

  // Validate host key
  if (!hostKey || hostKey !== process.env.HOST_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing host key' });
  }

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE acknowledgments SET cancelled = TRUE WHERE id = $1 RETURNING id, check_in_date, check_out_date',
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Dates are now available.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});


// Update government ID number
app.post('/api/update-govt-id', async (req, res) => {
  const { bookingId, guestIndex, govtIdNumber, hostKey } = req.body;

  // Validate host key
  if (!hostKey || hostKey !== process.env.HOST_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing host key' });
  }

  if (!bookingId || govtIdNumber === undefined) {
    return res.status(400).json({ error: 'Booking ID and government ID number are required' });
  }

  try {
    // If guestIndex is null or undefined, update primary guest
    if (guestIndex === null || guestIndex === undefined) {
      const result = await pool.query(
        'UPDATE acknowledgments SET govt_id_number = $1 WHERE id = $2 RETURNING id, name, govt_id_number',
        [govtIdNumber, bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json({
        success: true,
        message: 'Government ID updated successfully',
        data: result.rows[0]
      });
    } else {
      // Update additional guest's government ID
      const bookingResult = await pool.query(
        'SELECT additional_guests FROM acknowledgments WHERE id = $1',
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const additionalGuests = bookingResult.rows[0].additional_guests || [];

      if (guestIndex < 0 || guestIndex >= additionalGuests.length) {
        return res.status(400).json({ error: 'Invalid guest index' });
      }

      // Update the specific guest's ID
      additionalGuests[guestIndex].govtIdNumber = govtIdNumber;

      const result = await pool.query(
        'UPDATE acknowledgments SET additional_guests = $1 WHERE id = $2 RETURNING id, additional_guests',
        [JSON.stringify(additionalGuests), bookingId]
      );

      res.json({
        success: true,
        message: 'Government ID updated successfully',
        data: result.rows[0]
      });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to update government ID' });
  }
});

// Update date of birth
app.post('/api/update-dob', async (req, res) => {
  const { bookingId, guestIndex, dob, hostKey } = req.body;

  // Validate host key
  if (!hostKey || hostKey !== process.env.HOST_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing host key' });
  }

  if (!bookingId || !dob) {
    return res.status(400).json({ error: 'Booking ID and date of birth are required' });
  }

  // Validate age (must be at least 18 years old)
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18 || birthDate >= today) {
    return res.status(400).json({ error: 'Guest must be at least 18 years old' });
  }

  try {
    // If guestIndex is null or undefined, update primary guest
    if (guestIndex === null || guestIndex === undefined) {
      const result = await pool.query(
        'UPDATE acknowledgments SET dob = $1 WHERE id = $2 RETURNING id, name, dob',
        [dob, bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json({
        success: true,
        message: 'Date of birth updated successfully',
        data: result.rows[0]
      });
    } else {
      // Update additional guest's date of birth
      const bookingResult = await pool.query(
        'SELECT additional_guests FROM acknowledgments WHERE id = $1',
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const additionalGuests = bookingResult.rows[0].additional_guests || [];

      if (guestIndex < 0 || guestIndex >= additionalGuests.length) {
        return res.status(400).json({ error: 'Invalid guest index' });
      }

      // Update the specific guest's DOB
      additionalGuests[guestIndex].dob = dob;

      const result = await pool.query(
        'UPDATE acknowledgments SET additional_guests = $1 WHERE id = $2 RETURNING id, additional_guests',
        [JSON.stringify(additionalGuests), bookingId]
      );

      res.json({
        success: true,
        message: 'Date of birth updated successfully',
        data: result.rows[0]
      });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to update date of birth' });
  }
});

// Update check-in date
app.post('/api/update-check-in-date', async (req, res) => {
  const { bookingId, checkInDate, hostKey } = req.body;

  if (!hostKey || hostKey !== process.env.HOST_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing host key' });
  }

  if (!bookingId || !checkInDate) {
    return res.status(400).json({ error: 'Booking ID and check-in date are required' });
  }

  // Validate check-in date is not in the past
  const newCheckIn = new Date(checkInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (newCheckIn < today) {
    return res.status(400).json({ error: 'Check-in date cannot be in the past' });
  }

  try {
    // Fetch the booking
    const bookingResult = await pool.query(
      'SELECT id, check_in_date, check_out_date, cancelled FROM acknowledgments WHERE id = $1',
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (booking.cancelled) {
      return res.status(400).json({ error: 'Cannot edit a cancelled booking' });
    }

    // Check booking is still active (checkout >= today)
    const checkOutDate = new Date(booking.check_out_date);
    checkOutDate.setHours(0, 0, 0, 0);
    if (checkOutDate < today) {
      return res.status(400).json({ error: 'Cannot edit dates for a completed booking' });
    }

    // Validate new check-in is before existing check-out
    if (newCheckIn >= checkOutDate) {
      return res.status(400).json({ error: 'Check-in date must be before check-out date' });
    }

    // Check for overlapping bookings (excluding this one)
    const overlapQuery = `
      SELECT id FROM acknowledgments
      WHERE cancelled = FALSE AND id != $3
      AND (
        (check_in_date <= $1 AND check_out_date > $1) OR
        (check_in_date < $2 AND check_out_date >= $2) OR
        (check_in_date >= $1 AND check_out_date <= $2)
      )
    `;
    const overlapResult = await pool.query(overlapQuery, [checkInDate, booking.check_out_date, bookingId]);

    if (overlapResult.rows.length > 0) {
      return res.status(409).json({ error: 'These dates overlap with an existing booking. Please select different dates.' });
    }

    const result = await pool.query(
      'UPDATE acknowledgments SET check_in_date = $1 WHERE id = $2 RETURNING id, check_in_date, check_out_date',
      [checkInDate, bookingId]
    );

    res.json({
      success: true,
      message: 'Check-in date updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to update check-in date' });
  }
});

// Get monthly statistics
app.get('/api/statistics/monthly', async (req, res) => {
  const hostKey = req.headers['x-host-key'];

  if (!hostKey || hostKey !== process.env.HOST_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing host key' });
  }

  try {
    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all bookings for the current month
    const query = `
      SELECT
        id,
        check_in_date,
        check_out_date,
        number_of_guests,
        number_of_children,
        cancelled
      FROM acknowledgments
      WHERE (
        (check_in_date >= $1 AND check_in_date <= $2) OR
        (check_out_date >= $1 AND check_out_date <= $2) OR
        (check_in_date <= $1 AND check_out_date >= $2)
      )
      ORDER BY check_in_date
    `;

    const result = await pool.query(query, [monthStart, monthEnd]);
    const bookings = result.rows;

    // Calculate statistics
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => !b.cancelled && new Date(b.check_out_date) >= new Date()).length;
    const completedBookings = bookings.filter(b => !b.cancelled && new Date(b.check_out_date) < new Date()).length;
    const cancelledBookings = bookings.filter(b => b.cancelled).length;

    // Calculate total guests
    let totalAdults = 0;
    let totalChildren = 0;
    bookings.forEach(b => {
      if (!b.cancelled) {
        totalAdults += b.number_of_guests;
        totalChildren += b.number_of_children || 0;
      }
    });

    // Calculate days filled in current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysInMonth = monthEnd.getDate();
    let daysFilled = 0;

    // Create a set of filled dates
    const filledDates = new Set();
    bookings.forEach(booking => {
      if (!booking.cancelled) {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);

        // Iterate through each day of the booking
        let currentDate = new Date(Math.max(checkIn, monthStart));
        const endDate = new Date(Math.min(checkOut, monthEnd));

        while (currentDate < endDate) {
          filledDates.add(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    daysFilled = filledDates.size;
    const fillPercentage = ((daysFilled / daysInMonth) * 100).toFixed(1);

    res.json({
      month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalAdults,
      totalChildren,
      totalGuests: totalAdults + totalChildren,
      daysInMonth,
      daysFilled,
      fillPercentage: parseFloat(fillPercentage)
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Update check-out date
app.post('/api/update-check-out-date', async (req, res) => {
  const { bookingId, checkOutDate, hostKey } = req.body;

  if (!hostKey || hostKey !== process.env.HOST_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing host key' });
  }

  if (!bookingId || !checkOutDate) {
    return res.status(400).json({ error: 'Booking ID and check-out date are required' });
  }

  try {
    // Fetch the booking
    const bookingResult = await pool.query(
      'SELECT id, check_in_date, check_out_date, cancelled FROM acknowledgments WHERE id = $1',
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (booking.cancelled) {
      return res.status(400).json({ error: 'Cannot edit a cancelled booking' });
    }

    // Check booking is still active (current checkout >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentCheckOut = new Date(booking.check_out_date);
    currentCheckOut.setHours(0, 0, 0, 0);
    if (currentCheckOut < today) {
      return res.status(400).json({ error: 'Cannot edit dates for a completed booking' });
    }

    // Validate new check-out is after existing check-in
    const checkInDate = new Date(booking.check_in_date);
    checkInDate.setHours(0, 0, 0, 0);
    const newCheckOut = new Date(checkOutDate);

    if (newCheckOut <= checkInDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Check for overlapping bookings (excluding this one)
    const overlapQuery = `
      SELECT id FROM acknowledgments
      WHERE cancelled = FALSE AND id != $3
      AND (
        (check_in_date <= $1 AND check_out_date > $1) OR
        (check_in_date < $2 AND check_out_date >= $2) OR
        (check_in_date >= $1 AND check_out_date <= $2)
      )
    `;
    const overlapResult = await pool.query(overlapQuery, [booking.check_in_date, checkOutDate, bookingId]);

    if (overlapResult.rows.length > 0) {
      return res.status(409).json({ error: 'These dates overlap with an existing booking. Please select different dates.' });
    }

    const result = await pool.query(
      'UPDATE acknowledgments SET check_out_date = $1 WHERE id = $2 RETURNING id, check_in_date, check_out_date',
      [checkOutDate, bookingId]
    );

    res.json({
      success: true,
      message: 'Check-out date updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to update check-out date' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
