const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  const secret = process.env.JWT_SECRET || 'bidSphere_dev_fallback_secret_2024';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[AUTH ERROR] Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
