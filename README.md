# House Rules Acknowledgment App

A web application for viewing and acknowledging house rules. Users can read a PDF of the house rules and submit their acknowledgment along with their personal information.

## Features

- PDF viewer for house rules document
- User acknowledgment form with validation
- PostgreSQL database to store acknowledgments
- Prevents duplicate submissions (by email)
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
  email VARCHAR(255) NOT NULL UNIQUE,
  dob DATE NOT NULL,
  govt_id_type VARCHAR(50) NOT NULL,
  govt_id_number VARCHAR(100) NOT NULL,
  acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45)
);
```

## API Endpoints

- `GET /` - Main page with PDF viewer and form
- `POST /api/acknowledge` - Submit acknowledgment
- `GET /api/acknowledgments` - Get all acknowledgments (admin)
- `GET /api/check-email/:email` - Check if email already acknowledged

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

To view all acknowledgments, make a GET request to:
```
https://your-app-name.herokuapp.com/api/acknowledgments
```

Consider adding authentication for this endpoint in production.

## Security Considerations

- The database stores government ID numbers. Ensure compliance with data protection regulations (GDPR, local laws)
- Consider adding authentication for the admin endpoint
- In production, implement rate limiting to prevent abuse
- Consider encrypting sensitive data in the database
- Implement proper access controls and logging

## Form Validation

The app includes both client-side and server-side validation:

- Email format validation
- Age verification (must be 18+)
- Government ID format validation:
  - Aadhar: 12 digits
  - Driving License: 8-20 alphanumeric characters
  - Passport: 6-10 alphanumeric characters
- Duplicate email prevention

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
