const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const {
  validateAdminLogin,
  validateStatusUpdate
} = require('../middleware/validation');
const {
  loginAdmin,
  getDashboardStats,
  getComplaintsList,
  getComplaintDetails,
  updateComplaintStatus,
  exportComplaintsCSV,
  deleteComplaint
} = require('../controllers/adminController');

// Public admin login
router.post('/login', validateAdminLogin, loginAdmin);

// Protected admin routes
router.use(authenticateAdmin);

router.get('/dashboard-stats', getDashboardStats);
router.get('/complaints', getComplaintsList);
router.get('/complaints/:id', getComplaintDetails);
router.put('/complaints/:id/status', validateStatusUpdate, updateComplaintStatus);
router.get('/export/csv', exportComplaintsCSV);
router.delete('/complaints/:id', deleteComplaint);

module.exports = router;
