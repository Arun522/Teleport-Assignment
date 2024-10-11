// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Check for the token in the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by id
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is valid, but user not found' });
    }

    // Attach the user to the request object
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token has expired' });
    } else {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  }
};

module.exports = auth;