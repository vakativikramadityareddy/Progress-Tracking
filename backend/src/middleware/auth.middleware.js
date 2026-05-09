const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Unauthorized: No token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    console.error('Authentication error:', err);
    return res.status(401).json({
      message: 'Unauthorized: Invalid token'
    });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

const authorizeOwnerOrAdmin = (userIdField = 'id') => (req, res, next) => {
  const targetId = req.params[userIdField];
  if (req.user?.role === 'ADMIN' || req.user?.id === targetId) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Access denied' });
};

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeOwnerOrAdmin
};
