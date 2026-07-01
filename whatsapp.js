// Normalize a WhatsApp number.
// - Explicit country code (leading +) is kept as-is (7-15 digits).
// - No country code -> must be a 10-digit Indian number; we prepend +91.
// Returns null when the input is not a valid number.
function normalizeWhatsappNumber(raw) {
  if (!raw) return null;
  const clean = String(raw).replace(/[\s\-]/g, '');
  if (clean.startsWith('+')) {
    return /^\+\d{7,15}$/.test(clean) ? clean : null;
  }
  return /^\d{10}$/.test(clean) ? '+91' + clean : null;
}

module.exports = { normalizeWhatsappNumber };
