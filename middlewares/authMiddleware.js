// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model')

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password'); // or your schema

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// const isAdmin = (req, res, next) => {
//   if (req.user && req.user.role === 'admin') return next();
//   return res.status(403).json({ error: 'Forbidden: Admins only' });
// };

const isAdmin = (req, res, next) => {
  const userIdToUpdate = req.params.id;
  const currentUser = req.user;

  // If not admin, only allow updating their own profile
  if (currentUser.role !== 'admin' && currentUser._id.toString() !== userIdToUpdate) {
    return res.status(403).json({ message: 'Forbidden: You can only update your own profile' });
  }
  return next();
};

module.exports = { isAdmin };


module.exports=({authMiddleware, isAdmin})
