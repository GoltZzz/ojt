import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a PDF file for a weekly report
 * @param {Object} report - The weekly report object
 * @returns {Promise<Buffer>} - The generated PDF file as a buffer
 */
export const generateWeeklyReportPdf = async (report) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a document
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });

            // Buffer to store PDF
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Get the header image
            const headerImagePath = path.join(
                process.cwd(),
                "public/image/bcbd4d01-2683-4fe9-85a6-e65ab090b01d.jpeg"
            );

            // Add header image
            doc.image(headerImagePath, {
                fit: [500, 100],
                align: 'center'
            });
            doc.moveDown(2);

            // Add title
            doc.fontSize(20)
                .fillColor('#2193b0')
                .text('Weekly Report Details', { align: 'center' });
            doc.moveDown();

            // Add status badge
            doc.fontSize(12);
            let statusColor;
            let statusText;
            
            switch(report.status) {
                case 'pending':
                    statusColor = '#ff9f43';
                    statusText = 'Pending Review';
                    break;
                case 'approved':
                    statusColor = '#28c76f';
                    statusText = 'Approved';
                    break;
                case 'rejected':
                    statusColor = '#ea5455';
                    statusText = 'Rejected';
                    break;
                default:
                    statusColor = '#6c757d';
                    statusText = 'Unknown';
            }
            
            doc.fillColor(statusColor)
                .text(statusText, { align: 'center' });
            
            if (report.archived) {
                doc.fillColor('#6c757d')
                    .text('Archived', { align: 'center' });
            }
            
            doc.moveDown();

            // Add report metadata
            doc.fillColor('#000000');
            
            // Format dates
            const weekStartDate = new Date(report.weekStartDate).toLocaleDateString();
            const weekEndDate = new Date(report.weekEndDate).toLocaleDateString();
            
            // Student info table
            doc.fontSize(12).fillColor('#495057');
            
            // Student Name
            doc.text('Student Name:', { continued: true })
                .fillColor('#2193b0')
                .text(` ${report.studentName}`, { align: 'left' });
            doc.moveDown(0.5);
            
            // Internship Site
            doc.fillColor('#495057')
                .text('Internship Site:', { continued: true })
                .fillColor('#2193b0')
                .text(` ${report.internshipSite}`, { align: 'left' });
            doc.moveDown(0.5);
            
            // Week Period
            doc.fillColor('#495057')
                .text('Week Period:', { continued: true })
                .fillColor('#2193b0')
                .text(` ${weekStartDate} - ${weekEndDate}`, { align: 'left' });
            doc.moveDown(0.5);
            
            // Supervisor Name
            doc.fillColor('#495057')
                .text('Supervisor Name:', { continued: true })
                .fillColor('#2193b0')
                .text(` ${report.supervisorName}`, { align: 'left' });
            
            // Archive reason if applicable
            if (report.archived && report.archivedReason) {
                doc.moveDown(0.5);
                doc.fillColor('#495057')
                    .text('Archive Reason:', { continued: true })
                    .fillColor('#2193b0')
                    .text(` ${report.archivedReason}`, { align: 'left' });
            }
            
            doc.moveDown(2);

            // Daily Records Section
            doc.fontSize(16)
                .fillColor('#2193b0')
                .text('Daily Records', { align: 'center' });
            doc.moveDown();

            // Days of the week
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            
            days.forEach((day, index) => {
                // Day header
                doc.rect(50, doc.y, 500, 30)
                    .fill('#2193b0');
                
                doc.fillColor('#FFFFFF')
                    .text(day, 60, doc.y - 20, { align: 'left' });
                
                // Check if there are records for this day
                if (report.dailyRecords && report.dailyRecords[index]) {
                    const dailyRecord = report.dailyRecords[index];
                    
                    // Card body background
                    doc.rect(50, doc.y, 500, 120)
                        .fill('#f8f9fa');
                    
                    // Time records
                    doc.fillColor('#495057')
                        .fontSize(12)
                        .text('Morning', 60, doc.y - 110);
                    
                    doc.fillColor('#6c757d')
                        .fontSize(10)
                        .text(`In: ${dailyRecord.timeIn.morning}    Out: ${dailyRecord.timeOut.morning}`, 60, doc.y + 5);
                    
                    doc.fillColor('#495057')
                        .fontSize(12)
                        .text('Afternoon', 300, doc.y - 15);
                    
                    doc.fillColor('#6c757d')
                        .fontSize(10)
                        .text(`In: ${dailyRecord.timeIn.afternoon}    Out: ${dailyRecord.timeOut.afternoon}`, 300, doc.y + 5);
                    
                    // Accomplishments
                    doc.moveTo(50, doc.y + 20)
                        .lineTo(550, doc.y + 20)
                        .stroke('#dee2e6');
                    
                    doc.fillColor('#495057')
                        .fontSize(12)
                        .text('Accomplishments:', 60, doc.y + 30);
                    
                    doc.fillColor('#000000')
                        .fontSize(10)
                        .text(dailyRecord.accomplishments || 'No accomplishments recorded', 60, doc.y + 5, {
                            width: 480,
                            align: 'left'
                        });
                    
                    // Move down for next day
                    doc.moveDown(7);
                } else {
                    // No records for this day
                    doc.rect(50, doc.y, 500, 50)
                        .fill('#f8f9fa');
                    
                    doc.fillColor('#6c757d')
                        .fontSize(10)
                        .text('No records for this day', 60, doc.y - 40, { align: 'left' });
                    
                    // Move down for next day
                    doc.moveDown(4);
                }
                
                doc.moveDown();
            });

            // Certification section
            doc.rect(50, doc.y, 500, 150)
                .fill('#f8f9fa');
            
            doc.fillColor('#495057')
                .fontSize(10)
                .text('"I CERTIFY on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival at and departure from office."', 60, doc.y - 140, {
                    width: 480,
                    align: 'center',
                    italic: true
                });
            
            doc.moveDown(2);
            
            // Signatures
            const signatureY = doc.y;
            
            // Supervisor signature
            doc.moveTo(100, signatureY + 20)
                .lineTo(250, signatureY + 20)
                .stroke();
            
            doc.fontSize(10)
                .fillColor('#000000')
                .text(report.supervisorName, 100, signatureY + 25, { width: 150, align: 'center' });
            
            doc.fontSize(9)
                .fillColor('#6c757d')
                .text("Company Supervisor's Signature", 100, doc.y + 5, { width: 150, align: 'center' });
            
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 100, doc.y + 5, { width: 150, align: 'center' });
            
            // Student signature
            doc.moveTo(350, signatureY + 20)
                .lineTo(500, signatureY + 20)
                .stroke();
            
            doc.fontSize(10)
                .fillColor('#000000')
                .text(report.studentName, 350, signatureY + 25, { width: 150, align: 'center' });
            
            doc.fontSize(9)
                .fillColor('#6c757d')
                .text("Student Intern's Signature", 350, doc.y + 5, { width: 150, align: 'center' });
            
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, doc.y + 5, { width: 150, align: 'center' });
            
            // Admin comments if they exist
            if (report.adminComments) {
                doc.addPage();
                
                doc.fontSize(16)
                    .fillColor('#2193b0')
                    .text('Admin Comments', { align: 'center' });
                doc.moveDown();
                
                doc.rect(50, doc.y, 500, 200)
                    .fill('#f8f9fa');
                
                doc.fillColor('#000000')
                    .fontSize(12)
                    .text(report.adminComments, 60, doc.y - 190, {
                        width: 480,
                        align: 'left'
                    });
            }

            // Finalize the PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
