const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
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
router.post('/', upload.single('attachment'), validateComplaintRegistration, registerComplaint);
router.post('/:id/feedback', validateFeedback, submitFeedback);

module.exports = router;
