const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate Student requests via JWT
 */
const authenticateStudent = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in as a student to proceed.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_webtech_jwt_key_2026_complaint_app');

    if (decoded.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Student credentials required.'
      });
    }

    req.student = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired student session. Please log in again.'
    });
  }
};

module.exports = {
  authenticateStudent
};
