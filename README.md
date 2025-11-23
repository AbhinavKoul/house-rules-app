# House Rules Acknowledgment App

A web application for viewing and acknowledging house rules. Users can read the house rules and submit their acknowledgment along with their personal information and booking dates.

## API Documentation

### Base URL
- **Production**: `https://house-rules-acknowledgment-91bc2e7022ee.herokuapp.com`
- **Local Development**: `http://localhost:3000`

### Endpoints

#### 1. GET `/`
Main page with house rules viewer and acknowledgment form.

**Response**: HTML page

---

#### 2. POST `/api/acknowledge`
Submit a house rules acknowledgment with guest details and booking dates.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "dob": "1990-05-15",
  "govtIdType": "Aadhar",
  "govtIdNumber": "123456789012",
  "numberOfGuests": 2,
  "numberOfChildren": 1,
  "relationshipType": "Family Members",
  "checkInDate": "2025-12-01",
  "checkOutDate": "2025-12-05",
  "additionalGuests": [
    {
      "name": "Jane Doe",
      "dob": "1992-03-20",
      "govtIdType": "Passport",
      "govtIdNumber": "A1234567"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Acknowledgment recorded successfully",
  "data": {
    "id": 1,
    "acknowledged_at": "2025-11-23T18:59:59.622Z",
    "check_in_date": "2025-12-01",
    "check_out_date": "2025-12-05"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields or validation errors
- `409 Conflict`: Selected dates overlap with existing booking

---

#### 3. GET `/api/acknowledgments`
Retrieve all acknowledgments (admin endpoint).

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "dob": "1990-05-15",
    "govt_id_type": "Aadhar",
    "govt_id_number": "123456789012",
    "number_of_guests": 2,
    "number_of_children": 1,
    "relationship_type": "Family Members",
    "additional_guests": [...],
    "check_in_date": "2025-12-01",
    "check_out_date": "2025-12-05",
    "cancelled": false,
    "acknowledged_at": "2025-11-23T18:59:59.622Z"
  }
]
```

---

#### 4. GET `/api/blocked-dates`
Get all booked date ranges (for preventing double bookings).

**Response** (200 OK):
```json
[
  {
    "check_in_date": "2025-12-01",
    "check_out_date": "2025-12-05"
  },
  {
    "check_in_date": "2025-12-10",
    "check_out_date": "2025-12-15"
  }
]
```

---

#### 5. POST `/api/cancel-booking`
Cancel a booking to free up dates (host override - requires authentication).

**Request Body**:
```json
{
  "bookingId": 1,
  "hostKey": "your-host-key"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Booking cancelled successfully. Dates are now available.",
  "data": {
    "id": 1,
    "check_in_date": "2025-12-01",
    "check_out_date": "2025-12-05"
  }
}
```

**Error Responses**:
- `403 Forbidden`: Invalid host key
- `404 Not Found`: Booking ID not found

**Environment Variable Required**:
Set `HOST_KEY` in your environment variables for authentication.

---

## Features

- HTML viewer for house rules document
- User acknowledgment form with validation
- PostgreSQL database to store acknowledgments
- Date booking system with overlap prevention
- Blocked dates calendar to prevent double bookings
- Support for multiple adults and children
- Individual ID collection for adult guests
- Host override API to cancel bookings
- Same guest can book multiple times with different dates
- Responsive design for mobile and desktop
- Ready for Heroku deployment

## Tech Stack

- Backend: Node.js + Express
- Database: PostgreSQL
- Frontend: HTML, CSS, JavaScript (Vanilla)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Heroku CLI (for deployment)
- Git

## Local Development Setup

1. **Clone or navigate to the repository**
   ```bash
   cd house-rules-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your database URL:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/house_rules_db
   NODE_ENV=development
   PORT=3000
   HOST_KEY=your-secret-host-key-for-cancellations
   ```

4. **Set up local PostgreSQL database**
   ```bash
   # Create database
   createdb house_rules_db

   # The app will automatically create the required table on first run
   ```

5. **Run the application**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Access the application**

   Open your browser and go to: `http://localhost:3000`

## Database Schema

The application uses a single table to store acknowledgments:

```sql
CREATE TABLE acknowledgments (
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

-- Partial unique index to prevent duplicate bookings for same dates
CREATE UNIQUE INDEX unique_active_booking_dates
ON acknowledgments (check_in_date, check_out_date)
WHERE cancelled = FALSE;
```

## Heroku Deployment

### Step 1: Create Heroku App

```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-house-rules-app

# Or if you already have an app name in mind
heroku create your-custom-app-name
```

### Step 2: Add PostgreSQL Database

```bash
# Add Heroku Postgres addon (free tier)
heroku addons:create heroku-postgresql:essential-0

# This automatically sets the DATABASE_URL environment variable
```

### Step 3: Set Environment Variables

```bash
# Set production environment
heroku config:set NODE_ENV=production

# Set host key for booking cancellation API
heroku config:set HOST_KEY=your-secret-host-key-here
```

### Step 4: Initialize Git and Deploy

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - House Rules App"

# Add Heroku remote (if not automatically added)
heroku git:remote -a your-house-rules-app

# Deploy to Heroku
git push heroku main
```

If your default branch is `master`:
```bash
git push heroku master
```

### Step 5: Verify Deployment

```bash
# Open the app in browser
heroku open

# Check logs if there are any issues
heroku logs --tail
```

### Step 6: View Database Records (Optional)

```bash
# Connect to Heroku PostgreSQL
heroku pg:psql

# Query acknowledgments
SELECT * FROM acknowledgments;

# Exit
\q
```

## Updating Your App

After making changes:

```bash
git add .
git commit -m "Description of changes"
git push heroku main
```

## GitHub Repository Setup

### Create Repository on GitHub

1. Go to GitHub and create a new repository
2. Don't initialize with README (we already have one)

### Push to GitHub

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/house-rules-app.git

# Push to GitHub
git push -u origin main
```

If your branch is `master`:
```bash
git push -u origin master
```

## Admin Access

### View All Bookings
To view all acknowledgments, make a GET request to:
```
https://your-app-name.herokuapp.com/api/acknowledgments
```

### View Blocked Dates
To view all booked date ranges:
```
https://your-app-name.herokuapp.com/api/blocked-dates
```

### Cancel a Booking
To cancel a booking and free up dates, make a POST request:
```bash
curl -X POST https://your-app-name.herokuapp.com/api/cancel-booking \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1,
    "hostKey": "your-host-key"
  }'
```

**Note**: Consider adding more robust authentication for these endpoints in production.

## Security Considerations

- The database stores government ID numbers. Ensure compliance with data protection regulations (GDPR, local laws)
- Consider adding authentication for the admin endpoint
- In production, implement rate limiting to prevent abuse
- Consider encrypting sensitive data in the database
- Implement proper access controls and logging

## Form Validation

The app includes both client-side and server-side validation:

- **Email format validation**: Standard email regex pattern
- **Age verification**: All adults must be 18+ years old
- **Government ID format validation**:
  - Aadhar: 12 digits
  - Driving License: 8-20 alphanumeric characters
  - Passport: 6-10 alphanumeric characters
- **Number of guests**: Minimum 1 adult, children can be 0 or more
- **Relationship type**: Required when total people (adults + children) > 1
  - Options: "Married Couple" or "Family Members"
  - Unmarried couples are not allowed
- **Additional guest details**: Required for each adult guest beyond the first
- **Date validation**:
  - Check-in date cannot be in the past
  - Check-out date must be after check-in date
  - Date range cannot overlap with existing bookings
  - Blocked dates are fetched and validated in real-time

## Troubleshooting

### Database connection issues
```bash
# Check if DATABASE_URL is set
heroku config

# Check database status
heroku pg:info
```

### Application crashes
```bash
# View logs
heroku logs --tail

# Restart app
heroku restart
```

### Local development issues
- Ensure PostgreSQL is running locally
- Check that `.env` file exists and has correct DATABASE_URL
- Verify Node.js version matches package.json engines

## License

MIT

## Support

For issues or questions, please create an issue in the GitHub repository.
