const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { generateStudentList } = require('./studentSeedData');

function generateCredentialsPdf() {
  return new Promise((resolve, reject) => {
    const students = generateStudentList();
    const outputPath = path.join(__dirname, '..', 'STUDENT_LOGIN_CREDENTIALS_URK24CS1001_TO_URK24CS1200.pdf');
    const doc = new PDFDocument({ margin: 36, size: 'A4' });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const primaryColor = '#1e3a8a';
    const secondaryColor = '#3b82f6';
    const darkSlate = '#0f172a';
    const grayBg = '#f1f5f9';

    function drawHeader() {
      // University Title Box
      doc.rect(36, 36, doc.page.width - 72, 60).fillAndStroke('#f8fafc', primaryColor);
      
      doc.fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('KARUNYA INSTITUTE OF TECHNOLOGY AND SCIENCES', 45, 45, { align: 'center', width: doc.page.width - 90 });

      doc.fillColor(secondaryColor)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Student Online Complaint Registration and Tracking System', 45, 63, { align: 'center', width: doc.page.width - 90 });

      doc.fillColor(darkSlate)
        .font('Helvetica')
        .fontSize(8)
        .text('CONFIDENTIAL: STUDENT PORTAL LOGIN CREDENTIALS (URK24CS1001 - URK24CS1200)', 45, 78, { align: 'center', width: doc.page.width - 90 });
    }

    function drawTableHeader(yPos) {
      doc.rect(36, yPos, doc.page.width - 72, 20).fill(primaryColor);
      
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
      doc.text('S.No', 42, yPos + 6, { width: 28, align: 'center' });
      doc.text('Register No', 72, yPos + 6, { width: 80, align: 'left' });
      doc.text('Student Name', 154, yPos + 6, { width: 130, align: 'left' });
      doc.text('Official Email ID', 286, yPos + 6, { width: 155, align: 'left' });
      doc.text('Password (DOB)', 443, yPos + 6, { width: 75, align: 'center' });
      doc.text('Dept', 520, yPos + 6, { width: 38, align: 'center' });
    }

    let y = 110;
    drawHeader();
    drawTableHeader(y);
    y += 20;

    let countOnPage = 0;
    const maxPerPage = 28;

    students.forEach((student, index) => {
      if (countOnPage >= maxPerPage) {
        doc.addPage();
        drawHeader();
        y = 110;
        drawTableHeader(y);
        y += 20;
        countOnPage = 0;
      }

      // Zebra striping
      if (index % 2 === 0) {
        doc.rect(36, y, doc.page.width - 72, 18).fill(grayBg);
      }

      doc.fillColor(darkSlate).font('Helvetica').fontSize(7.5);
      doc.text(String(index + 1), 42, y + 5, { width: 28, align: 'center' });
      
      doc.font('Helvetica-Bold').fillColor(primaryColor);
      doc.text(student.registerNumber, 72, y + 5, { width: 80, align: 'left' });
      
      doc.font('Helvetica').fillColor(darkSlate);
      doc.text(student.name, 154, y + 5, { width: 130, align: 'left' });
      doc.text(student.email, 286, y + 5, { width: 155, align: 'left' });
      
      doc.font('Helvetica-Bold').fillColor('#b91c1c');
      doc.text(student.dob, 443, y + 5, { width: 75, align: 'center' });
      
      doc.font('Helvetica').fillColor('#64748b');
      doc.text('CSE', 520, y + 5, { width: 38, align: 'center' });

      // Row separator
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(36, y + 18).lineTo(doc.page.width - 36, y + 18).stroke();

      y += 18;
      countOnPage++;
    });

    // Instructions on the final page
    if (y + 60 > doc.page.height - 36) {
      doc.addPage();
      y = 50;
    }

    y += 15;
    doc.rect(36, y, doc.page.width - 72, 50).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(8)
      .text('INSTRUCTIONS FOR VERIFICATION & PORTAL ACCESS:', 46, y + 8);
    doc.fillColor('#334155').font('Helvetica').fontSize(7.5)
      .text('1. Register numbers range from URK24CS1001 to URK24CS1200 (Total 200 Students seeded).', 46, y + 20)
      .text('2. Initial student password is the Date of Birth in DD-MM-YYYY format (e.g., 14-05-2006 or 14/05/2006).', 46, y + 30)
      .text('3. Students can also register themselves if not present; Officers can manage student records in the Officer Portal.', 46, y + 40);

    doc.end();

    writeStream.on('finish', () => {
      console.log(`[PDF Generator] Successfully generated PDF at: ${outputPath}`);
      resolve(outputPath);
    });

    writeStream.on('error', (err) => {
      console.error('[PDF Generator] Error writing PDF:', err);
      reject(err);
    });
  });
}

if (require.main === module) {
  generateCredentialsPdf();
}

module.exports = generateCredentialsPdf;
