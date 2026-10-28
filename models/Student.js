const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  registerNumber: {
    type: String,
    required: [true, 'Register number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  dob: {
    type: String,
    required: [true, 'Date of Birth (DOB) is required as initial password'],
    trim: true
  },
  department: {
    type: String,
    default: 'Computer Science and Engineering',
    trim: true
  },
  phone: {
    type: String,
    default: '9876543210',
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  addedBy: {
    type: String,
    default: 'Officer'
  }
}, {
  timestamps: true
});

// Normalize Date string helper (e.g. 15/08/2006 -> 15-08-2006)
function normalizeDobString(dob) {
  if (!dob) return '';
  return dob.replace(/\//g, '-').trim();
}

// Hash password before saving
StudentSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password (supports direct password or normalized DOB)
StudentSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword) return false;
  
  // Direct bcrypt comparison
  const directMatch = await bcrypt.compare(candidatePassword, this.password);
  if (directMatch) return true;

  // Also check normalized DOB variations (e.g. DD-MM-YYYY vs DD/MM/YYYY vs YYYY-MM-DD)
  const normCandidate = normalizeDobString(candidatePassword);
  const normDob = normalizeDobString(this.dob);
  
  if (normCandidate === normDob) return true;

  // Check if candidate matches with slashes instead of dashes
  if (normCandidate.replace(/-/g, '/') === normDob.replace(/-/g, '/')) return true;

  return false;
};

module.exports = mongoose.model('Student', StudentSchema);
