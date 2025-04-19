import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { format } from "date-fns";

/**
 * Generates a PDF for a Weekly Progress Report
 * @param {Object} report - The report data
 * @returns {Promise<Buffer>} - A promise that resolves to a PDF buffer
 */
export const generateWeeklyProgressReportPdf = (report) => {
    return new Promise((resolve, reject) => {
        try {
            // Validate report data
            if (!report) {
                throw new Error("Report data is missing");
            }

            // Validate required fields
            if (!report.studentName) {
                throw new Error("Student name is missing");
            }
            if (!report.internshipSite) {
                throw new Error("Internship site is missing");
            }
            if (!report.weekStartDate || !report.weekEndDate) {
                throw new Error("Week period dates are missing");
            }
            if (!report.supervisorName) {
                throw new Error("Supervisor name is missing");
            }

            // Create a document with Legal size for more space
            const doc = new PDFDocument({
                margin: 30,
                size: "legal",
                autoFirstPage: true,
                info: {
                    Title: "Weekly Progress Report",
                    Author: "OJT System",
                },
                compress: true,
            });

            // Buffer to store PDF
            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Handle errors
            doc.on("error", (err) => {
                console.error("PDF document error:", err);
                reject(err);
            });

            // Get the header image path
            const headerImagePath = path.join(
                process.cwd(),
                "public/image/bcbd4d01-2683-4fe9-85a6-e65ab090b01d.jpeg"
            );

            // Check if the header image exists
            if (!fs.existsSync(headerImagePath)) {
                console.error(`Header image not found at path: ${headerImagePath}`);
                throw new Error("Header image file not found");
            }

            // Define colors
            const colors = {
                primary: "#2193b0",
                secondary: "#6c757d",
                light: "#f8f9fa",
                dark: "#343a40",
                border: "#dee2e6",
                white: "#FFFFFF",
                black: "#000000",
                highlight: "#17a2b8",
            };

            // Define fonts and sizes
            const fonts = {
                title: 22,
                subtitle: 16,
                heading: 14,
                normal: 10,
                small: 9,
            };

            // Helper function for section spacing
            const addSectionSpacing = (doc, section) => {
                const spacings = {
                    header: 15,
                    title: 20,
                    info: 25,
                    section: 15,
                    subsection: 10,
                };
                doc.moveDown(spacings[section] / 10 || 1);
            };

            // Format dates
            const weekStartDate = format(
                new Date(report.weekStartDate),
                "MMM dd, yyyy"
            );
            const weekEndDate = format(new Date(report.weekEndDate), "MMM dd, yyyy");

            // Calculate page dimensions
            const pageWidth = doc.page.width;
            const contentWidth = pageWidth - 60; // Accounting for margins

            // ===== HEADER SECTION =====
            try {
                // Add header image with optimized dimensions
                doc.image(headerImagePath, {
                    fit: [contentWidth, 60], // Reduced height
                    align: "center",
                });
            } catch (imageError) {
                console.error("Error loading header image:", imageError);
                doc
                    .fontSize(fonts.normal)
                    .fillColor(colors.secondary)
                    .text("[Header image could not be loaded]", { align: "center" });
            }

            // Add title with modern styling
            addSectionSpacing(doc, "header"); // Custom spacing after header image
            doc
                .fontSize(fonts.title)
                .fillColor(colors.primary)
                .text("WEEKLY PROGRESS REPORT", { align: "center" });

            // Add decorative line
            const lineWidth = 450;
            const lineX = (pageWidth - lineWidth) / 2;
            doc
                .moveTo(lineX, doc.y + 5)
                .lineTo(lineX + lineWidth, doc.y + 5)
                .lineWidth(1)
                .stroke(colors.primary);

            // ===== STUDENT INFO SECTION =====
            addSectionSpacing(doc, "title"); // Custom spacing after title

            // Create a modern info box
            const infoBoxY = doc.y;
            doc
                .roundedRect(30, infoBoxY, contentWidth, 70, 5) // Reduced height
                .fillAndStroke(colors.light, colors.border);

            // Left column
            doc.fontSize(fonts.normal).fillColor(colors.dark);

            // Student Name
            doc
                .text("Student Name:", 45, infoBoxY + 12, { continued: true }) // Adjusted position
                .fillColor(colors.primary)
                .text(` ${report.studentName}`, { align: "left" });

            // Internship Site
            doc
                .fillColor(colors.dark)
                .text("Internship Site:", 45, infoBoxY + 26, { continued: true }) // Adjusted position
                .fillColor(colors.primary)
                .text(` ${report.internshipSite}`, { align: "left" });

            // Week Number
            doc
                .fillColor(colors.dark)
                .text("Week Number:", 45, infoBoxY + 40, { continued: true }) // Adjusted position
                .fillColor(colors.primary)
                .text(` ${report.weekNumber}`, { align: "left" });

            // Week Period
            doc
                .fillColor(colors.dark)
                .text("Week Period:", 45, infoBoxY + 54, { continued: true }) // Adjusted position
                .fillColor(colors.primary)
                .text(` ${weekStartDate} - ${weekEndDate}`, { align: "left" });

            // Right column - Status
            const statusX = pageWidth / 2 + 30;

            // Status with colored badge
            doc
                .fillColor(colors.dark)
                .text("Status:", statusX, infoBoxY + 12, { continued: true }); // Adjusted position

            // Create a status badge with appropriate color
            const statusColors = {
                pending: "#ffc107",
                approved: "#28a745",
                rejected: "#dc3545",
            };

            const statusColor = statusColors[report.status] || statusColors.pending;
            const statusText = report.status
                ? report.status.toUpperCase()
                : "PENDING";

            // Draw status badge
            const badgeWidth = 80;
            const badgeHeight = 18; // Reduced height
            const badgeX = statusX + 50;
            const badgeY = infoBoxY + 9; // Adjusted position

            doc
                .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10)
                .fill(statusColor);

            doc
                .fontSize(fonts.small)
                .fillColor(colors.white)
                .text(statusText, badgeX, badgeY + 4, {
                    // Adjusted position
                    width: badgeWidth,
                    align: "center",
                });

            // Supervisor Name
            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text("Supervisor:", statusX, infoBoxY + 40, { continued: true }) // Adjusted position
                .fillColor(colors.primary)
                .text(` ${report.supervisorName}`, { align: "left" });

            // Supervisor Role
            doc
                .fillColor(colors.dark)
                .text("Supervisor Role:", statusX, infoBoxY + 54, { continued: true }) // Adjusted position
                .fillColor(colors.primary)
                .text(` ${report.supervisorRole}`, { align: "left" });

            // ===== WEEKLY ACTIVITIES SECTION =====
            addSectionSpacing(doc, "info"); // Custom spacing after info section

            // Section title
            doc
                .fontSize(fonts.subtitle)
                .fillColor(colors.primary)
                .text("WEEKLY ACTIVITIES", { align: "center" });

            addSectionSpacing(doc, "section");

            // Duties Performed
            doc
                .fontSize(fonts.heading)
                .fillColor(colors.dark)
                .text("Duties Performed this week", { continued: false });

            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(report.dutiesPerformed || "None reported", {
                    align: "left",
                    indent: 10,
                });

            addSectionSpacing(doc, "subsection");

            // New Trainings
            doc
                .fontSize(fonts.heading)
                .fillColor(colors.dark)
                .text("New Trainings", { continued: false });

            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(report.newTrainings || "None reported", {
                    align: "left",
                    indent: 10,
                });

            // ===== ACCOMPLISHMENTS SECTION =====
            addSectionSpacing(doc, "section");

            // Section title
            doc
                .fontSize(fonts.subtitle)
                .fillColor(colors.primary)
                .text("MAJOR ACCOMPLISHMENTS", { align: "center" });

            addSectionSpacing(doc, "section");

            // Check if there are accomplishments
            if (
                report.accomplishments &&
                Array.isArray(report.accomplishments) &&
                report.accomplishments.length > 0
            ) {
                // Loop through accomplishments
                report.accomplishments.forEach((accomplishment, index) => {
                    // Accomplishment number
                    doc
                        .fontSize(fonts.heading)
                        .fillColor(colors.dark)
                        .text(`Accomplishment ${index + 1}`, { continued: false });

                    // Create a box for the accomplishment
                    const boxY = doc.y + 5;
                    doc
                        .roundedRect(40, boxY, contentWidth - 20, 80, 5)
                        .fillAndStroke(colors.light, colors.border);

                    // Proposed Activity
                    doc
                        .fontSize(fonts.normal)
                        .fillColor(colors.dark)
                        .text("PROPOSED ACTIVITY:", 50, boxY + 10, { continued: false });

                    doc
                        .fontSize(fonts.normal)
                        .fillColor(colors.dark)
                        .text(accomplishment.proposedActivity || "None reported", 50, boxY + 25, {
                            width: contentWidth - 40,
                            align: "left",
                        });

                    // Accomplishment Details
                    doc
                        .fontSize(fonts.normal)
                        .fillColor(colors.dark)
                        .text("ACCOMPLISHMENTS:", 50, boxY + 45, { continued: false });

                    doc
                        .fontSize(fonts.normal)
                        .fillColor(colors.dark)
                        .text(
                            accomplishment.accomplishmentDetails || "None reported",
                            50,
                            boxY + 60,
                            {
                                width: contentWidth - 40,
                                align: "left",
                            }
                        );

                    // Move down for the next accomplishment
                    doc.y = boxY + 90;
                });
            } else {
                doc
                    .fontSize(fonts.normal)
                    .fillColor(colors.secondary)
                    .text("No accomplishments recorded.", {
                        align: "center",
                    });
            }

            // ===== PROBLEMS AND GOALS SECTION =====
            addSectionSpacing(doc, "section");

            // Section title
            doc
                .fontSize(fonts.subtitle)
                .fillColor(colors.primary)
                .text("PROBLEMS AND GOALS", { align: "center" });

            addSectionSpacing(doc, "section");

            // Problems Encountered
            doc
                .fontSize(fonts.heading)
                .fillColor(colors.dark)
                .text("Problems Encountered", { continued: false });

            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(report.problemsEncountered || "None reported", {
                    align: "left",
                    indent: 10,
                });

            addSectionSpacing(doc, "subsection");

            // Solutions Applied
            doc
                .fontSize(fonts.heading)
                .fillColor(colors.dark)
                .text("Solutions Applied", { continued: false });

            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(report.problemSolutions || "None reported", {
                    align: "left",
                    indent: 10,
                });

            addSectionSpacing(doc, "subsection");

            // Goals for Next Week
            doc
                .fontSize(fonts.heading)
                .fillColor(colors.dark)
                .text("Goals for Next Week", { continued: false });

            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(report.goalsForNextWeek || "None reported", {
                    align: "left",
                    indent: 10,
                });

            // ===== CERTIFICATION SECTION =====
            addSectionSpacing(doc, "section");

            // Certification box
            const certBoxY = doc.y;
            doc
                .roundedRect(30, certBoxY, contentWidth, 110, 5) // Reduced height
                .fillAndStroke(colors.light, colors.border);

            // Certification text
            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(
                    '"I CERTIFY on my honor that the above is a true and correct report of the progress made during the week."',
                    40,
                    certBoxY + 12, // Adjusted position
                    {
                        width: contentWidth - 20,
                        align: "center",
                        italic: true,
                    }
                );

            // Signature lines
            const signatureY = certBoxY + 45; // Adjusted position
            const signatureWidth = 200;

            // Supervisor signature
            const supervisorX = 70;
            doc
                .moveTo(supervisorX, signatureY)
                .lineTo(supervisorX + signatureWidth, signatureY)
                .stroke(colors.dark);

            const supervisorName = report.supervisorName || "Supervisor Name";

            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(supervisorName, supervisorX, signatureY + 5, {
                    width: signatureWidth,
                    align: "center",
                });

            doc
                .fontSize(fonts.small)
                .fillColor(colors.secondary)
                .text("Company Supervisor's Signature", supervisorX, signatureY + 20, {
                    width: signatureWidth,
                    align: "center",
                });

            doc.text(
                `Date: ${format(new Date(), "MMM dd, yyyy")}`,
                supervisorX,
                signatureY + 35,
                {
                    width: signatureWidth,
                    align: "center",
                }
            );

            // Student signature
            const studentX = pageWidth - 270;
            doc
                .moveTo(studentX, signatureY)
                .lineTo(studentX + signatureWidth, signatureY)
                .stroke(colors.dark);

            const studentName = report.studentName || "Student Name";

            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(studentName, studentX, signatureY + 5, {
                    width: signatureWidth,
                    align: "center",
                });

            doc
                .fontSize(fonts.small)
                .fillColor(colors.secondary)
                .text("Student Intern's Signature", studentX, signatureY + 20, {
                    width: signatureWidth,
                    align: "center",
                });

            doc.text(
                `Date: ${format(new Date(), "MMM dd, yyyy")}`,
                studentX,
                signatureY + 35,
                {
                    width: signatureWidth,
                    align: "center",
                }
            );

            // Finalize the PDF
            doc.end();
        } catch (error) {
            console.error("PDF generation error:", error);
            // Log report data for debugging (excluding large fields)
            const debugReport = { ...report };
            if (debugReport.accomplishments) {
                debugReport.accomplishments = `Array with ${debugReport.accomplishments.length} items`;
            }
            if (debugReport.adminComments) {
                debugReport.adminComments =
                    debugReport.adminComments.substring(0, 50) + "...";
            }
            console.error(
                "Report data causing error:",
                JSON.stringify(debugReport, null, 2)
            );
            reject(error);
        }
    });
};
