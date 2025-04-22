import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { format } from "date-fns";

/**
 * Generates a PDF for a Learning Outcome
 * @param {Object} report - The learning outcome data
 * @returns {Promise<Buffer>} - A promise that resolves to a PDF buffer
 */
export const generateLearningOutcomePdf = (report) => {
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
            if (!report.entries || report.entries.length === 0) {
                throw new Error("Learning outcome entries are missing");
            }

            // Create a document with Legal size for more space
            const doc = new PDFDocument({
                margin: 30,
                size: "legal",
                autoFirstPage: true,
                info: {
                    Title: "Learning Outcomes Report",
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

            // Define styles
            const colors = {
                primary: "#2193b0",
                secondary: "#7f8c8d",
                light: "#f8f9fa",
                white: "#ffffff",
                dark: "#343a40",
                border: "#dee2e6",
                accent: "#6dd5ed",
            };

            const fonts = {
                title: 16,
                subtitle: 14,
                heading: 12,
                normal: 10,
                small: 8,
            };

            // Helper function to add consistent spacing between sections
            const addSectionSpacing = (doc, type = "default") => {
                const spacings = {
                    header: 10,
                    title: 15,
                    info: 20,
                    section: 15,
                    default: 10,
                };
                doc.moveDown(spacings[type] / 5);
            };

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
                .text("LEARNING OUTCOMES REPORT", { align: "center" });

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
                .roundedRect(30, infoBoxY, contentWidth, 50, 5)
                .fillAndStroke(colors.light, colors.border);

            // Student Name
            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text("Student Name:", 45, infoBoxY + 12, { continued: true })
                .fillColor(colors.primary)
                .text(` ${report.studentName}`, { align: "left" });

            // Date Submitted
            doc
                .fillColor(colors.dark)
                .text("Date Submitted:", 45, infoBoxY + 30, { continued: true })
                .fillColor(colors.primary)
                .text(
                    ` ${format(new Date(report.dateSubmitted), "MMMM d, yyyy")}`,
                    { align: "left" }
                );

            // Status with colored badge
            const statusX = pageWidth / 2 + 30;
            doc
                .fillColor(colors.dark)
                .text("Status:", statusX, infoBoxY + 12, { continued: true });

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
            const badgeHeight = 18;
            const badgeX = statusX + 50;
            const badgeY = infoBoxY + 9;

            doc
                .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10)
                .fill(statusColor);

            doc
                .fontSize(fonts.small)
                .fillColor(colors.white)
                .text(statusText, badgeX, badgeY + 4, {
                    width: badgeWidth,
                    align: "center",
                });

            // Total Entries
            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text("Total Entries:", statusX, infoBoxY + 30, { continued: true })
                .fillColor(colors.primary)
                .text(` ${report.entries.length}`, { align: "left" });

            // ===== LEARNING OUTCOMES SECTION =====
            addSectionSpacing(doc, "info");

            // Add section title
            doc
                .fontSize(fonts.subtitle)
                .fillColor(colors.primary)
                .text("Learning Outcomes", { align: "center" });

            addSectionSpacing(doc, "default");

            // Loop through each entry
            report.entries.forEach((entry, index) => {
                // Create a card for each entry
                const entryY = doc.y;
                const entryHeight = 120; // Estimated height, will adjust based on content

                // Check if we need to add a new page
                if (entryY + entryHeight > doc.page.height - 50) {
                    doc.addPage();
                }

                // Draw entry card
                doc
                    .roundedRect(30, doc.y, contentWidth, entryHeight, 5)
                    .fillAndStroke(colors.white, colors.border);

                // Entry number and date
                doc
                    .fontSize(fonts.heading)
                    .fillColor(colors.primary)
                    .text(`Entry #${index + 1}`, 45, doc.y - entryHeight + 15, {
                        continued: true,
                    })
                    .fontSize(fonts.normal)
                    .fillColor(colors.secondary)
                    .text(
                        ` - ${format(new Date(entry.date), "MMMM d, yyyy")}`,
                        { align: "left" }
                    );

                // Activity
                doc
                    .fontSize(fonts.normal)
                    .fillColor(colors.dark)
                    .text("Activity:", 45, doc.y + 10, { continued: true })
                    .fillColor(colors.dark)
                    .text(` ${entry.activity}`, { align: "left" });

                // Learning Outcome
                doc
                    .fontSize(fonts.normal)
                    .fillColor(colors.dark)
                    .text("Learning Outcome:", 45, doc.y + 10, { continued: true })
                    .fillColor(colors.dark)
                    .text(` ${entry.learningOutcome}`, { align: "left" });

                // Move down for the next entry
                doc.y = doc.y + 20;
            });

            // ===== CERTIFICATION SECTION =====
            addSectionSpacing(doc, "section");

            // Certification box
            const certBoxY = doc.y;
            doc
                .roundedRect(30, certBoxY, contentWidth, 80, 5)
                .fillAndStroke(colors.light, colors.border);

            // Certification text
            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(
                    "I hereby certify that the information provided in this Learning Outcomes Report is true and accurate to the best of my knowledge.",
                    40,
                    certBoxY + 15,
                    {
                        width: contentWidth - 20,
                        align: "center",
                        italic: true,
                    }
                );

            // Signature line
            const signatureY = certBoxY + 50;
            const signatureWidth = 200;
            const signatureX = (pageWidth - signatureWidth) / 2;

            doc
                .moveTo(signatureX, signatureY)
                .lineTo(signatureX + signatureWidth, signatureY)
                .stroke(colors.dark);

            doc
                .fontSize(fonts.normal)
                .fillColor(colors.dark)
                .text(report.studentName, signatureX, signatureY + 5, {
                    width: signatureWidth,
                    align: "center",
                });

            doc
                .fontSize(fonts.small)
                .fillColor(colors.secondary)
                .text("Student's Signature", signatureX, signatureY + 20, {
                    width: signatureWidth,
                    align: "center",
                });

            // Add generation date at the bottom
            doc
                .fontSize(fonts.small)
                .fillColor(colors.secondary)
                .text(
                    `Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`,
                    30,
                    doc.page.height - 50,
                    {
                        align: "center",
                        width: contentWidth,
                    }
                );

            // Finalize the PDF
            doc.end();
        } catch (error) {
            console.error("PDF generation error:", error);
            // Log report data for debugging (excluding large fields)
            const debugReport = { ...report };
            if (debugReport.entries) {
                debugReport.entries = `Array with ${debugReport.entries.length} items`;
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
