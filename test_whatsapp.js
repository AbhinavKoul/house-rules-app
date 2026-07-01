const assert = require('assert');
const { normalizeWhatsappNumber } = require('./whatsapp');

// 10-digit Indian number gets +91
assert.strictEqual(normalizeWhatsappNumber('9876543210'), '+919876543210');
assert.strictEqual(normalizeWhatsappNumber('98765 43210'), '+919876543210');
assert.strictEqual(normalizeWhatsappNumber('98765-43210'), '+919876543210');

// Explicit country code is preserved
assert.strictEqual(normalizeWhatsappNumber('+919876543210'), '+919876543210');
assert.strictEqual(normalizeWhatsappNumber('+1 415 555 0100'), '+14155550100');

// Invalid inputs -> null
assert.strictEqual(normalizeWhatsappNumber(''), null);
assert.strictEqual(normalizeWhatsappNumber(null), null);
assert.strictEqual(normalizeWhatsappNumber('12345'), null);        // too short, no cc
assert.strictEqual(normalizeWhatsappNumber('98765432100'), null);  // 11 digits, no cc
assert.strictEqual(normalizeWhatsappNumber('+12'), null);          // cc too short
assert.strictEqual(normalizeWhatsappNumber('abcdefghij'), null);

console.log('whatsapp normalization: all assertions passed');
