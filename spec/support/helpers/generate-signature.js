const crypto = require('crypto');

const generateSignature = (secret, blob) => {
  if (typeof blob === 'object') {
    blob = JSON.stringify(blob);
  }
  let secretBuffer = Buffer.from(secret, 'utf-8');
  const hmac = crypto.createHmac('sha256', secretBuffer);
  return `sha1=${hmac.update(blob).digest('hex')}`;
}

module.exports = generateSignature;