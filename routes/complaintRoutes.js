const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticateStudent } = require('../middleware/studentAuth');
const {
  validateComplaintRegistration,
  validateComplaintTracking,
  validateFeedback
} = require('../middleware/validation');
const {
  registerComplaint,
  trackComplaint,
  getCitizenComplaints,
  submitFeedback,
  getPublicStats
} = require('../controllers/complaintController');

// Public endpoints
router.get('/public-stats', getPublicStats);
router.get('/track', validateComplaintTracking, trackComplaint);
router.get('/citizen', getCitizenComplaints);

// Grievance submission strictly requires authenticated student login
router.post('/', upload.single('attachment'), authenticateStudent, validateComplaintRegistration, registerComplaint);
router.post('/:id/feedback', validateFeedback, submitFeedback);

module.exports = router;
