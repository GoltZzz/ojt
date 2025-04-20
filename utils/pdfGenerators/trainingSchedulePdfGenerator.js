import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { format } from "date-fns";

/**
 * Generates a PDF for a Training Schedule Form
 * @param {Object} schedule - The training schedule data
 * @returns {Promise<Buffer>} - A promise that resolves to a PDF buffer
 */
export const generateTrainingSchedulePdf = (schedule) => {
	return new Promise((resolve, reject) => {
		try {
			// Validate schedule data
			if (!schedule) {
				throw new Error("Schedule data is missing");
			}

			// Validate required fields
			if (!schedule.studentName) {
				throw new Error("Student name is missing");
			}
			if (!schedule.internshipSite) {
				throw new Error("Internship site is missing");
			}
			if (!schedule.startDate || !schedule.endDate) {
				throw new Error("Training period dates are missing");
			}
			if (!schedule.proposedActivities) {
				throw new Error("Proposed activities are missing");
			}
			if (!schedule.performanceMethod) {
				throw new Error("Performance method is missing");
			}
			if (!schedule.trainer) {
				throw new Error("Trainer is missing");
			}
			if (!schedule.timeline) {
				throw new Error("Timeline is missing");
			}
			if (!schedule.expectedOutput) {
				throw new Error("Expected output is missing");
			}

			// Create a document with Legal size for more space
			const doc = new PDFDocument({
				margin: 30,
				size: "legal",
				autoFirstPage: true,
				info: {
					Title: "Training Schedule Form",
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
				primary: "#2c3e50",
				secondary: "#7f8c8d",
				light: "#f8f9fa",
				white: "#ffffff",
				dark: "#343a40",
				border: "#dee2e6",
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
				.text("TRAINING SCHEDULE FORM", { align: "center" });

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
				.text(` ${schedule.studentName}`, { align: "left" });

			// Internship Site
			doc
				.fillColor(colors.dark)
				.text("Internship Site:", 45, infoBoxY + 30, { continued: true }) // Adjusted position
				.fillColor(colors.primary)
				.text(` ${schedule.internshipSite}`, { align: "left" });

			// Format dates with error handling
			let startDate = "N/A";
			let endDate = "N/A";
			try {
				if (schedule.startDate) {
					const sDate = new Date(schedule.startDate);
					if (!isNaN(sDate.getTime())) {
						startDate = format(sDate, "MMM dd, yyyy");
					}
				}
				if (schedule.endDate) {
					const eDate = new Date(schedule.endDate);
					if (!isNaN(eDate.getTime())) {
						endDate = format(eDate, "MMM dd, yyyy");
					}
				}
			} catch (dateError) {
				console.error("Error formatting dates:", dateError);
			}

			// Training Period
			doc
				.fillColor(colors.dark)
				.text("Training Period:", 45, infoBoxY + 48, { continued: true }) // Adjusted position
				.fillColor(colors.primary)
				.text(` ${startDate} - ${endDate}`, { align: "left" });

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

			const statusColor = statusColors[schedule.status] || statusColors.pending;
			const statusText = schedule.status
				? schedule.status.toUpperCase()
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

			// Date Submitted
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text("Date Submitted:", statusX, infoBoxY + 30, { continued: true }) // Adjusted position
				.fillColor(colors.primary);

			// Format date with error handling
			let formattedSubmitDate = "N/A";
			try {
				if (schedule.dateSubmitted) {
					const submitDate = new Date(schedule.dateSubmitted);
					if (!isNaN(submitDate.getTime())) {
						formattedSubmitDate = format(submitDate, "MMM dd, yyyy");
					}
				}
			} catch (dateError) {
				console.error("Error formatting submission date:", dateError);
			}

			doc.text(` ${formattedSubmitDate}`, {
				align: "left",
			});

			// Trainer
			doc
				.fillColor(colors.dark)
				.text("Trainer:", statusX, infoBoxY + 48, { continued: true }) // Adjusted position
				.fillColor(colors.primary)
				.text(` ${schedule.trainer}`, { align: "left" });

			// ===== TRAINING DETAILS SECTION =====
			addSectionSpacing(doc, "info"); // Custom spacing after info section

			// Create a table for training details
			const tableTop = doc.y;
			const tableWidth = contentWidth;
			const labelColWidth = 150;
			const contentColWidth = tableWidth - labelColWidth;
			const rowHeight = 70; // Increased height for content to prevent overflow
			let currentY = tableTop;

			// Create a gradient-like effect for the header
			// Simulating linear-gradient(45deg, #2193b0, #6dd5ed)
			// We'll create multiple rectangles with slightly different colors
			const startColor = "#2193b0"; // Start color of gradient
			const endColor = "#6dd5ed"; // End color of gradient
			const segments = 10; // Number of segments to create
			const segmentWidth = tableWidth / segments;

			// Helper function to interpolate between two colors
			const interpolateColor = (color1, color2, factor) => {
				// Convert hex to RGB
				const r1 = parseInt(color1.substring(1, 3), 16);
				const g1 = parseInt(color1.substring(3, 5), 16);
				const b1 = parseInt(color1.substring(5, 7), 16);

				const r2 = parseInt(color2.substring(1, 3), 16);
				const g2 = parseInt(color2.substring(3, 5), 16);
				const b2 = parseInt(color2.substring(5, 7), 16);

				// Interpolate
				const r = Math.round(r1 + factor * (r2 - r1));
				const g = Math.round(g1 + factor * (g2 - g1));
				const b = Math.round(b1 + factor * (b2 - b1));

				// Convert back to hex
				return `#${r.toString(16).padStart(2, "0")}${g
					.toString(16)
					.padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
			};

			// Draw the gradient segments
			for (let i = 0; i < segments; i++) {
				const factor = i / (segments - 1);
				const color = interpolateColor(startColor, endColor, factor);
				doc.rect(30 + i * segmentWidth, currentY, segmentWidth, 30).fill(color);
			}

			// Header text
			doc.fillColor(colors.white).fontSize(fonts.heading);
			doc.text("TRAINING DETAILS", 40, currentY + 10, {
				width: tableWidth - 20,
				align: "center",
			});

			// Update Y position
			currentY += 30;

			// Proposed Activities row
			doc.rect(30, currentY, tableWidth, rowHeight).fill(colors.white);

			// Draw vertical divider
			doc
				.moveTo(30 + labelColWidth, currentY)
				.lineTo(30 + labelColWidth, currentY + rowHeight)
				.stroke(colors.border);

			// Label column
			doc
				.fontSize(fonts.heading)
				.fillColor(colors.primary)
				.text("Proposed Activities", 40, currentY + 15);

			// Content column
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(
					schedule.proposedActivities,
					40 + labelColWidth + 10,
					currentY + 15,
					{
						width: contentColWidth - 20,
						align: "left",
						lineGap: 2,
					}
				);

			// Update Y position
			currentY += rowHeight;

			// Performance Method row
			doc.rect(30, currentY, tableWidth, rowHeight).fill(colors.light);

			// Draw vertical divider
			doc
				.moveTo(30 + labelColWidth, currentY)
				.lineTo(30 + labelColWidth, currentY + rowHeight)
				.stroke(colors.border);

			// Label column - using a smaller font size and line break for the longer label
			doc
				.fontSize(fonts.normal) // Smaller font size
				.fillColor(colors.primary)
				.text("How Activities Will\nBe Performed", 40, currentY + 15); // Add line break

			// Content column
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(
					schedule.performanceMethod,
					40 + labelColWidth + 10,
					currentY + 15,
					{
						width: contentColWidth - 20,
						align: "left",
						lineGap: 2,
					}
				);

			// Update Y position
			currentY += rowHeight;

			// Timeline row
			doc.rect(30, currentY, tableWidth, rowHeight).fill(colors.white);

			// Draw vertical divider
			doc
				.moveTo(30 + labelColWidth, currentY)
				.lineTo(30 + labelColWidth, currentY + rowHeight)
				.stroke(colors.border);

			// Label column
			doc
				.fontSize(fonts.heading)
				.fillColor(colors.primary)
				.text("Timeline", 40, currentY + 15);

			// Content column
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(schedule.timeline, 40 + labelColWidth + 10, currentY + 15, {
					width: contentColWidth - 20,
					align: "left",
					lineGap: 2,
				});

			// Update Y position
			currentY += rowHeight;

			// Expected Output row
			doc.rect(30, currentY, tableWidth, rowHeight).fill(colors.light);

			// Draw vertical divider
			doc
				.moveTo(30 + labelColWidth, currentY)
				.lineTo(30 + labelColWidth, currentY + rowHeight)
				.stroke(colors.border);

			// Label column
			doc
				.fontSize(fonts.heading)
				.fillColor(colors.primary)
				.text("Expected Output", 40, currentY + 15);

			// Content column
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(schedule.expectedOutput, 40 + labelColWidth + 10, currentY + 15, {
					width: contentColWidth - 20,
					align: "left",
					lineGap: 2,
				});

			// Update Y position
			currentY += rowHeight;

			// Additional Notes row (if available)
			if (schedule.additionalNotes) {
				doc.rect(30, currentY, tableWidth, rowHeight).fill(colors.white);

				// Draw vertical divider
				doc
					.moveTo(30 + labelColWidth, currentY)
					.lineTo(30 + labelColWidth, currentY + rowHeight)
					.stroke(colors.border);

				// Label column
				doc
					.fontSize(fonts.heading)
					.fillColor(colors.primary)
					.text("Additional Notes", 40, currentY + 15);

				// Content column
				doc
					.fontSize(fonts.normal)
					.fillColor(colors.dark)
					.text(
						schedule.additionalNotes,
						40 + labelColWidth + 10,
						currentY + 15,
						{
							width: contentColWidth - 20,
							align: "left",
							lineGap: 2,
						}
					);

				// Update Y position
				currentY += rowHeight;
			}

			// Draw bottom border
			doc.rect(30, currentY, tableWidth, 1).fill(colors.border);

			// ===== CERTIFICATION SECTION =====
			addSectionSpacing(doc, "section");

			// Certification box
			const certBoxY = doc.y;
			doc
				.roundedRect(30, certBoxY, contentWidth, 80, 5) // Reduced height
				.fillAndStroke(colors.light, colors.border);

			// Certification text
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(
					'"I CERTIFY on my honor that the above is a true and correct training schedule that will be followed during the internship period."',
					40,
					certBoxY + 12, // Adjusted position
					{
						width: contentWidth - 20,
						align: "center",
						italic: true,
					}
				);

			// Signature lines
			const signatureY = certBoxY + 40;
			const signatureWidth = 200;
			const signatureGap = (contentWidth - signatureWidth * 2) / 3;

			// Student signature
			doc
				.moveTo(40 + signatureGap, signatureY)
				.lineTo(40 + signatureGap + signatureWidth, signatureY)
				.stroke(colors.dark);

			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(schedule.studentName, 40 + signatureGap, signatureY + 5, {
					width: signatureWidth,
					align: "center",
				});

			doc
				.fontSize(fonts.small)
				.fillColor(colors.secondary)
				.text("Student", 40 + signatureGap, signatureY + 20, {
					width: signatureWidth,
					align: "center",
				});

			// Trainer signature
			doc
				.moveTo(40 + signatureGap * 2 + signatureWidth, signatureY)
				.lineTo(40 + signatureGap * 2 + signatureWidth * 2, signatureY)
				.stroke(colors.dark);

			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(
					schedule.trainer,
					40 + signatureGap * 2 + signatureWidth,
					signatureY + 5,
					{
						width: signatureWidth,
						align: "center",
					}
				);

			doc
				.fontSize(fonts.small)
				.fillColor(colors.secondary)
				.text(
					"Trainer",
					40 + signatureGap * 2 + signatureWidth,
					signatureY + 20,
					{
						width: signatureWidth,
						align: "center",
					}
				);

			// Finalize the PDF
			doc.end();
		} catch (error) {
			console.error("PDF generation error:", error);
			// Log schedule data for debugging (excluding large fields)
			const debugSchedule = { ...schedule };
			if (
				debugSchedule.proposedActivities &&
				debugSchedule.proposedActivities.length > 100
			) {
				debugSchedule.proposedActivities =
					debugSchedule.proposedActivities.substring(0, 100) + "...";
			}
			if (
				debugSchedule.performanceMethod &&
				debugSchedule.performanceMethod.length > 100
			) {
				debugSchedule.performanceMethod =
					debugSchedule.performanceMethod.substring(0, 100) + "...";
			}
			if (
				debugSchedule.expectedOutput &&
				debugSchedule.expectedOutput.length > 100
			) {
				debugSchedule.expectedOutput =
					debugSchedule.expectedOutput.substring(0, 100) + "...";
			}
			if (
				debugSchedule.additionalNotes &&
				debugSchedule.additionalNotes.length > 100
			) {
				debugSchedule.additionalNotes =
					debugSchedule.additionalNotes.substring(0, 100) + "...";
			}
			console.error(
				"Schedule data causing error:",
				JSON.stringify(debugSchedule, null, 2)
			);
			reject(error);
		}
	});
};
