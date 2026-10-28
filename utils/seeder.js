const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const connectDB = require('../config/db');
const { generateStudentList } = require('./studentSeedData');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Cleaning existing database records...');
    await Admin.deleteMany({});
    await Complaint.deleteMany({});
    await Student.deleteMany({});

    console.log('[Seeder] Creating updated Admin & Officer accounts for Karunya...');
    const adminUser = new Admin({
      name: 'Dr. Suresh Kumar (Chief Administrator)',
      username: 'admin@karunya.edu.in',
      email: 'admin@karunya.edu.in',
      password: 'Karunya@6379', // Will be hashed by pre('save') hook
      role: 'SuperAdmin',
      department: 'Central Grievance Redressal Cell'
    });

    const officerUser = new Admin({
      name: 'Officer Student Affairs',
      username: 'studentaffairs@karunya.edu.in',
      email: 'studentaffairs@karunya.edu.in',
      password: 'Affairs@1100',
      role: 'Officer',
      department: 'Department of Student Affairs'
    });

    await adminUser.save();
    await officerUser.save();
    console.log('[Seeder] Admin accounts created:');
    console.log('   - SuperAdmin: admin@karunya.edu.in / Karunya@6379');
    console.log('   - Officer: studentaffairs@karunya.edu.in / Affairs@1100');

    console.log('[Seeder] Seeding 200 Students (URK24CS1001 to URK24CS1200)...');
    const studentList = generateStudentList();
    for (const s of studentList) {
      const studentDoc = new Student({
        registerNumber: s.registerNumber,
        name: s.name,
        email: s.email,
        dob: s.dob,
        department: s.department,
        phone: s.phone,
        password: s.dob, // default password is DOB
        addedBy: 'Student Affairs Officer'
      });
      await studentDoc.save();
    }
    console.log(`[Seeder] Seeded ${studentList.length} students with DOB as default login password.`);

    console.log('[Seeder] Seeding realistic complaints across multiple statuses...');

    const sampleComplaints = [
      {
        complaintId: 'CMP-2026-10492',
        title: 'High-speed Wi-Fi not working in Computer Science Block C, 3rd Floor',
        category: 'IT & Network',
        priority: 'High',
        description: 'The Wi-Fi access point AP-304 in Lab 301 and surrounding corridor has had no internet connectivity since Monday. Students are unable to access laboratory server environments.',
        location: 'CS Block C, 3rd Floor, Lab 301',
        citizen: {
          fullName: 'Aarav Patel',
          email: 'aarav.patel@student.edu',
          phone: '9876543210',
          userType: 'Student',
          idNumber: '22CS104'
        },
        status: 'In Progress',
        assignedTo: {
          name: 'Er. Rajesh Sharma',
          department: 'IT & Network',
          assignedAt: new Date(Date.now() - 36 * 3600 * 1000)
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Complaint lodged by student via web portal.',
            updatedBy: 'System',
            timestamp: new Date(Date.now() - 48 * 3600 * 1000)
          },
          {
            status: 'Under Review',
            note: 'Complaint reviewed and verified by Central Helpdesk.',
            updatedBy: 'Admin: Dr. Suresh Kumar',
            timestamp: new Date(Date.now() - 40 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            note: 'Assigned to Network Engineer. Fiber switch rebooted; replacement access point ordered.',
            updatedBy: 'Er. Rajesh Sharma (IT & Network)',
            timestamp: new Date(Date.now() - 36 * 3600 * 1000)
          }
        ],
        createdAt: new Date(Date.now() - 48 * 3600 * 1000)
      },
      {
        complaintId: 'CMP-2026-21840',
        title: 'Water cooler not dispensing cold water on Hostel Block 2 First Floor',
        category: 'Hostel',
        priority: 'Medium',
        description: 'The drinking water cooler near Room 112 is leaking water on the floor and the refrigeration unit is shut down. Water is room temperature and slippery hazard on floor.',
        location: 'Boys Hostel 2, 1st Floor, Near Room 112',
        citizen: {
          fullName: 'Kavita Menon',
          email: 'kavita.m@student.edu',
          phone: '9845123456',
          userType: 'Student',
          idNumber: '21EC089'
        },
        status: 'Resolved',
        assignedTo: {
          name: 'Mr. Murugan',
          department: 'Estate & Maintenance',
          assignedAt: new Date(Date.now() - 24 * 3600 * 1000)
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Complaint registered.',
            updatedBy: 'System',
            timestamp: new Date(Date.now() - 30 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            note: 'Plumbing and electrical technicians dispatched.',
            updatedBy: 'Hostel Warden',
            timestamp: new Date(Date.now() - 22 * 3600 * 1000)
          },
          {
            status: 'Resolved',
            note: 'Compressor relay replaced, drain pipe unclogged, and filter cartridge renewed. Cooling restored.',
            updatedBy: 'Estate Maintenance Desk',
            timestamp: new Date(Date.now() - 8 * 3600 * 1000)
          }
        ],
        resolution: {
          resolvedAt: new Date(Date.now() - 8 * 3600 * 1000),
          remarks: 'Compressor relay replaced and new UV water filter installed. Unit tested working at 12°C.',
          resolvedBy: 'Mr. Murugan (Maintenance Lead)'
        },
        feedback: {
          rating: 5,
          comments: 'Super fast response! Drinking water cooler is working great now. Thank you maintenance team.',
          submittedAt: new Date(Date.now() - 4 * 3600 * 1000)
        },
        createdAt: new Date(Date.now() - 30 * 3600 * 1000)
      },
      {
        complaintId: 'CMP-2026-34901',
        title: 'Classroom 402 ceiling projector flickering and dim display',
        category: 'Academic',
        priority: 'High',
        description: 'During morning lectures the HDMI display flashes off every 30 seconds. Faculty slides are unreadable from the back rows.',
        location: 'Mechanical Engineering Building, Seminar Hall 402',
        citizen: {
          fullName: 'Prof. Ramesh Iyer',
          email: 'r.iyer@institution.edu',
          phone: '9444123890',
          userType: 'Faculty',
          idNumber: 'FAC-ME-40'
        },
        status: 'Under Review',
        assignedTo: {
          name: 'Audio-Visual Team',
          department: 'Academic Support',
          assignedAt: new Date(Date.now() - 10 * 3600 * 1000)
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Complaint lodged by Faculty member.',
            updatedBy: 'System',
            timestamp: new Date(Date.now() - 12 * 3600 * 1000)
          },
          {
            status: 'Under Review',
            note: 'AV technician scheduled to inspect HDMI cabling and lamp life between lecture hours.',
            updatedBy: 'Admin: Dr. Suresh Kumar',
            timestamp: new Date(Date.now() - 10 * 3600 * 1000)
          }
        ],
        createdAt: new Date(Date.now() - 12 * 3600 * 1000)
      },
      {
        complaintId: 'CMP-2026-48215',
        title: 'Broken handrail on exterior stairway leading to Central Cafeteria',
        category: 'Infrastructure',
        priority: 'Urgent',
        description: 'The metal handrail on the eastern steps is completely detached from the masonry wall. During rainy hours this poses a severe slipping hazard for students and staff.',
        location: 'South Quad Stairway, Central Cafeteria Approach',
        citizen: {
          fullName: 'Sneha Reddy',
          email: 'sneha.reddy@student.edu',
          phone: '9123456780',
          userType: 'Student',
          idNumber: '23IT044'
        },
        status: 'Pending',
        assignedTo: {
          name: 'Unassigned',
          department: 'Civil Works',
          assignedAt: null
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Complaint submitted with high urgency flag.',
            updatedBy: 'System',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000)
          }
        ],
        createdAt: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        complaintId: 'CMP-2026-59012',
        title: 'Campus Shuttle Bus Route 4 delayed by 45 minutes regularly',
        category: 'Transport',
        priority: 'Medium',
        description: 'Morning shuttle bus connecting Metro Station Gate 2 to College Campus has been arriving 40-50 minutes late throughout this week, causing students to miss period 1 attendance.',
        location: 'Metro Station Bus Bay / Campus North Gate',
        citizen: {
          fullName: 'Vikram Joshi',
          email: 'vikram.j@student.edu',
          phone: '9789012345',
          userType: 'Student',
          idNumber: '22EE061'
        },
        status: 'Resolved',
        assignedTo: {
          name: 'Transport Officer Verma',
          department: 'Campus Transport',
          assignedAt: new Date(Date.now() - 72 * 3600 * 1000)
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Complaint registered.',
            updatedBy: 'System',
            timestamp: new Date(Date.now() - 90 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            note: 'Route traffic surveyed and driver shift schedule synchronized.',
            updatedBy: 'Transport Department',
            timestamp: new Date(Date.now() - 60 * 3600 * 1000)
          },
          {
            status: 'Resolved',
            note: 'An auxiliary backup bus added during 8:00 AM - 9:00 AM rush hour. Bus timings stabilized.',
            updatedBy: 'Transport Officer Verma',
            timestamp: new Date(Date.now() - 20 * 3600 * 1000)
          }
        ],
        resolution: {
          resolvedAt: new Date(Date.now() - 20 * 3600 * 1000),
          remarks: 'Secondary shuttle bus (Bus #12) deployed at 8:15 AM to ease passenger crowding and ensure punctuality.',
          resolvedBy: 'Transport Officer Verma'
        },
        feedback: {
          rating: 4,
          comments: 'Bus arrived right on time today at 8:20 AM. Much better!',
          submittedAt: new Date(Date.now() - 15 * 3600 * 1000)
        },
        createdAt: new Date(Date.now() - 90 * 3600 * 1000)
      },
      {
        complaintId: 'CMP-2026-67340',
        title: 'Library e-Resource subscription login portal displaying SSL certificate error',
        category: 'IT & Network',
        priority: 'High',
        description: 'When attempting to access IEEE Xplore and Springer research publications through campus proxy, browsers report NET::ERR_CERT_DATE_INVALID. Research scholars cannot download papers.',
        location: 'Central Digital Library / Remote Access Portal',
        citizen: {
          fullName: 'Pooja Bhatt',
          email: 'pooja.bhatt@research.edu',
          phone: '9888776655',
          userType: 'Student',
          idNumber: 'PHD2024-02'
        },
        status: 'In Progress',
        assignedTo: {
          name: 'Er. Rajesh Sharma',
          department: 'IT & Network',
          assignedAt: new Date(Date.now() - 16 * 3600 * 1000)
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Complaint logged.',
            updatedBy: 'System',
            timestamp: new Date(Date.now() - 20 * 3600 * 1000)
          },
          {
            status: 'In Progress',
            note: 'Wildcard SSL certificate renewal initiated with certificate authority.',
            updatedBy: 'Er. Rajesh Sharma',
            timestamp: new Date(Date.now() - 16 * 3600 * 1000)
          }
        ],
        createdAt: new Date(Date.now() - 20 * 3600 * 1000)
      }
    ];

    for (const item of sampleComplaints) {
      // Generate QR Code data URL
      const qrData = await QRCode.toDataURL(`http://localhost:5000/track.html?id=${item.complaintId}`);
      item.qrCode = qrData;
      await Complaint.create(item);
    }

    console.log(`[Seeder] Successfully seeded ${sampleComplaints.length} complaints.`);
    console.log('[Seeder] Database seeding finished.');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Seeding error:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
