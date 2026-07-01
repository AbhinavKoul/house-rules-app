// Self-check for earnings night-proration. Run: node test_earnings_proration.js
// Mirrors the logic in public/analytics.html (nightsInPeriod / proratedAmount).
const assert = require('assert');

function nightsInPeriod(b, start, end) {
  const ci = new Date(b.check_in_date); ci.setHours(0, 0, 0, 0);
  const co = new Date(b.check_out_date); co.setHours(0, 0, 0, 0);
  let n = 0;
  for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
    if (d >= start && d <= end) n++;
  }
  return n;
}
function isSameDayStayInPeriod(b, start, end) {
  const ci = new Date(b.check_in_date); ci.setHours(0, 0, 0, 0);
  const co = new Date(b.check_out_date); co.setHours(0, 0, 0, 0);
  return ci.getTime() === co.getTime() && ci >= start && ci <= end;
}
function proratedAmount(b, start, end) {
  const amount = parseFloat(b.amount_received || 0);
  if (!amount) return 0;
  const ci = new Date(b.check_in_date); ci.setHours(0, 0, 0, 0);
  const co = new Date(b.check_out_date); co.setHours(0, 0, 0, 0);
  const totalNights = Math.round((co - ci) / 86400000);
  if (totalNights <= 0) return isSameDayStayInPeriod(b, start, end) ? amount : 0;
  return amount * nightsInPeriod(b, start, end) / totalNights;
}

const june = [new Date(2026, 5, 1), new Date(2026, 5, 30, 23, 59, 59, 999)];
const july = [new Date(2026, 6, 1), new Date(2026, 6, 31, 23, 59, 59, 999)];

// User's example: 30 Jun -> 4 Jul, ₹4000. 4 nights: 30 Jun (June), 1/2/3 Jul (July).
const stay = { check_in_date: '2026-06-30', check_out_date: '2026-07-04', amount_received: 4000 };
assert.strictEqual(proratedAmount(stay, ...june), 1000, 'June should get 1 night = ₹1000');
assert.strictEqual(proratedAmount(stay, ...july), 3000, 'July should get 3 nights = ₹3000');

// Fully within July.
const inJuly = { check_in_date: '2026-07-05', check_out_date: '2026-07-09', amount_received: 4000 };
assert.strictEqual(proratedAmount(inJuly, ...june), 0);
assert.strictEqual(proratedAmount(inJuly, ...july), 4000);

// Same-day stay (0 nights) attributes full amount to its day's period.
const sameDay = { check_in_date: '2026-06-15', check_out_date: '2026-06-15', amount_received: 500 };
assert.strictEqual(proratedAmount(sameDay, ...june), 500);
assert.strictEqual(proratedAmount(sameDay, ...july), 0);

// Total across all periods equals full amount (no earnings lost or double-counted).
assert.strictEqual(proratedAmount(stay, ...june) + proratedAmount(stay, ...july), 4000);

console.log('All earnings proration tests passed.');
