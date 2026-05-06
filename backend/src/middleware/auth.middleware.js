const { verifyAccessToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const authorizeOwnerOrAdmin = (userIdField = 'id') => (req, res, next) => {
  const targetId = req.params[userIdField];
  if (req.user?.role === 'ADMIN' || req.user?.id === targetId) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied' });
};

module.exports = { authenticate, authorizeAdmin, authorizeOwnerOrAdmin };
