const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');

/**
 * @desc    Admin / Officer Login
 * @route   POST /api/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Search by username or email
    const admin = await Admin.findOne({
      $or: [
        { username: username.toLowerCase().trim() },
        { email: username.toLowerCase().trim() }
      ]
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username/email and password.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username/email and password.'
      });
    }

    const payload = {
      id: admin._id,
      name: admin.name,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      department: admin.department
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecret_webtech_jwt_key_2026_complaint_app', {
      expiresIn: '24h'
    });

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${admin.name}!`,
      token,
      admin: payload
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: error.message
    });
  }
};

/**
 * @desc    Get Admin Dashboard Analytics & Chart Data
 * @route   GET /api/admin/dashboard-stats
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const underReview = await Complaint.countDocuments({ status: 'Under Review' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const rejected = await Complaint.countDocuments({ status: 'Rejected' });

    // Category distribution for Chart.js
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Priority distribution
    const priorityStats = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Status distribution
    const statusStats = {
      Pending: pending,
      'Under Review': underReview,
      'In Progress': inProgress,
      Resolved: resolved,
      Rejected: rejected
    };

    // Calculate average resolution time (in hours) for resolved complaints
    const resolvedComplaints = await Complaint.find({ status: 'Resolved', 'resolution.resolvedAt': { $exists: true } });
    let avgHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((acc, curr) => {
        const diff = (new Date(curr.resolution.resolvedAt) - new Date(curr.createdAt)) / (1000 * 60 * 60);
        return acc + (diff > 0 ? diff : 1);
      }, 0);
      avgHours = (totalHours / resolvedComplaints.length).toFixed(1);
    }

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        underReview,
        inProgress,
        resolved,
        rejected,
        avgResolutionHours: avgHours,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
      },
      charts: {
        categories: categoryStats,
        priorities: priorityStats,
        statuses: statusStats
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics.'
    });
  }
};

/**
 * @desc    Get complaints with search, category/status filters, pagination
 * @route   GET /api/admin/complaints
 * @access  Private
 */
const getComplaintsList = async (req, res) => {
  try {
    const { status, category, priority, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (priority && priority !== 'All') {
      filter.priority = priority;
    }
    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { complaintId: { $regex: s, $options: 'i' } },
        { title: { $regex: s, $options: 'i' } },
        { 'citizen.fullName': { $regex: s, $options: 'i' } },
        { 'citizen.email': { $regex: s, $options: 'i' } },
        { location: { $regex: s, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalRecords = await Complaint.countDocuments(filter);

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      pagination: {
        total: totalRecords,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalRecords / parseInt(limit))
      },
      data: complaints
    });
  } catch (error) {
    console.error('Error fetching complaints list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints list.'
    });
  }
};

/**
 * @desc    Get single complaint full details
 * @route   GET /api/admin/complaints/:id
 * @access  Private
 */
const getComplaintDetails = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id.toUpperCase() });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint details.'
    });
  }
};

/**
 * @desc    Update complaint status, officer assignment, resolution remarks
 * @route   PUT /api/admin/complaints/:id/status
 * @access  Private
 */
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note, remarks, assignedOfficer, department } = req.body;
    const complaint = await Complaint.findOne({ complaintId: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    const oldStatus = complaint.status;
    complaint.status = status;

    if (assignedOfficer) {
      complaint.assignedTo = {
        name: assignedOfficer,
        department: department || complaint.category,
        assignedAt: new Date()
      };
    }

    if (status === 'Resolved' || status === 'Rejected') {
      complaint.resolution = {
        resolvedAt: new Date(),
        remarks: remarks || 'Action completed by officer.',
        resolvedBy: req.admin ? req.admin.name : (assignedOfficer || 'Officer')
      };
    }

    // Append to timeline
    const timelineEntry = {
      status,
      note: note || (remarks ? remarks : `Status changed from ${oldStatus} to ${status}`),
      updatedBy: req.admin ? `${req.admin.name} (${req.admin.role})` : 'Officer',
      timestamp: new Date()
    };
    complaint.timeline.push(timelineEntry);

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to "${status}" successfully.`,
      data: complaint
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint status.'
    });
  }
};

/**
 * @desc    Export complaints as CSV for reporting/audit
 * @route   GET /api/admin/export/csv
 * @access  Private
 */
const exportComplaintsCSV = async (req, res) => {
  try {
    const complaints = await Complaint.find({}).sort({ createdAt: -1 });

    let csv = 'Complaint ID,Title,Category,Priority,Status,Complainant Name,Email,Phone,User Type,Location,Created At,Resolved At,Remarks\n';

    complaints.forEach(c => {
      const row = [
        `"${c.complaintId}"`,
        `"${(c.title || '').replace(/"/g, '""')}"`,
        `"${c.category}"`,
        `"${c.priority}"`,
        `"${c.status}"`,
        `"${(c.citizen.fullName || '').replace(/"/g, '""')}"`,
        `"${c.citizen.email}"`,
        `"${c.citizen.phone}"`,
        `"${c.citizen.userType}"`,
        `"${(c.location || '').replace(/"/g, '""')}"`,
        `"${new Date(c.createdAt).toLocaleString()}"`,
        `"${c.resolution && c.resolution.resolvedAt ? new Date(c.resolution.resolvedAt).toLocaleString() : 'N/A'}"`,
        `"${c.resolution && c.resolution.remarks ? c.resolution.remarks.replace(/"/g, '""') : 'N/A'}"`
      ];
      csv += row.join(',') + '\n';
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`complaints-export-${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export CSV.'
    });
  }
};

/**
 * @desc    Delete a complaint (SuperAdmin only)
 * @route   DELETE /api/admin/complaints/:id
 * @access  Private
 */
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOneAndDelete({ complaintId: req.params.id.toUpperCase() });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete complaint.'
    });
  }
};

module.exports = {
  loginAdmin,
  getDashboardStats,
  getComplaintsList,
  getComplaintDetails,
  updateComplaintStatus,
  exportComplaintsCSV,
  deleteComplaint
};
