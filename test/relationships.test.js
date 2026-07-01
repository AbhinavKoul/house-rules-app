// Integration tests for the customer/booking relationships we rely on.
// Requires a real Postgres via DATABASE_URL. Run: npm test (CI provides the DB).
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { start, stop, resetDb, api, postJson, bookingPayload, pool, hostKey } = require('./helpers');

before(start);
after(stop);
beforeEach(resetDb);

const authGet = (path) => api(path, { headers: { 'X-Host-Key': hostKey } });

// --- Booking submission + WhatsApp normalization ---

test('valid booking is accepted and stores the +91-normalized number', async () => {
  const res = await postJson('/api/acknowledge', bookingPayload({ whatsappNumber: '9876543210' }));
  assert.strictEqual(res.status, 200);
  const { rows } = await pool.query('SELECT whatsapp_number FROM acknowledgments');
  assert.strictEqual(rows[0].whatsapp_number, '+919876543210');
});

test('booking with an invalid phone (9 digits, no country code) is rejected', async () => {
  const res = await postJson('/api/acknowledge', bookingPayload({ whatsappNumber: '987654321' }));
  assert.strictEqual(res.status, 400);
});

// --- Blacklist enforcement (the neutral 403) ---

test('blacklisted primary guest is blocked with a neutral 403 message', async () => {
  await pool.query(
    `INSERT INTO customer_profiles (govt_id_number, status) VALUES ($1, 'blacklisted')`,
    ['BLACK111']
  );
  const res = await postJson('/api/acknowledge', bookingPayload({ govtIdNumber: 'BLACK111' }));
  assert.strictEqual(res.status, 403);
  const body = await res.json();
  assert.match(body.error, /cannot be completed/i);
  assert.doesNotMatch(body.error, /blacklist/i); // must not reveal the reason
});

test('blacklisted ADDITIONAL guest also blocks the booking', async () => {
  await pool.query(
    `INSERT INTO customer_profiles (govt_id_number, status) VALUES ($1, 'blacklisted')`,
    ['BLACKADD']
  );
  const res = await postJson('/api/acknowledge', bookingPayload({
    numberOfGuests: 2,
    relationshipType: 'Family Members',
    additionalGuests: [{ name: 'Second', dob: '1992-02-02', govtIdType: 'Aadhar', govtIdNumber: 'BLACKADD' }],
  }));
  assert.strictEqual(res.status, 403);
});

test('a prospective (not blacklisted) guest can still book', async () => {
  await pool.query(
    `INSERT INTO customer_profiles (govt_id_number, status) VALUES ($1, 'prospective')`,
    ['PROSPECT1']
  );
  const res = await postJson('/api/acknowledge', bookingPayload({ govtIdNumber: 'PROSPECT1' }));
  assert.strictEqual(res.status, 200);
});

// --- Overlap protection ---

test('overlapping dates are rejected with 409', async () => {
  assert.strictEqual((await postJson('/api/acknowledge', bookingPayload())).status, 200);
  const res = await postJson('/api/acknowledge', bookingPayload({
    govtIdNumber: '999988887777',
    email: 'other@example.com',
    checkInDate: '2099-01-12',
    checkOutDate: '2099-01-16',
  }));
  assert.strictEqual(res.status, 409);
});

// --- WhatsApp fallback: booking number preferred, profile fills the gap ---

test('acknowledgments feed uses the booking number when present', async () => {
  await postJson('/api/acknowledge', bookingPayload({ govtIdNumber: 'FALLBACK1', whatsappNumber: '9000000001' }));
  await pool.query(
    `INSERT INTO customer_profiles (govt_id_number, whatsapp_number) VALUES ($1, $2)`,
    ['FALLBACK1', '+919111111111']
  );
  const rows = await (await authGet('/api/acknowledgments')).json();
  const b = rows.find((r) => r.govt_id_number === 'FALLBACK1');
  assert.strictEqual(b.whatsapp_number, '+919000000001'); // booking wins over profile
});

