/**
 * Deterministic Student Data for URK24CS1001 to URK24CS1200
 * Used by Seeder and PDF Credentials Generator
 */

const firstNames = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Ashwin', 'Bhavna', 'Chetan', 'Deepika', 'Dev', 'Divya',
  'Ganesh', 'Gayathri', 'Harish', 'Hema', 'Ishaan', 'Janani', 'Karthik', 'Kavya', 'Kiran', 'Lavanya',
  'Madhav', 'Meera', 'Manoj', 'Nandini', 'Naveen', 'Nidhi', 'Pranav', 'Pooja', 'Praveen', 'Priya',
  'Rahul', 'Rhea', 'Rohan', 'Roshni', 'Sai', 'Sandhya', 'Sanjay', 'Sneha', 'Siddharth', 'Swetha',
  'Tarun', 'Trisha', 'Varun', 'Vandana', 'Vignesh', 'Vinitha', 'Vishal', 'Yash', 'Yuktha', 'Zain'
];

const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Menon', 'Nair', 'Iyer', 'Reddy', 'Rao', 'Pillai', 'Kumar',
  'Joseph', 'Thomas', 'Daniel', 'Mathew', 'Varghese', 'George', 'Paul', 'Alexander', 'Samuel', 'David',
  'Fernandez', 'D Souza', 'Lobo', 'Chacko', 'Kurian', 'Stephen', 'Abraham', 'John', 'Philip', 'Cherian',
  'Sundaram', 'Natarajan', 'Subramanian', 'Krishnan', 'Chandran', 'Balakrishnan', 'Murugan', 'Mani', 'Selvam', 'Babu',
  'Gupta', 'Singh', 'Chopra', 'Malhotra', 'Joshi', 'Bhat', 'Deshmukh', 'Kulkarni', 'Sen', 'Banerjee'
];

function generateStudentList() {
  const students = [];
  
  for (let i = 1001; i <= 1200; i++) {
    const regNo = `URK24CS${i}`;
    const idx = i - 1001;
    const fName = firstNames[idx % firstNames.length];
    const lName = lastNames[(idx * 7) % lastNames.length];
    const fullName = `${fName} ${lName}`;
    const email = `urk24cs${i}@karunya.edu.in`;
    
    // Deterministic realistic birthdates between Jan 2006 and Dec 2006
    const day = String((idx % 28) + 1).padStart(2, '0');
    const month = String(((idx * 3) % 12) + 1).padStart(2, '0');
    const year = 2006;
    const dob = `${day}-${month}-${year}`;
    
    students.push({
      registerNumber: regNo,
      name: fullName,
      email: email,
      dob: dob,
      department: 'Computer Science and Engineering',
      phone: `98401${String(10000 + idx).slice(1)}`
    });
  }

  return students;
}

module.exports = {
  generateStudentList
};
