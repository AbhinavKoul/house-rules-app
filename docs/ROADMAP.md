# Roadmap / Future Feature Pipeline

Features we've agreed we want but haven't built yet. Pick up later; no committed dates.
Each entry links to a detailed design doc where one exists.

## Planned

### WhatsApp host integration
**Status:** designed, not started. Blocked on infra setup (not code).
Two host-directed features: (1) record a booking's amount by WhatsApp reply-to-message,
(2) weekly digest + next-day arrival alerts to the host's number. Guest messaging stays as the
existing free `wa.me` links.
**Blocker:** requires a WhatsApp Business Account + a dedicated number + Meta verification
(the Cloud API is unavoidable — both features need the server to send/receive programmatically).
Build order once the WABA exists: Phase 1 alerts (no webhook) → Phase 2 amount capture (webhook).
**Design:** [WHATSAPP_INTEGRATION_PLAN.md](WHATSAPP_INTEGRATION_PLAN.md)

### Dashboard revenue display
**Status:** not started. Data already captured (`amount_received`), read-side only.
Surface amounts in the admin bookings list and roll into analytics (totals by month/quarter/year
alongside occupancy). Note: the Earnings tab already covers much of this — scope down to whatever
gaps remain when picked up.

### Tax invoices
**Status:** needs a design conversation before any code.
A tax invoice must not silently change when the amount is later edited (amount is currently freely
editable with no history). Likely needs immutable invoice records, an invoice-number sequence,
date, GST/tax breakdown, business details, PDF generation, and an amount-change audit trail.
**Open question:** does the editable per-booking amount stay source of truth, or do we add a
separate immutable invoice/payment record?

### Auto-flag/cancel future bookings on blacklist
**Status:** not started (noted in ANALYTICS.md future enhancements).
Blacklisting currently blocks only *new* bookings; existing future bookings for that govt ID are
left alone. Consider auto-flagging or cancelling them when a guest is blacklisted.
