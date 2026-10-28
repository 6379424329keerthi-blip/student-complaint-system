const express = require('express');
const router = express.Router();
const { authenticateStudent } = require('../middleware/studentAuth');
const {
  loginStudent,
  registerStudent,
  getStudentProfile,
  getStudentComplaints
} = require('../controllers/studentController');

// Public student routes
router.post('/login', loginStudent);
router.post('/register', registerStudent);

// Protected student routes
router.get('/profile', authenticateStudent, getStudentProfile);
router.get('/my-complaints', authenticateStudent, getStudentComplaints);

module.exports = router;
