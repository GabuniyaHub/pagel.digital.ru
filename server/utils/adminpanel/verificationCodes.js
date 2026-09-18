const crypto = require('crypto');
const codes = new Map();
const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function storeCode(email, code) {
  const expiresAt = Date.now() + CODE_TTL_MS;
  codes.set(email, { code: String(code), expiresAt, attempts: 0 });
  setTimeout(() => {
    const entry = codes.get(email);
    if (entry?.expiresAt === expiresAt) codes.delete(email);
  }, CODE_TTL_MS);
}

function verifyCode(email, candidate) {
  const entry = codes.get(email);
  if (!entry || entry.expiresAt < Date.now()) {
    codes.delete(email);
    return { valid: false, blocked: false };
  }

  const expected = Buffer.from(entry.code);
  const actual = Buffer.from(String(candidate || ''));
  const valid = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (valid) {
    codes.delete(email);
    return { valid: true, blocked: false };
  }

  entry.attempts += 1;
  if (entry.attempts >= MAX_ATTEMPTS) {
    codes.delete(email);
    return { valid: false, blocked: true };
  }

  return { valid: false, blocked: false };
}

module.exports = { storeCode, verifyCode };
