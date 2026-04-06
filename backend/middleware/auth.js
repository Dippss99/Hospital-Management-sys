const jwt = require('jsonwebtoken');
const path = require('path');

// Absolute path to .env — resolves correctly on both local and EC2
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ message: 'JWT_SECRET not configured in .env' });

  try {
    const decoded = jwt.verify(token, secret);
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient role' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;
