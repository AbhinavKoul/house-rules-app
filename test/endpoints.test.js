// Integration tests for endpoint behaviors documented in README.md + docs/ANALYTICS.md
// that the first suite didn't cover: blocked-dates, cancellation, host edits (id/dob/dates),
// and the occupancy / recurring-customers statistics. Requires a real Postgres (DATABASE_URL).
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { start, stop, resetDb, api, postJson, bookingPayload, pool, hostKey } = require('./helpers');

before(start);
after(stop);
beforeEach(resetDb);

const authGet = (path) => api(path, { headers: { 'X-Host-Key': hostKey } });

// pg returns DATE as a local-midnight Date; compare Y-M-D without UTC shifting.
const isDate = (val, ymd) => {
  const d = new Date(val);
  const [y, m, day] = ymd.split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
};

// Insert a booking directly (bypasses the past-date guard so we can create completed/old stays).
async function seedBooking(fields = {}) {
  const b = {
    name: 'Seed', email: 'seed@example.com', dob: '1990-01-01',
    govt_id_type: 'Aadhar', govt_id_number: 'SEED0001', whatsapp_number: '+919876543210',
    number_of_guests: 1, number_of_children: 0, cancelled: false,
    check_in_date: '2099-01-10', check_out_date: '2099-01-14', amount_received: 0,
    ...fields,
  };
  const { rows } = await pool.query(
    `INSERT INTO acknowledgments
      (name, email, dob, govt_id_type, govt_id_number, whatsapp_number, number_of_guests, number_of_children, cancelled, check_in_date, check_out_date, amount_received)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [b.name, b.email, b.dob, b.govt_id_type, b.govt_id_number, b.whatsapp_number, b.number_of_guests,
     b.number_of_children, b.cancelled, b.check_in_date, b.check_out_date, b.amount_received]
  );
  return rows[0].id;
}

// --- Guest-form validation rules documented in README ---

test('missing required fields -> 400', async () => {
  const res = await postJson('/api/acknowledge', { name: 'Only Name' });
  assert.strictEqual(res.status, 400);
});

test('check-in date in the past -> 400', async () => {
  const res = await postJson('/api/acknowledge', bookingPayload({
    checkInDate: '2000-01-01', checkOutDate: '2000-01-05',
  }));
  assert.strictEqual(res.status, 400);
});

test('check-out not after check-in -> 400', async () => {
  const res = await postJson('/api/acknowledge', bookingPayload({
    checkInDate: '2099-05-10', checkOutDate: '2099-05-10',
  }));
  assert.strictEqual(res.status, 400);
});

test('invalid email format -> 400', async () => {
  const res = await postJson('/api/acknowledge', bookingPayload({ email: 'not-an-email' }));
  assert.strictEqual(res.status, 400);
});

test('multiple people without relationshipType -> 400', async () => {
  const res = await postJson('/api/acknowledge', bookingPayload({
    numberOfGuests: 1, numberOfChildren: 1, // 2 people, no relationshipType
  }));
  assert.strictEqual(res.status, 400);
});

test('multi-adult booking with mismatched additionalGuests count -> 400', async () => {
  const res = await postJson('/api/acknowledge', bookingPayload({
    numberOfGuests: 3, relationshipType: 'Family Members',
    additionalGuests: [{ name: 'Only One', dob: '1990-01-01', govtIdType: 'Aadhar', govtIdNumber: 'X1' }],
  }));
  assert.strictEqual(res.status, 400);
});

test('bad emergency contact phone -> 400', async () => {
  const res = await postJson('/api/acknowledge', bookingPayload({ emergencyContactPhone: 'abc' }));
  assert.strictEqual(res.status, 400);
});

// --- blocked-dates (public) ---

test('blocked-dates lists active bookings and excludes cancelled ones', async () => {
  const activeId = await seedBooking({ govt_id_number: 'ACT1', check_in_date: '2099-06-01', check_out_date: '2099-06-05' });
  await seedBooking({ govt_id_number: 'CAN1', cancelled: true, check_in_date: '2099-07-01', check_out_date: '2099-07-05' });

  const dates = await (await api('/api/blocked-dates')).json();
  assert.strictEqual(dates.length, 1);
  assert.ok(isDate(dates[0].check_in_date, '2099-06-01'));
  assert.ok(activeId);
});

// --- cancel-booking ---

test('cancel-booking requires host key', async () => {
  const id = await seedBooking();
  const res = await postJson('/api/cancel-booking', { bookingId: id });
  assert.strictEqual(res.status, 403);
});

test('cancel-booking on unknown id -> 404', async () => {
  const res = await postJson('/api/cancel-booking', { bookingId: 999999, hostKey });
  assert.strictEqual(res.status, 404);
});

test('cancelling a booking frees the dates for rebooking', async () => {
  await seedBooking({ govt_id_number: 'FREE1', check_in_date: '2099-08-01', check_out_date: '2099-08-05' });
  // Same dates blocked while active
  const blocked = await postJson('/api/acknowledge', bookingPayload({
    govtIdNumber: 'NEW1', checkInDate: '2099-08-01', checkOutDate: '2099-08-05',
  }));
  assert.strictEqual(blocked.status, 409);

  const { rows } = await pool.query('SELECT id FROM acknowledgments WHERE govt_id_number = $1', ['FREE1']);
  const cancel = await postJson('/api/cancel-booking', { bookingId: rows[0].id, hostKey });
  assert.strictEqual(cancel.status, 200);

  // Now the dates are free
  const rebook = await postJson('/api/acknowledge', bookingPayload({
    govtIdNumber: 'NEW1', checkInDate: '2099-08-01', checkOutDate: '2099-08-05',
  }));
  assert.strictEqual(rebook.status, 200);
});

// --- host edit endpoints ---

test('update-govt-id changes the primary guest ID (host only)', async () => {
  const id = await seedBooking({ govt_id_number: 'OLDID' });
  assert.strictEqual((await postJson('/api/update-govt-id', { bookingId: id, govtIdNumber: 'NEWID' })).status, 403);

  const ok = await postJson('/api/update-govt-id', { bookingId: id, govtIdNumber: 'NEWID', hostKey });
  assert.strictEqual(ok.status, 200);
  const { rows } = await pool.query('SELECT govt_id_number FROM acknowledgments WHERE id = $1', [id]);
  assert.strictEqual(rows[0].govt_id_number, 'NEWID');
});

test('update-dob rejects an under-18 date', async () => {
  const id = await seedBooking();
  const res = await postJson('/api/update-dob', { bookingId: id, dob: '2020-01-01', hostKey });
  assert.strictEqual(res.status, 400);
});

test('update-check-in-date rejects a past date', async () => {
  const id = await seedBooking();
  const res = await postJson('/api/update-check-in-date', { bookingId: id, checkInDate: '2000-01-01', hostKey });
  assert.strictEqual(res.status, 400);
});

test('cannot edit dates on a cancelled booking', async () => {
  const id = await seedBooking({ cancelled: true });
  const res = await postJson('/api/update-check-out-date', { bookingId: id, checkOutDate: '2099-01-20', hostKey });
  assert.strictEqual(res.status, 400);
});

test('update-check-out-date extends an active booking', async () => {
  const id = await seedBooking({ check_in_date: '2099-09-01', check_out_date: '2099-09-05' });
  const res = await postJson('/api/update-check-out-date', { bookingId: id, checkOutDate: '2099-09-10', hostKey });
  assert.strictEqual(res.status, 200);
  const { rows } = await pool.query('SELECT check_out_date FROM acknowledgments WHERE id = $1', [id]);
  assert.ok(isDate(rows[0].check_out_date, '2099-09-10'));
});

// --- statistics: recurring customers ---

test('recurring-customers only includes govt IDs with 2+ visits and flags multiple emails', async () => {
  // One-time customer (should NOT appear)
  await seedBooking({ govt_id_number: 'ONCE', check_in_date: '2099-01-01', check_out_date: '2099-01-03' });
  // Recurring customer with two different emails
  await seedBooking({ govt_id_number: 'REPEAT', email: 'a@x.com', check_in_date: '2099-02-01', check_out_date: '2099-02-03' });
  await seedBooking({ govt_id_number: 'REPEAT', email: 'b@x.com', check_in_date: '2099-03-01', check_out_date: '2099-03-03' });

  const body = await (await authGet('/api/statistics/recurring-customers')).json();
  const ids = body.customers.map((c) => c.govtIdNumber);
  assert.ok(ids.includes('REPEAT'));
  assert.ok(!ids.includes('ONCE'));

  const repeat = body.customers.find((c) => c.govtIdNumber === 'REPEAT');
  assert.strictEqual(repeat.bookingCount, 2);
  assert.strictEqual(repeat.hasMultipleEmails, true);
  assert.ok(body.summary.totalCustomers >= 2);
});

test('cancelled bookings are excluded from recurring-customers counts', async () => {
  await seedBooking({ govt_id_number: 'MIX', check_in_date: '2099-02-01', check_out_date: '2099-02-03' });
  await seedBooking({ govt_id_number: 'MIX', cancelled: true, check_in_date: '2099-03-01', check_out_date: '2099-03-03' });

  const body = await (await authGet('/api/statistics/recurring-customers')).json();
  // Only one active booking -> not recurring
  assert.ok(!body.customers.some((c) => c.govtIdNumber === 'MIX'));
});

// --- statistics: occupancy ---

test('occupancy stats require a host key', async () => {
  assert.strictEqual((await api('/api/statistics/occupancy')).status, 403);
});

test('occupancy stats return the requested number of monthly periods', async () => {
  const res = await authGet('/api/statistics/occupancy?view=monthly&periods=6');
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.view, 'monthly');
  assert.strictEqual(body.data.length, 6);
});

// --- statistics: customers excludes cancelled ---

test('customers feed excludes fully-cancelled customers', async () => {
  await seedBooking({ govt_id_number: 'ALLCANCELLED', cancelled: true });
  const { customers } = await (await authGet('/api/statistics/customers')).json();
  assert.ok(!customers.some((c) => c.govtIdNumber === 'ALLCANCELLED'));
});
