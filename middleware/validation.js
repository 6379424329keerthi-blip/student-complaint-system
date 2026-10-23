const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to intercept validation errors and return structured response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Map errors by field for easy client-side form highlighting
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please correct the highlighted errors.',
      errors: formattedErrors
    });
  }
  next();
};

/**
 * Validation rules for Complaint Registration
 */
const validateComplaintRegistration = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full Name is required')
    .isLength({ min: 2, max: 70 }).withMessage('Full Name must be between 2 and 70 characters')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name can only contain letters, spaces, hyphens and dots'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address (e.g., user@example.com)')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be a valid 10-digit mobile number'),

  body('userType')
    .optional()
    .isIn(['Student', 'Faculty', 'Staff', 'Public Visitor', 'Resident'])
    .withMessage('Invalid complainant user type'),

  body('idNumber')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('ID/Roll number cannot exceed 50 characters'),

  body('category')
    .trim()
    .notEmpty().withMessage('Complaint category is required')
    .isIn([
      'Infrastructure',
      'Academic',
      'Hostel',
      'IT & Network',
      'Sanitation',
      'Transport',
      'Administrative',
      'Other'
    ]).withMessage('Selected category is not recognized'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Priority must be Low, Medium, High, or Urgent'),

  body('title')
    .trim()
    .notEmpty().withMessage('Complaint title is required')
    .isLength({ min: 5, max: 120 }).withMessage('Title must be between 5 and 120 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Detailed description is required')
    .isLength({ min: 15, max: 2000 }).withMessage('Description must be between 15 and 2000 characters to provide sufficient detail'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Location cannot exceed 150 characters'),

  handleValidationErrors
];

/**
 * Validation for Tracking Complaint
 */
const validateComplaintTracking = [
  query('id')
    .trim()
    .notEmpty().withMessage('Complaint ID is required')
    .matches(/^CMP-\d{4}-\d{5}$/i).withMessage('Invalid Complaint ID format. Expected format: CMP-YYYY-XXXXX'),

  query('email')
    .optional()
    .trim()
    .isEmail().withMessage('If provided, email must be valid')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Validation for Status Update by Admin
 */
const validateStatusUpdate = [
  param('id')
    .trim()
    .notEmpty().withMessage('Complaint ID is required'),

  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'])
    .withMessage('Invalid status value'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Internal note cannot exceed 500 characters'),

  body('remarks')
    .if(body('status').isIn(['Resolved', 'Rejected']))
    .trim()
    .notEmpty().withMessage('Resolution/rejection remarks are mandatory when marking complaint as Resolved or Rejected')
    .isLength({ min: 5, max: 1000 }).withMessage('Remarks must be between 5 and 1000 characters'),

  body('assignedOfficer')
    .optional()
    .trim()
    .isLength({ max: 70 }).withMessage('Officer name cannot exceed 70 characters'),

  handleValidationErrors
];

/**
 * Validation for Citizen Feedback
 */
const validateFeedback = [
  param('id')
    .trim()
    .notEmpty().withMessage('Complaint ID is required'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5 stars'),

  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Comments cannot exceed 500 characters'),

  handleValidationErrors
];

/**
 * Validation for Admin Login
 */
const validateAdminLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username or Email is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors
];

module.exports = {
  validateComplaintRegistration,
  validateComplaintTracking,
  validateStatusUpdate,
  validateFeedback,
  validateAdminLogin
};
