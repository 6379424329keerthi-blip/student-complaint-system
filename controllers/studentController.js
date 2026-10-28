const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Complaint = require('../models/Complaint');

/**
 * @desc    Student Login with Register Number and DOB (Password)
 * @route   POST /api/students/login
 * @access  Public
 */
const loginStudent = async (req, res) => {
  try {
    const { registerNumber, password } = req.body;

    if (!registerNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your Register Number and Date of Birth (Password).'
      });
    }

    const regNo = registerNumber.trim().toUpperCase();
    const student = await Student.findOne({ registerNumber: regNo });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with Register Number ${regNo} not found. Please contact the Student Affairs Officer or use Sign Up.`
      });
    }

    const isMatch = await student.comparePassword(password.trim());
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect Password/DOB. Please enter your Date of Birth in DD-MM-YYYY format (e.g., 15-08-2006).'
      });
    }

    const payload = {
      id: student._id,
      registerNumber: student.registerNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      phone: student.phone,
      role: 'Student'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecret_webtech_jwt_key_2026_complaint_app', {
      expiresIn: '24h'
    });

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      token,
      student: payload
    });
  } catch (error) {
    console.error('Student login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during student login.',
      error: error.message
    });
  }
};

/**
 * @desc    Student Self Sign-Up (If student doesn't exist yet)
 * @route   POST /api/students/register
 * @access  Public
 */
const registerStudent = async (req, res) => {
  try {
    const { registerNumber, name, email, dob, department, phone } = req.body;

    if (!registerNumber || !name || !email || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields: Register Number, Name, Email, and Date of Birth.'
      });
    }

    const regNo = registerNumber.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if already registered
    const existingStudent = await Student.findOne({
      $or: [{ registerNumber: regNo }, { email: cleanEmail }]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `A student with Register Number ${regNo} or Email ${cleanEmail} is already registered. Please choose Login.`
      });
    }

    const newStudent = new Student({
      registerNumber: regNo,
      name: name.trim(),
      email: cleanEmail,
      dob: dob.trim(),
      department: department ? department.trim() : 'Computer Science and Engineering',
      phone: phone ? phone.trim() : '9876543210',
      password: dob.trim(), // Default password is DOB
      addedBy: 'Self-Registered'
    });

    await newStudent.save();

    const payload = {
      id: newStudent._id,
      registerNumber: newStudent.registerNumber,
      name: newStudent.name,
      email: newStudent.email,
      department: newStudent.department,
      phone: newStudent.phone,
      role: 'Student'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecret_webtech_jwt_key_2026_complaint_app', {
      expiresIn: '24h'
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully! You are now logged in.',
      token,
      student: payload
    });
  } catch (error) {
    console.error('Student registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during student sign up.',
      error: error.message
    });
  }
};

/**
 * @desc    Get Current Logged-in Student Profile
 * @route   GET /api/students/profile
 * @access  Private (Student)
 */
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id).select('-password');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.'
      });
    }

    return res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching student profile.',
      error: error.message
    });
  }
};

/**
 * @desc    Get All Complaints Filed by Logged-in Student
 * @route   GET /api/students/my-complaints
 * @access  Private (Student)
 */
const getStudentComplaints = async (req, res) => {
  try {
    const { registerNumber, email } = req.student;

    const complaints = await Complaint.find({
      $or: [
        { 'citizen.idNumber': registerNumber },
        { 'citizen.email': email.toLowerCase() }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error('Error fetching student complaints:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student complaints.',
      error: error.message
    });
  }
};

module.exports = {
  loginStudent,
  registerStudent,
  getStudentProfile,
  getStudentComplaints
};
