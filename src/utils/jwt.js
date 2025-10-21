const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate a signed JWT for an authenticated user
 * @param {Object} user - MongoDB User document
 * @returns {string} - Signed JWT token
 */
function generateToken(user) {
  const payload = {
    sub: user._id.toString(),      // Subject - the user's MongoDB ID
    userId: user._id.toString(),   // User's MongoDB ID
    email: user.email,             // User's email
    name: user.name,               // User's display name
    iss: 'jam-auth-service'        // Issuer - this microservice
  };

  // Sign the token with configured secret and expiration
  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiration || '24h'
  });

  return token;
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

module.exports = {
  generateToken,
  verifyToken
};
