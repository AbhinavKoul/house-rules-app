# Analytics Dashboard Documentation

## Overview
The analytics dashboard provides comprehensive insights into your booking performance, revenue, and customer behavior, enabling data-driven decisions for property management and marketing campaigns. It has four tabs: **Occupancy Trends**, **Earnings**, **Customers**, and **Recurring Customers**.

## Accessing the Dashboard
1. Navigate to `/analytics.html` on your Heroku app
2. Enter your host key (same as admin panel)
3. Click "Load Dashboard"

Or access from the admin panel by clicking the "📊 Analytics Dashboard" button.

## Features

### 1. Occupancy Trends Dashboard

**Purpose:** Visualize booking performance over time to identify seasonal patterns and optimize pricing strategies.

**Features:**
- **Interactive Bar Chart:** Shows occupancy rate percentage for each period
- **View Options:**
  - Monthly: Last 6-24 months
  - Quarterly: Last 6-24 quarters  
  - Yearly: Last 6-24 years
- **Click to Drill Down:** Click any bar to see all bookings for that period
- **Metrics Displayed:**
  - Occupancy rate (%)
  - Days filled vs. total days
  - Number of bookings
  - Average stay duration for the period

**Use Cases:**
- Identify peak and off-peak seasons
- Compare year-over-year performance
- Optimize pricing based on demand patterns
- Plan maintenance during low-occupancy periods
- Track trends in booking duration (weekend vs. long-term stays)
- Adjust minimum stay requirements based on historical data

### 2. Recurring Customers Dashboard

**Purpose:** Track customer loyalty and identify re-engagement opportunities for targeted marketing campaigns.

**Key Feature:** Customers are identified by their **government ID number** rather than email or name, ensuring accurate tracking even when customers:
- Use different email addresses across bookings
- Have slight variations in their name
- Book through different accounts

**Summary Metrics:**
- Total unique customers (by govt ID)
- Recurring customers count
- Recurring rate percentage
- Average stay duration across all bookings

**Customer Cards Display:**
Each recurring customer (2+ visits) shows:
- Primary name and email (from most recent booking)
- Government ID type and number
- Warning indicators if multiple emails/names used
- Number of visits (badge)
- First visit date
- Last visit date
- Average days between visits
- Total guests brought across all bookings
- Re-engagement alert (color-coded)

**Interactive Features:**
- **Click any customer card** to view complete booking history
- **Click any booking row** (in customer history or period view) to see full details
- Customer History Modal shows:
  - Full customer details
  - All bookings in clickable table format
  - Email used for each booking
  - Active/Completed status badges
  - Customer-specific average stay duration
- Booking Details Modal shows:
  - Complete primary guest information
  - Emergency contact details
  - All additional adult guests with IDs
  - Booking dates and status
  - Acknowledgment timestamp and IP address

**Re-engagement Alerts:**
- 🟢 **Green (Recent):** Last visit < 90 days - Happy customer
- 🟡 **Yellow (Medium):** Last visit 90-180 days - Consider reaching out
- 🔴 **Red (Old):** Last visit > 180 days - Prime for re-engagement campaign

**Marketing Campaign Ideas:**

1. **Loyalty Rewards Program**
   - Target: Customers with 3+ visits
   - Offer: 10% discount on next booking
   - Timing: 30 days before average return interval

2. **Win-Back Campaign**
   - Target: Red alert customers (>180 days)
   - Message: "We miss you! Special offer just for you"
   - Offer: 15-20% discount

3. **Seasonal Reminders**
   - Target: Yellow alert customers (90-180 days)
   - Message: "Planning your next getaway?"
   - Include: Seasonal highlights or new amenities

4. **Anniversary Offers**
   - Target: Near first visit anniversary date
   - Message: "It's been a year since your first visit!"
   - Offer: Personalized thank you discount

### 3. Earnings Dashboard

