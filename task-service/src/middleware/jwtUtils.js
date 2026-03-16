const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'default_secret';

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    throw new Error('Invalid token');
  }
}

module.exports = {
  verifyToken
};
