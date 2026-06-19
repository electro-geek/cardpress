const { ulid } = require('ulid');

function generateUlid() {
  return ulid();
}

function randomAlphanumeric(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = { ulid: generateUlid, randomAlphanumeric };
