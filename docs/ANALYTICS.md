# Analytics Dashboard Documentation

## Overview
The analytics dashboard provides comprehensive insights into your booking performance and customer behavior, enabling data-driven decisions for property management and marketing campaigns.

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

**Use Cases:**
- Identify peak and off-peak seasons
- Compare year-over-year performance
- Optimize pricing based on demand patterns
- Plan maintenance during low-occupancy periods

### 2. Recurring Customers Dashboard

**Purpose:** Track customer loyalty and identify re-engagement opportunities for targeted marketing campaigns.

**Summary Metrics:**
- Total unique customers
- Recurring customers count
- Recurring rate percentage

**Customer Cards Display:**
Each recurring customer (2+ visits) shows:
- Name and email
- Number of visits (badge)
- First visit date
- Last visit date
- Average days between visits
- Total guests brought across all bookings
- Re-engagement alert (color-coded)

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
      "periodStart": "2026-01-01",
      "periodEnd": "2026-01-31"
    }
  ]
}
```

### GET /api/statistics/recurring-customers
Returns customer loyalty metrics.

**Response:**
```json
{
  "summary": {
    "totalRecurringCustomers": 15,
    "totalCustomers": 50,
    "recurringRate": 30.0
  },
  "customers": [
    {
      "email": "customer@example.com",
      "name": "John Doe",
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
- Revenue tracking per period
- Average booking length trends
- Guest count trends
- Cancellation rate analysis
- Predictive booking forecasts
- Email integration for automated campaigns
- CSV export functionality
- Custom date range selection
- Revenue per available room (RevPAR) metrics
