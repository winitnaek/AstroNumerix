const dns = require('dns').promises;

const blockedEmailDomains = new Set([
  'example.com',
  'example.net',
  'example.org',
  'localhost',
  'test.com',
  'test.net',
  'test.org'
]);

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).toLowerCase());
}

function getEmailDomain(value) {
  return String(value).trim().toLowerCase().split('@')[1] || '';
}

async function hasValidEmailDomain(value) {
  const domain = getEmailDomain(value);

  if (!domain || blockedEmailDomains.has(domain)) {
    return false;
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length > 0) {
      return true;
    }
  } catch (error) {
    // Fall back to A/AAAA records below. Some valid domains accept mail on the root host.
  }

  try {
    const addresses = await dns.resolve(domain);
    return addresses.length > 0;
  } catch (error) {
    return false;
  }
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value));
}

function isLatitude(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= -90 && number <= 90;
}

function isLongitude(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= -180 && number <= 180;
}

function missingFields(body, fields) {
  return fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
}

module.exports = {
  hasValidEmailDomain,
  isEmail,
  isIsoDate,
  isLatitude,
  isLongitude,
  isTime,
  missingFields
};
