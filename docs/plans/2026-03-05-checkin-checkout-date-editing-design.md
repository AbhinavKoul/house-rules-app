# Check-in/Check-out Date Editing - Design

## Overview

Allow admins to edit check-in and check-out dates for active bookings when customers make mistakes.

## Decisions

- Dates editable independently (not as a pair)
- Only editable while booking is Active (before checkout date passes) — no 4-day grace period
- Overlap validation against other active bookings (same as booking creation)
- Check-in date must be today or future (same restriction as creation)
- Check-out must be after check-in

## Backend (server.js)

### POST /api/update-check-in-date

- Body: `{ bookingId, checkInDate, hostKey }`
- Validation:
  - HOST_KEY authentication
  - Booking exists and is not cancelled
  - Booking is active (check_out_date >= today)
  - New check-in date is not in the past
  - New check-in date < current check-out date
  - No overlap with other active (non-cancelled) bookings (excluding current booking)

### POST /api/update-check-out-date

- Body: `{ bookingId, checkOutDate, hostKey }`
- Validation:
  - HOST_KEY authentication
  - Booking exists and is not cancelled
  - Booking is active (check_out_date >= today)
  - New check-out date > current check-in date
  - No overlap with other active (non-cancelled) bookings (excluding current booking)

### Overlap check query

Same pattern as booking creation: find any non-cancelled booking (excluding current) where date ranges overlap.

## Frontend (admin.html)

### Editability

Edit buttons shown only when booking is Active. Uses stricter check than `isBookingEditable()` — specifically checks `getBookingStatus(booking) === 'active'`.

### UI Pattern

Same inline edit pattern as DOB and government ID editing:
- Click "Edit" -> date input replaces text + Save/Cancel buttons
- Save -> POST to API -> update DOM + local allBookings state
- Cancel -> revert to original value

### Functions

- `editCheckInDate(bookingId, currentValue)` / `saveCheckInDate(...)` / `cancelEditCheckInDate(...)`
- `editCheckOutDate(bookingId, currentValue)` / `saveCheckOutDate(...)` / `cancelEditCheckOutDate(...)`

## What does NOT change

- Booking creation flow
- Existing edit features (DOB, government ID)
- Database schema (no new columns or tables)
- Cancelled/completed booking behavior
