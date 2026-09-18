const { OAuth2Client } = require('google-auth-library');

const clientId = process.env.GOOGLE_CLIENT_ID;

if (!clientId) {
  throw new Error('GOOGLE_CLIENT_ID must be set');
}

module.exports = new OAuth2Client(clientId);
