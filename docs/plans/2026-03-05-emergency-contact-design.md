# Emergency Contact Feature Design

## Overview
Add an emergency contact section to the customer booking form (primary guest only). Read-only after submission.

## Fields
- **Emergency Contact Name** — required, text
- **Emergency Contact Phone** — required, tel, 7-20 chars (digits, spaces, dashes, plus)
- **Emergency Contact Relationship** — required, dropdown (Spouse, Parent, Sibling, Child, Friend, Other)

## Customer Portal
- New form section after primary guest details, before booking dates
- All 3 fields required with client + server validation

## Database
- 3 new columns on `acknowledgments`:
  - `emergency_contact_name VARCHAR(255) NOT NULL`
  - `emergency_contact_phone VARCHAR(20) NOT NULL`
  - `emergency_contact_relationship VARCHAR(50) NOT NULL`

## API
- POST `/api/acknowledge` — accepts and validates the 3 new fields
- GET `/api/acknowledgments` — returns emergency contact in response

## Admin Dashboard
- Emergency contact displayed read-only in booking detail modal
- Not editable after submission