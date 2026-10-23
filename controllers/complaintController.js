const QRCode = require('qrcode');
const Complaint = require('../models/Complaint');
const { generateComplaintId } = require('../utils/idGenerator');

/**
 * @desc    Register a new complaint
 * @route   POST /api/complaints
 * @access  Public
 */
const registerComplaint = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      userType,
      idNumber,
      category,
      priority,
      title,
      description,
      location
    } = req.body;

    // Generate unique complaint ID with collision check
    let complaintId = generateComplaintId();
    let exists = await Complaint.findOne({ complaintId });
    while (exists) {
      complaintId = generateComplaintId();
      exists = await Complaint.findOne({ complaintId });
    }

    // Process attachment if uploaded
    let attachmentData = {
      filename: null,
      originalName: null,
      mimetype: null,
      size: 0,
      path: null
    };

    if (req.file) {
      attachmentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`
      };
    }

    // Build tracking URL for QR code
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const trackingUrl = `${protocol}://${host}/track.html?id=${complaintId}`;

    // Generate QR code data URL
    let qrCodeDataUrl = null;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 200,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('QR Code generation notice:', qrErr.message);
    }

    // Create complaint document
    const newComplaint = new Complaint({
      complaintId,
      title,
      category,
      priority: priority || 'Medium',
      description,
      location: location || 'Not specified',
      citizen: {
        fullName,
        email,
        phone,
        userType: userType || 'Student',
        idNumber: idNumber || ''
      },
      attachment: attachmentData,
      status: 'Pending',
      timeline: [
        {
          status: 'Pending',
          note: 'Complaint successfully registered in the system.',
          updatedBy: 'System',
          timestamp: new Date()
        }
      ],
      qrCode: qrCodeDataUrl
    });

    const savedComplaint = await newComplaint.save();

    return res.status(201).json({
      success: true,
      message: 'Complaint registered successfully! Save your Complaint ID for tracking.',
      complaintId: savedComplaint.complaintId,
      data: {
        complaintId: savedComplaint.complaintId,
        title: savedComplaint.title,
        category: savedComplaint.category,
        priority: savedComplaint.priority,
        status: savedComplaint.status,
        createdAt: savedComplaint.createdAt,
        citizen: {
          fullName: savedComplaint.citizen.fullName,
          email: savedComplaint.citizen.email,
          phone: savedComplaint.citizen.phone
        },
        qrCode: savedComplaint.qrCode,
        trackingUrl
      }
    });
  } catch (error) {
    console.error('Error registering complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while registering the complaint. Please try again.',
      error: error.message
    });
  }
};

/**
 * @desc    Track complaint by Complaint ID (and optional email verification)
 * @route   GET /api/complaints/track
 * @access  Public
 */
const trackComplaint = async (req, res) => {
  try {
    const { id, email } = req.query;

    const query = { complaintId: id.toUpperCase().trim() };
    if (email) {
      query['citizen.email'] = email.toLowerCase().trim();
    }

    const complaint = await Complaint.findOne(query);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'No complaint found matching the provided Complaint ID' + (email ? ' and Email combination.' : '.')
      });
    }

    // Calculate stage index for visual step progress
    const stageOrder = ['Pending', 'Under Review', 'In Progress', 'Resolved'];
    let currentStepIndex = stageOrder.indexOf(complaint.status);
    if (complaint.status === 'Rejected') {
      currentStepIndex = -1;
    }

    return res.status(200).json({
      success: true,
      data: {
        complaintId: complaint.complaintId,
        title: complaint.title,
        category: complaint.category,
        priority: complaint.priority,
        description: complaint.description,
        location: complaint.location,
        status: complaint.status,
        currentStepIndex,
        citizen: {
          fullName: complaint.citizen.fullName,
          email: complaint.citizen.email,
          phone: complaint.citizen.phone,
          userType: complaint.citizen.userType,
          idNumber: complaint.citizen.idNumber
        },
        assignedTo: complaint.assignedTo,
        attachment: complaint.attachment.path ? complaint.attachment : null,
        timeline: complaint.timeline,
        resolution: complaint.resolution,
        feedback: complaint.feedback,
        qrCode: complaint.qrCode,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt
      }
    });
  } catch (error) {
    console.error('Error tracking complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to track complaint. Please try again later.',
      error: error.message
    });
  }
};

/**
 * @desc    Look up all complaints registered by a citizen via email or phone
 * @route   GET /api/complaints/citizen
 * @access  Public
 */
const getCitizenComplaints = async (req, res) => {
  try {
    const { query: searchQuery } = req.query;
    if (!searchQuery || searchQuery.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email or 10-digit phone number to look up your complaints.'
      });
    }

    const cleaned = searchQuery.trim().toLowerCase();
    const complaints = await Complaint.find({
      $or: [
        { 'citizen.email': cleaned },
        { 'citizen.phone': cleaned }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error('Error fetching citizen complaints:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints.',
      error: error.message
    });
  }
};

/**
 * @desc    Submit citizen feedback on resolved complaint
 * @route   POST /api/complaints/:id/feedback
 * @access  Public
 */
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;

    const complaint = await Complaint.findOne({ complaintId: id.toUpperCase().trim() });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    if (complaint.status !== 'Resolved' && complaint.status !== 'Rejected') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for complaints that have been Resolved or Completed.'
      });
    }

    complaint.feedback = {
      rating: Number(rating),
      comments: comments || '',
      submittedAt: new Date()
    };

    complaint.timeline.push({
      status: complaint.status,
      note: `Citizen submitted feedback: ${rating} / 5 stars`,
      updatedBy: 'Citizen',
      timestamp: new Date()
    });

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded successfully.',
      data: complaint.feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback.',
      error: error.message
    });
  }
};

/**
 * @desc    Public System Stats for Landing Page & Transparency Dashboard
 * @route   GET /api/complaints/public-stats
 * @access  Public
 */
const getPublicStats = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: { $in: ['Under Review', 'In Progress'] } });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    // Get 5 recent resolved or registered complaints for public feed
    const recentActivity = await Complaint.find({})
      .select('complaintId title category status priority createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        resolutionRate
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load public statistics.'
    });
  }
};

module.exports = {
  registerComplaint,
  trackComplaint,
  getCitizenComplaints,
  submitFeedback,
  getPublicStats
};