**Purpose:** Track revenue over time for financial planning and tax preparation.

**Data source:** Each booking has an editable `amount_received` value (set by the host in the admin panel — see [Amount Tracking](#amount-tracking-admin) below). Earnings are computed entirely client-side from the loaded bookings — no dedicated endpoint.

**Attribution rules:**
- Each booking's amount is attributed to the period containing its **check-in date**.
- **Cancelled bookings are excluded** from all earnings figures.

**Summary Cards:**
- **Total Earnings (all time):** Sum of all recorded amounts
- **This Year:** Sum for bookings checking in during the current calendar year
- **Avg. per Recorded Booking:** Total ÷ number of bookings with a non-zero amount
- **Bookings Without Amount:** Count of active bookings that have already started (check-in ≤ today) but still sit at ₹0 — a data-entry gap flag for tax completeness

**Chart & Drill-down:**
- Bar chart of earnings per period, with Monthly/Quarterly/Yearly + periods (6/12/18/24) toggles (matches Occupancy controls)
- Click any bar to see a per-booking amount breakdown for that period; unrecorded bookings show "Not recorded" in red

### 4. Customers Dashboard

**Purpose:** A single view of **every unique customer** (by government ID, not just recurring ones) with editable host-side profile data.

**Summary per card:** Visits, Total Spent, Avg. per Day (total spent ÷ total nights across all their stays), and Last Visit.

**Sorting:** Total Spent, Avg. per Day, Visits, Most Recent Visit, or Name (A→Z).

**Filtering:** All / Prospective / Blacklisted / Normal.

**Views:** Table (compact, default) for scanning many customers at once, or Cards (detailed) for inline editing. In Table view, the per-row **Edit** button opens the full editable card in a modal.

**Editable per customer (saved to `customer_profiles`, keyed by govt ID):**
- **WhatsApp/Phone:** One number per person. Defaults to their most recent booking's number; the host edit overrides it. Validated and normalized with the same +91 rule as the booking form (10-digit Indian numbers get `+91`; others must include a country code).
- **Note:** Free-text "what we think about this guest".
- **Status (single value):** `normal` | `prospective` | `blacklisted`. Green border for prospective, red for blacklisted.

**Blacklist enforcement (hard block):**
When a customer is set to `blacklisted`, any **new** booking whose primary guest *or* any additional adult guest matches that government ID is rejected at submission (`POST /api/acknowledge` returns `403`) with a neutral message. Existing/future bookings already in the system are **not** auto-cancelled.

<a name="amount-tracking-admin"></a>
## Amount Tracking (Admin Panel)

The host records how much was received per booking in the admin panel (`/admin.html`):
- Each booking's details modal has an inline-editable **Amount Received** field.
- Saved via `POST /api/update-amount` (host-key protected).
- This value feeds the Earnings dashboard and the customer Total Spent / Avg. per Day metrics.

## API Endpoints

### GET /api/statistics/occupancy
Returns occupancy data over time.

**Query Parameters:**
- `view`: `monthly` | `quarterly` | `yearly` (default: monthly)
- `periods`: Number of periods to return (default: 12)

**Response:**
```json
{
  "view": "monthly",
  "data": [
    {
      "label": "Jan 2026",
      "occupancyRate": 75.5,
      "filledDays": 23,
      "totalDays": 31,
      "bookings": 3,
      "avgStayDuration": 5,
      "periodStart": "2026-01-01",
      "periodEnd": "2026-01-31"
    }
  ]
}
```

### GET /api/statistics/recurring-customers
Returns customer loyalty metrics grouped by government ID.

**Response:**
```json
{
  "summary": {
    "totalRecurringCustomers": 15,
    "totalCustomers": 50,
    "recurringRate": 30.0,
    "avgStayDuration": 5
  },
  "customers": [
    {
      "govtIdNumber": "123456789012",
      "govtIdType": "Aadhar",
      "email": "current@example.com",
      "allEmails": ["old@example.com", "current@example.com"],
      "name": "John Doe",
      "allNames": ["John Doe", "J. Doe"],
      "hasMultipleEmails": true,
      "hasMultipleNames": true,
      "bookingCount": 3,
      "firstVisit": "2025-06-15",
      "lastVisit": "2026-01-10",
      "daysSinceLastVisit": 45,
      "daysSinceFirstVisit": 352,
      "avgDaysBetweenVisits": 120,
      "totalGuestsBrought": 8,
      "bookings": [...]
    }
  ]
}
```

**Note:** Customers are identified by government ID to ensure accurate tracking across different emails and name variations.

### GET /api/statistics/customers
Returns **all** unique customers (grouped by government ID) joined with their editable profile.

**Response:**
```json
{
  "customers": [
    {
      "govtIdNumber": "123456789012",
      "govtIdType": "Aadhar",
      "name": "John Doe",
      "email": "current@example.com",
      "whatsappNumber": "+919876543210",
      "bookingCount": 3,
      "firstVisit": "2025-06-15",
      "lastVisit": "2026-01-10",
      "totalSpent": 45000.00,
      "totalNights": 12,
      "avgPerDay": 3750.00,
      "note": "Quiet, respectful, left place clean",
      "status": "prospective"
    }
  ]
}
```

`whatsappNumber` falls back to the most recent booking's number when no profile override exists. `status` is one of `normal` | `prospective` | `blacklisted`. Sorted by total spent (descending) by default.

### POST /api/update-customer-profile
Upserts a customer's profile (WhatsApp / note / status). **Host-key protected.**

**Request body:**
```json
{
  "govtIdNumber": "123456789012",
  "whatsappNumber": "9876543210",
  "note": "Quiet, respectful",
  "status": "prospective",
  "hostKey": "..."
}
```

- `whatsappNumber` is normalized (+91 default). Passing an empty string clears it.
- `status` must be `normal` | `prospective` | `blacklisted` if provided; omitting it leaves the existing status unchanged.

### POST /api/update-amount
Updates the amount received for a booking. **Host-key protected.**

**Request body:**
```json
{ "bookingId": 42, "amountReceived": 5000.00, "hostKey": "..." }
```

## Database: `customer_profiles`

Customer-level data lives in a separate table (booking records are unchanged), keyed by government ID:

| Column | Type | Notes |
|--------|------|-------|
| `govt_id_number` | `VARCHAR(100)` PK | Links to `acknowledgments.govt_id_number` |
| `whatsapp_number` | `VARCHAR(20)` | Host-editable, normalized |
| `note` | `TEXT` | Host's private note about the guest |
| `status` | `VARCHAR(20)` | `normal` (default) / `prospective` / `blacklisted` |
| `updated_at` | `TIMESTAMP` | Auto-updated on write |

The table is created automatically on server startup (`initDB`).

## Data Export for Marketing Tools

To export customer data for use in email marketing platforms (Mailchimp, SendGrid, etc.):

1. Load the Recurring Customers dashboard
2. Open browser console (F12)
3. Run: `JSON.stringify(customerData)` (available after dashboard loads)
4. Copy the JSON output
5. Import into your marketing platform

**Recommended Segments:**
- High-value customers: `bookingCount >= 3`
- Win-back targets: `daysSinceLastVisit > 180`
- Active loyalists: `bookingCount >= 2 && daysSinceLastVisit < 90`

## Future Enhancements

Potential additions:
- Immutable tax invoices (invoice number, GST breakdown, PDF) — the editable per-booking amount is currently the source of truth with no change history
- Average booking length trends
- Guest count trends
- Cancellation rate analysis
- Predictive booking forecasts
- Email integration for automated campaigns
- CSV export functionality
- Custom date range selection
- Revenue per available room (RevPAR) metrics
- Auto-flag/cancel existing future bookings when a guest is blacklisted
