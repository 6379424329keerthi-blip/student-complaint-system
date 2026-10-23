const mongoose = require('mongoose');

const TimelineEntrySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
    required: true
  },
  note: {
    type: String,
    default: 'Status updated'
  },
  updatedBy: {
    type: String,
    default: 'System'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  category: {
    type: String,
    required: [true, 'Complaint category is required'],
    enum: [
      'Infrastructure',
      'Academic',
      'Hostel',
      'IT & Network',
      'Sanitation',
      'Transport',
      'Administrative',
      'Other'
    ],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  description: {
    type: String,
    required: [true, 'Complaint description is required'],
    trim: true,
    minlength: [15, 'Description must be at least 15 characters for clarity'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [150, 'Location details cannot exceed 150 characters'],
    default: 'Not specified'
  },
  citizen: {
    fullName: {
      type: String,
      required: [true, 'Complainant full name is required'],
      trim: true,
      minlength: [2, 'Full name must have at least 2 characters'],
      maxlength: [70, 'Full name cannot exceed 70 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be a valid 10-digit number']
    },
    userType: {
      type: String,
      enum: ['Student', 'Faculty', 'Staff', 'Public Visitor', 'Resident'],
      default: 'Student'
    },
    idNumber: {
      type: String,
      trim: true,
      default: ''
    }
  },
  attachment: {
    filename: { type: String, default: null },
    originalName: { type: String, default: null },
    mimetype: { type: String, default: null },
    size: { type: Number, default: 0 },
    path: { type: String, default: null }
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  assignedTo: {
    name: { type: String, default: 'Unassigned' },
    department: { type: String, default: 'General Support' },
    assignedAt: { type: Date }
  },
  timeline: [TimelineEntrySchema],
  resolution: {
    resolvedAt: { type: Date },
    remarks: { type: String, trim: true, default: '' },
    resolvedBy: { type: String, default: '' }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [500, 'Feedback comments cannot exceed 500 characters'],
      default: ''
    },
    submittedAt: { type: Date }
  },
  qrCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Full-text search index for fast search by title, complaintId, description
ComplaintSchema.index({
  complaintId: 'text',
  title: 'text',
  description: 'text',
  'citizen.fullName': 'text',
  'citizen.email': 'text'
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
