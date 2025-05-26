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
				margin: { top: 30, left: 30, right: 30, bottom: 25 }, // Reduced bottom margin
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
				dark: "#2c3e50", // Changed from black to dark blue
				border: "#dee2e6",
				accent: "#6dd5ed",
				gradient1: "#2193b0",
				gradient2: "#6dd5ed",
			};

			const fonts = {
				title: 18,
				subtitle: 14,
				heading: 12,
				normal: 10,
				small: 8,
			};

			// Helper function to add consistent spacing between sections
			const addSectionSpacing = (doc, type = "default") => {
				const spacings = {
					header: 8,
					title: 10,
					info: 10,
					section: 8,
					default: 5,
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

			// Add title with gradient text
			const titleY = doc.y;

			// Create a gradient for text
			const titleGradient = doc.linearGradient(
				30,
				titleY,
				30 + contentWidth,
				titleY
			);
			titleGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.fontSize(fonts.title)
				.fillColor(titleGradient)
				.text("LEARNING OUTCOMES REPORT", 30, titleY, {
					align: "center",
					width: contentWidth,
				});

			// Add a thin gradient line under the title
			const lineY = doc.y + 5;
			const lineGradient = doc.linearGradient(
				30,
				lineY,
				30 + contentWidth,
				lineY
			);
			lineGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.moveTo(30, lineY)
				.lineTo(30 + contentWidth, lineY)
				.lineWidth(2)
				.strokeColor(lineGradient)
				.stroke();

			// ===== STUDENT INFO SECTION =====
			addSectionSpacing(doc, "title"); // Custom spacing after title

			// Create a modern info box with a subtle border
			const infoBoxY = doc.y;
			const infoBoxHeight = 60; // Reduced height

			// Create a gradient for the border
			const borderGradient = doc.linearGradient(
				30,
				infoBoxY,
				30 + contentWidth,
				infoBoxY
			);
			borderGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.rect(30, infoBoxY, contentWidth, infoBoxHeight)
				.fillColor(colors.light)
				.fillOpacity(0.3)
				.fill()
				.strokeColor(borderGradient)
				.lineWidth(1)
				.stroke();

			doc.fillOpacity(1); // Reset opacity

			// Student Information header with gradient text
			const infoHeaderGradient = doc.linearGradient(
				45,
				infoBoxY + 8,
				250,
				infoBoxY + 8
			);
			infoHeaderGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.fontSize(fonts.heading)
				.fillColor(infoHeaderGradient)
				.text("STUDENT INFORMATION", 45, infoBoxY + 8, { align: "left" }); // Reduced spacing

			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text("Student Name:", 45, infoBoxY + 25, { continued: true }) // Reduced spacing
				.fillColor(colors.primary)
				.text(` ${report.studentName}`, { align: "left" });

			// Date Submitted
			doc
				.fillColor(colors.dark)
				.text("Date Submitted:", 45, infoBoxY + 40, { continued: true }) // Reduced spacing
				.fillColor(colors.primary)
				.text(` ${format(new Date(report.dateSubmitted), "MMMM d, yyyy")}`, {
					align: "left",
				});

			// Status with colored badge
			const statusX = pageWidth / 2 + 30;
			doc
				.fillColor(colors.dark)
				.text("Status:", statusX, infoBoxY + 25, { continued: true }); // Reduced spacing

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
			const badgeY = infoBoxY + 22; // Reduced spacing

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
				.text("Total Entries:", statusX, infoBoxY + 40, { continued: true }) // Reduced spacing
				.fillColor(colors.primary)
				.text(` ${report.entries.length}`, { align: "left" });

			// ===== LEARNING OUTCOMES SECTION =====
			addSectionSpacing(doc, "info");

			// Add section title with gradient text
			const sectionTitleY = doc.y;

			// Create a gradient for text
			const sectionTitleGradient = doc.linearGradient(
				30,
				sectionTitleY,
				30 + contentWidth,
				sectionTitleY
			);
			sectionTitleGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.fontSize(fonts.subtitle)
				.fillColor(sectionTitleGradient)
				.text("LEARNING OUTCOMES", 30, sectionTitleY, {
					align: "center",
					width: contentWidth,
				});

			// Add a thin gradient line under the title
			const sectionLineY = doc.y + 3;
			const sectionLineGradient = doc.linearGradient(
				30,
				sectionLineY,
				30 + contentWidth,
				sectionLineY
			);
			sectionLineGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.moveTo(30, sectionLineY)
				.lineTo(30 + contentWidth, sectionLineY)
				.lineWidth(1.5)
				.strokeColor(sectionLineGradient)
				.stroke();

			addSectionSpacing(doc, "default");

			// Create a table-like structure for entries
			const tableStartY = doc.y;
			const rowHeight = 25; // Reduced row height
			const colWidths = {
				date: 100,
				activity: 180,
				outcome: contentWidth - 280, // Remaining width
			};

			// Table header with light background and gradient border
			const tableHeaderGradient = doc.linearGradient(
				30,
				tableStartY,
				30 + contentWidth,
				tableStartY
			);
			tableHeaderGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.rect(30, tableStartY, contentWidth, rowHeight)
				.fillColor(colors.light)
				.fillOpacity(0.5)
				.fill()
				.strokeColor(tableHeaderGradient)
				.lineWidth(1)
				.stroke();

			doc.fillOpacity(1); // Reset opacity

			// Create gradient for header text
			const headerTextGradient = doc.linearGradient(
				40,
				tableStartY + 10,
				40 + 100,
				tableStartY + 10
			);
			headerTextGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			// Header text with gradient color
			doc
				.fontSize(fonts.heading)
				.fillColor(headerTextGradient)
				.text("Date", 40, tableStartY + 8, { width: colWidths.date })
				.text("Activity", 40 + colWidths.date, tableStartY + 8, {
					width: colWidths.activity,
				})
				.text(
					"Learning Outcome",
					40 + colWidths.date + colWidths.activity,
					tableStartY + 8,
					{ width: colWidths.outcome }
				);

			// Draw table rows for each entry
			let currentY = tableStartY + rowHeight;

			// Loop through each entry
			report.entries.forEach((entry, index) => {
				// Calculate row height based on content
				const activityLines = Math.ceil(entry.activity.length / 45); // Approximate chars per line (increased)
				const outcomeLines = Math.ceil(entry.learningOutcome.length / 45);
				const maxLines = Math.max(activityLines, outcomeLines, 1);
				const dynamicRowHeight = Math.max(rowHeight, maxLines * 12); // 12px per line (reduced)

				// Check if we need to add a new page
				if (currentY + dynamicRowHeight > doc.page.height - 80) {
					// Reduced threshold for page break
					doc.addPage();
					currentY = 50; // Reset Y position on new page

					// Add table header on new page with light background and gradient border
					const newPageHeaderGradient = doc.linearGradient(
						30,
						currentY,
						30 + contentWidth,
						currentY
					);
					newPageHeaderGradient
						.stop(0, colors.gradient1)
						.stop(1, colors.gradient2);

					doc
						.rect(30, currentY, contentWidth, rowHeight)
						.fillColor(colors.light)
						.fillOpacity(0.5)
						.fill()
						.strokeColor(newPageHeaderGradient)
						.lineWidth(1)
						.stroke();

					doc.fillOpacity(1); // Reset opacity

					// Create gradient for header text
					const newPageTextGradient = doc.linearGradient(
						40,
						currentY + 10,
						40 + 100,
						currentY + 10
					);
					newPageTextGradient
						.stop(0, colors.gradient1)
						.stop(1, colors.gradient2);

					// Header text with gradient color
					doc
						.fontSize(fonts.heading)
						.fillColor(newPageTextGradient)
						.text("Date", 40, currentY + 8, { width: colWidths.date })
						.text("Activity", 40 + colWidths.date, currentY + 8, {
							width: colWidths.activity,
						})
						.text(
							"Learning Outcome",
							40 + colWidths.date + colWidths.activity,
							currentY + 8,
							{ width: colWidths.outcome }
						);

					currentY += rowHeight;
				}

				// Draw row background (alternating colors)
				const rowColor = index % 2 === 0 ? colors.white : colors.light;
				doc
					.rect(30, currentY, contentWidth, dynamicRowHeight)
					.fill(rowColor)
					.stroke(colors.border);

				// Draw vertical lines for columns
				doc
					.moveTo(30 + colWidths.date, currentY)
					.lineTo(30 + colWidths.date, currentY + dynamicRowHeight)
					.moveTo(30 + colWidths.date + colWidths.activity, currentY)
					.lineTo(
						30 + colWidths.date + colWidths.activity,
						currentY + dynamicRowHeight
					)
					.stroke(colors.border);

				// Add content
				doc
					.fontSize(fonts.normal)
					.fillColor(colors.dark)
					.text(format(new Date(entry.date), "MM/dd/yyyy"), 40, currentY + 10, {
						width: colWidths.date - 20,
					})
					.text(entry.activity, 40 + colWidths.date, currentY + 10, {
						width: colWidths.activity - 20,
					})
					.text(
						entry.learningOutcome,
						40 + colWidths.date + colWidths.activity,
						currentY + 10,
						{ width: colWidths.outcome - 20 }
					);

				// Update current Y position
				currentY += dynamicRowHeight;
			});

			// ===== CERTIFICATION SECTION =====
			addSectionSpacing(doc, "section");

			// Certification section title with gradient text
			const certTitleY = doc.y;

			// Create a gradient for text
			const certTitleGradient = doc.linearGradient(
				30,
				certTitleY,
				30 + contentWidth,
				certTitleY
			);
			certTitleGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.fontSize(fonts.subtitle)
				.fillColor(certTitleGradient)
				.text("CERTIFICATION", 30, certTitleY, {
					align: "center",
					width: contentWidth,
				});

			// Add a thin gradient line under the title
			const certLineY = doc.y + 3;
			const certLineGradient = doc.linearGradient(
				30,
				certLineY,
				30 + contentWidth,
				certLineY
			);
			certLineGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.moveTo(30, certLineY)
				.lineTo(30 + contentWidth, certLineY)
				.lineWidth(1.5)
				.strokeColor(certLineGradient)
				.stroke();

			addSectionSpacing(doc, "default");

			// Certification box with subtle border
			const certBoxY = doc.y;
			const certBoxHeight = 80; // Reduced height

			// Create a gradient for the border
			const certBoxGradient = doc.linearGradient(
				30,
				certBoxY,
				30 + contentWidth,
				certBoxY
			);
			certBoxGradient.stop(0, colors.gradient1).stop(1, colors.gradient2);

			doc
				.rect(30, certBoxY, contentWidth, certBoxHeight)
				.fillColor(colors.light)
				.fillOpacity(0.3)
				.fill()
				.strokeColor(certBoxGradient)
				.lineWidth(1)
				.stroke();

			doc.fillOpacity(1); // Reset opacity

			// No certification text needed

			// Signature line - centered in the certification box
			const signatureY = certBoxY + 30; // Centered in the box
			const signatureWidth = 250;
			const signatureX = (pageWidth - signatureWidth) / 2; // Center the signature line

			doc
				.moveTo(signatureX, signatureY)
				.lineTo(signatureX + signatureWidth, signatureY)
				.stroke(colors.dark);

			// Full name of the report creator
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(report.studentName, signatureX, signatureY + 5, {
					width: signatureWidth,
					align: "center",
				});

			// Student's signature text
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
					`Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}` +
						" | This document is computer-generated and does not require a signature.",
					30,
					doc.page.height - 30, // Reduced bottom margin
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
