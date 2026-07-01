// Shared helpers for integration tests. Boots the Express app on an ephemeral port
// against a real Postgres (DATABASE_URL), and provides DB reset + a booking factory.
process.env.NODE_ENV = 'test';
process.env.HOST_KEY = process.env.HOST_KEY || 'test-host-key';

const { app, pool, initDB } = require('../server');

let server, baseUrl;

async function start() {
  await initDB();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
  return baseUrl;
}

async function stop() {
  if (server) await new Promise((r) => server.close(r));
  await pool.end();
}

// Wipe both tables so each test file starts clean.
async function resetDb() {
  await pool.query('TRUNCATE acknowledgments RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE customer_profiles CASCADE');
}

const api = (path, opts = {}) => fetch(baseUrl + path, opts);

const postJson = (path, body, headers = {}) =>
  api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

// A valid acknowledge payload; override any field per test.
function bookingPayload(overrides = {}) {
  return {
    name: 'Test Guest',
    email: 'guest@example.com',
    dob: '1990-01-01',
    govtIdType: 'Aadhar',
    govtIdNumber: '111122223333',
    whatsappNumber: '9876543210',
    numberOfGuests: 1,
    numberOfChildren: 0,
    checkInDate: '2099-01-10',
    checkOutDate: '2099-01-14',
    emergencyContactName: 'Kin',
    emergencyContactPhone: '+919999999999',
    emergencyContactRelationship: 'Spouse',
    ...overrides,
  };
}

module.exports = { start, stop, resetDb, api, postJson, bookingPayload, pool, hostKey: process.env.HOST_KEY };