test('acknowledgments feed falls back to profile number when booking has none', async () => {
  // Insert a booking directly with a NULL whatsapp (simulates an old pre-field booking).
  await pool.query(
    `INSERT INTO acknowledgments (name, email, dob, govt_id_type, govt_id_number, whatsapp_number, number_of_guests, check_in_date, check_out_date)
     VALUES ('Old', 'old@example.com', '1990-01-01', 'Aadhar', 'FALLBACK2', NULL, 1, '2099-02-01', '2099-02-03')`
  );
  await pool.query(
    `INSERT INTO customer_profiles (govt_id_number, whatsapp_number) VALUES ($1, $2)`,
    ['FALLBACK2', '+919222222222']
  );
  const rows = await (await authGet('/api/acknowledgments')).json();
  const b = rows.find((r) => r.govt_id_number === 'FALLBACK2');
  assert.strictEqual(b.whatsapp_number, '+919222222222');
});

// --- Profile upsert preserves an existing number when the UI omits it ---

test('saving note/status without a number preserves the existing profile number', async () => {
  await pool.query(
    `INSERT INTO customer_profiles (govt_id_number, whatsapp_number) VALUES ($1, $2)`,
    ['PRESERVE1', '+919333333333']
  );
  const res = await postJson('/api/update-customer-profile', {
    govtIdNumber: 'PRESERVE1', note: 'Nice guest', status: 'prospective', hostKey,
  });
  assert.strictEqual(res.status, 200);
  const { rows } = await pool.query('SELECT whatsapp_number, note, status FROM customer_profiles WHERE govt_id_number = $1', ['PRESERVE1']);
  assert.strictEqual(rows[0].whatsapp_number, '+919333333333'); // NOT wiped
  assert.strictEqual(rows[0].note, 'Nice guest');
  assert.strictEqual(rows[0].status, 'prospective');
});

// --- Customers feed: newest booking number wins; linked by govt ID ---

test('customers feed links by govt ID and the most recent booking number wins', async () => {
  await postJson('/api/acknowledge', bookingPayload({
    govtIdNumber: 'SAMEID', whatsappNumber: '9000000010',
    checkInDate: '2099-03-01', checkOutDate: '2099-03-03',
  }));
  await postJson('/api/acknowledge', bookingPayload({
    govtIdNumber: 'SAMEID', email: 'again@example.com', whatsappNumber: '9000000020',
    checkInDate: '2099-04-01', checkOutDate: '2099-04-03',
  }));
  const { customers } = await (await authGet('/api/statistics/customers')).json();
  const c = customers.find((x) => x.govtIdNumber === 'SAMEID');
  assert.strictEqual(c.bookingCount, 2);                    // one customer, two visits
  assert.strictEqual(c.whatsappNumber, '+919000000020');    // newest number
});

// --- Amount update + total spent aggregation ---

test('update-amount is host-key protected and feeds customer total spent', async () => {
  await postJson('/api/acknowledge', bookingPayload({ govtIdNumber: 'SPENDER1' }));
  const { rows } = await pool.query('SELECT id FROM acknowledgments WHERE govt_id_number = $1', ['SPENDER1']);
  const id = rows[0].id;

  const noAuth = await postJson('/api/update-amount', { bookingId: id, amountReceived: 5000 });
  assert.strictEqual(noAuth.status, 403);

  const ok = await postJson('/api/update-amount', { bookingId: id, amountReceived: 5000, hostKey });
  assert.strictEqual(ok.status, 200);

  const { customers } = await (await authGet('/api/statistics/customers')).json();
  const c = customers.find((x) => x.govtIdNumber === 'SPENDER1');
  assert.strictEqual(c.totalSpent, 5000);
});

test('acknowledgments endpoint requires a valid host key', async () => {
  assert.strictEqual((await api('/api/acknowledgments')).status, 403);
  assert.strictEqual((await api('/api/acknowledgments', { headers: { 'X-Host-Key': 'wrong' } })).status, 403);
});
