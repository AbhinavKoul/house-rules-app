# WhatsApp Host Integration — Plan

**Scope (locked):** two host-directed features only. No guest-facing automation.

1. **Record amount by WhatsApp reply** — on a new booking, get a WhatsApp message on the
   host's number; reply with the amount to update the DB.
2. **Alerts** — weekly digest of upcoming guests + next-day arrival reminder, to the host's number.

Guest messaging stays as the existing free `wa.me` click-to-chat links (each alert line carries one).

## Why this scope is easy

Both messages go **to the host**, who opts in once on their own number. This avoids the two
expensive parts of the WhatsApp Business Platform: guest opt-in tracking and per-recipient
template approval for strangers. We still use the Cloud API (any business-initiated message
needs it), but only ever message one known, consenting number.

## Infra required

- **Meta WhatsApp Cloud API**: a WhatsApp Business Account (WABA) + a **dedicated phone number**
  (cannot also be logged into the normal WhatsApp app — use a second SIM/eSIM/virtual number)
  + Meta Business verification. *Verification is the real lead time: ~days to ~2 weeks.*
- **Webhook** `/api/whatsapp/webhook` (Feature 1 only): GET verify handshake + POST inbound,
  with `X-Hub-Signature-256` validation against the app secret.
- **Templates** submitted to Meta for approval: `new_booking_notify`, `daily_arrivals`, `weekly_digest`.
- **Heroku Scheduler** add-on (free) → runs `scripts/whatsapp-alerts.js` daily + weekly.
- **Env vars:** `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`,
  `WHATSAPP_VERIFY_TOKEN`, `HOST_WHATSAPP_NUMBER`.
- **DB:** small `whatsapp_events` table mapping `sent_message_id -> booking_id` (this is what lets
  the host reply with just the amount — no booking ID typed). Doubles as an idempotency log so a
  replayed webhook can't double-apply an amount.

No new datastore, no queue — existing Postgres + a scheduled script covers both features.

Provider: **Meta Cloud API direct** (recommended — no middleman fee, pay per conversation).
Twilio is faster to wire but adds per-message markup; only worth it to skip raw webhook plumbing.

## Flows

```
Feature 1 — record amount (reply-to-message, no booking ID typed)
  POST /api/acknowledge (new booking)
    → send template new_booking_notify to HOST_WHATSAPP_NUMBER:
      "New booking: Riya, 12-15 Aug, 3 guests. Reply to this message with the amount received."
    → store sent message id -> booking id (whatsapp_events)
  host swipe-replies on that message and types just "5000"
    → Meta → POST /api/whatsapp/webhook (verify signature)
    → webhook payload carries context.id (the replied-to message id)
    → look up booking id from context.id, parse amount ^\d+(\.\d+)?$
    → reuse existing update-amount logic → DB updated
    → (fallback) if not a reply, still accept "42 5000"

Feature 2 — alerts (outbound only, no webhook)
  Heroku Scheduler daily 08:00 IST → query arrivals for tomorrow → template daily_arrivals → host
  Heroku Scheduler weekly Mon      → query next 7 days           → template weekly_digest → host
    (each guest line includes a wa.me link the host taps to chat directly)
```

## Why not a pure tap (no typing)?

A tap alone can't carry an arbitrary amount — the host must enter the number somewhere. What we
remove is the **booking ID**, via **reply-to-message**: WhatsApp's inbound webhook includes
`context.id` (the message being replied to), so we map that back to the booking. Host just
swipe-replies "5000".

- A plain interactive **button** carries a *fixed* payload, so it can't capture a free amount —
  only preset choices (e.g. ₹3000 / ₹5000 / Other). Viable only if amounts are predictable.
- **WhatsApp Flows** (tap → mini amount form, booking id hidden in `flow_token`) give the nicest
  UX but need a published Flow, an encrypted data-exchange endpoint (RSA/AES) and Meta approval —
  too much infra for one property. Reserve for later only if swipe-reply feels clunky.

## Build order

- **Phase 1 — Alerts (Feature 2).** Scheduler + two templates. Outbound only: no webhook, no
  inbound parsing, no reply handling. Lowest risk, ~1 day of code once the WABA exists. Delivers
  the full "weekly view + next-day + tap to message guest" value on its own.
- **Phase 2 — Amount capture (Feature 1).** Add webhook + `new_booking_notify` + reply parser
  wired to the existing `update-amount` path. Self-contained add-on.

## Risks / notes

- **Cost:** low — a few host-directed conversations/day, likely a few $/month. `wa.me` links free.
- **Lead time** is Meta verification + template approval, not code.
- **Security:** webhook is a new public inbound endpoint — validate Meta's signature, treat the
  reply parser as a trust boundary (strict regex, never eval), reuse host-key discipline.
- **Number:** the WhatsApp Business number can't double as the host's personal WhatsApp.
