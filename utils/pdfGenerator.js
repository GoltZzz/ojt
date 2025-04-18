import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { format } from "date-fns";

export const generateWeeklyReportPdf = (report) => {
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
					Title: "Daily Attendance and Accomplishment Form",
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

			// Format dates
			let weekStartDate = "N/A";
			let weekEndDate = "N/A";

			try {
				if (report.weekStartDate) {
					const startDate = new Date(report.weekStartDate);
					if (!isNaN(startDate.getTime())) {
						weekStartDate = format(startDate, "MMM dd, yyyy");
					}
				}

				if (report.weekEndDate) {
					const endDate = new Date(report.weekEndDate);
					if (!isNaN(endDate.getTime())) {
						weekEndDate = format(endDate, "MMM dd, yyyy");
					}
				}
			} catch (dateError) {
				console.error("Error formatting dates:", dateError);
			}

			// Calculate page dimensions
			const pageWidth = doc.page.width;
			const contentWidth = pageWidth - 60; // Accounting for margins

			// ===== HEADER SECTION =====
			try {
				// Add header image with optimized dimensions
				doc.image(headerImagePath, {
					fit: [contentWidth, 70],
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
			doc.moveDown(0.5);
			doc
				.fontSize(fonts.title)
				.fillColor(colors.primary)
				.text("DAILY ATTENDANCE AND ACCOMPLISHMENT FORM", { align: "center" });

			// Add decorative line
			const lineWidth = 450;
			const lineX = (pageWidth - lineWidth) / 2;
			doc
				.moveTo(lineX, doc.y + 5)
				.lineTo(lineX + lineWidth, doc.y + 5)
				.lineWidth(1)
				.stroke(colors.primary);

			// ===== STUDENT INFO SECTION =====
			doc.moveDown(0.5);

			// Create a modern info box
			const infoBoxY = doc.y;
			doc
				.roundedRect(30, infoBoxY, contentWidth, 80, 5)
				.fillAndStroke(colors.light, colors.border);

			// Left column
			doc.fontSize(fonts.normal).fillColor(colors.dark);

			// Student Name
			doc
				.text("Student Name:", 45, infoBoxY + 15, { continued: true })
				.fillColor(colors.primary)
				.text(` ${report.studentName}`, { align: "left" });

			// Internship Site
			doc
				.fillColor(colors.dark)
				.text("Internship Site:", 45, infoBoxY + 30, { continued: true })
				.fillColor(colors.primary)
				.text(` ${report.internshipSite}`, { align: "left" });

			// Week Period
			doc
				.fillColor(colors.dark)
				.text("Week Period:", 45, infoBoxY + 45, { continued: true })
				.fillColor(colors.primary)
				.text(` ${weekStartDate} - ${weekEndDate}`, { align: "left" });

			// Supervisor Name
			doc
				.fillColor(colors.dark)
				.text("Supervisor Name:", 45, infoBoxY + 60, { continued: true })
				.fillColor(colors.primary)
				.text(` ${report.supervisorName}`, { align: "left" });

			// Right column - Status
			const statusX = pageWidth / 2 + 30;

			// Status with colored badge
			doc
				.fillColor(colors.dark)
				.text("Status:", statusX, infoBoxY + 15, { continued: true });

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
			const badgeHeight = 20;
			const badgeX = statusX + 50;
			const badgeY = infoBoxY + 12;

			doc
				.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10)
				.fill(statusColor);

			doc
				.fontSize(fonts.small)
				.fillColor(colors.white)
				.text(statusText, badgeX, badgeY + 5, {
					width: badgeWidth,
					align: "center",
				});

			// Archive reason if applicable
			if (report.archived && report.archivedReason) {
				doc
					.fontSize(fonts.normal)
					.fillColor(colors.dark)
					.text("Archive Reason:", statusX, infoBoxY + 45, { continued: true })
					.fillColor(colors.primary)
					.text(` ${report.archivedReason}`, { align: "left" });
			}

			// ===== DAILY RECORDS SECTION =====
			doc.moveDown(1);

			// Section title
			doc
				.fontSize(fonts.subtitle)
				.fillColor(colors.primary)
				.text("DAILY RECORDS", { align: "center" });

			doc.moveDown(0.5);

			// Create table header
			const tableTop = doc.y;
			const tableWidth = contentWidth;
			const dayColWidth = 80;
			const timeColWidth = 180;
			const accomplishColWidth = tableWidth - dayColWidth - timeColWidth;

			// Draw table header
			doc.rect(30, tableTop, tableWidth, 25).fill(colors.primary);

			// Header text
			doc.fillColor(colors.white).fontSize(fonts.heading);

			doc.text("DAY", 40, tableTop + 7);
			doc.text("TIME RECORDS", 40 + dayColWidth + 20, tableTop + 7);
			doc.text(
				"ACCOMPLISHMENTS",
				40 + dayColWidth + timeColWidth + 20,
				tableTop + 7
			);

			// Days of the week
			const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
			let currentY = tableTop + 25;
			const rowHeight = 60;

			// Ensure dailyRecords exists
			if (!report.dailyRecords || !Array.isArray(report.dailyRecords)) {
				console.warn(
					`Report ${report._id} has no daily records, creating empty array`
				);
				report.dailyRecords = [];
			}

			// Draw each day row
			days.forEach((day, index) => {
				const hasRecord = report.dailyRecords && report.dailyRecords[index];
				const rowY = currentY;

				// Draw row background with alternating colors
				doc
					.rect(30, rowY, tableWidth, rowHeight)
					.fill(index % 2 === 0 ? colors.white : colors.light);

				// Draw vertical dividers
				doc
					.moveTo(30 + dayColWidth, rowY)
					.lineTo(30 + dayColWidth, rowY + rowHeight)
					.stroke(colors.border);

				doc
					.moveTo(30 + dayColWidth + timeColWidth, rowY)
					.lineTo(30 + dayColWidth + timeColWidth, rowY + rowHeight)
					.stroke(colors.border);

				// Day column
				doc
					.fontSize(fonts.normal)
					.fillColor(colors.primary)
					.text(day, 40, rowY + 10);

				if (hasRecord) {
					const dailyRecord = report.dailyRecords[index];

					// Safely extract time values
					const timeData = {
						in: {
							morning: "N/A",
							afternoon: "N/A",
						},
						out: {
							morning: "N/A",
							afternoon: "N/A",
						},
					};

					if (dailyRecord.timeIn && typeof dailyRecord.timeIn === "object") {
						if (dailyRecord.timeIn.morning) {
							timeData.in.morning = dailyRecord.timeIn.morning;
						}
						if (dailyRecord.timeIn.afternoon) {
							timeData.in.afternoon = dailyRecord.timeIn.afternoon;
						}
					}

					if (dailyRecord.timeOut && typeof dailyRecord.timeOut === "object") {
						if (dailyRecord.timeOut.morning) {
							timeData.out.morning = dailyRecord.timeOut.morning;
						}
						if (dailyRecord.timeOut.afternoon) {
							timeData.out.afternoon = dailyRecord.timeOut.afternoon;
						}
					}

					// Time records column
					const timeX = 40 + dayColWidth + 10;

					doc.fontSize(fonts.small).fillColor(colors.dark);

					// Morning time
					doc
						.text("Morning:", timeX, rowY + 10, { continued: true })
						.fillColor(colors.secondary)
						.text(` In: ${timeData.in.morning} | Out: ${timeData.out.morning}`);

					// Afternoon time
					doc
						.fillColor(colors.dark)
						.text("Afternoon:", timeX, rowY + 25, { continued: true })
						.fillColor(colors.secondary)
						.text(
							` In: ${timeData.in.afternoon} | Out: ${timeData.out.afternoon}`
						);

					// Accomplishments column
					const accomplishX = 40 + dayColWidth + timeColWidth + 10;
					const accomplishmentsText =
						dailyRecord.accomplishments || "No accomplishments recorded";

					doc
						.fontSize(fonts.small)
						.fillColor(colors.dark)
						.text(accomplishmentsText, accomplishX, rowY + 10, {
							width: accomplishColWidth - 20,
							height: rowHeight - 15,
							ellipsis: true,
						});
				} else {
					// No records
					doc.fontSize(fonts.small).fillColor(colors.secondary);

					// Time records column
					doc.text("No time records", 40 + dayColWidth + 10, rowY + 25);

					// Accomplishments column
					doc.text(
						"No accomplishments recorded",
						40 + dayColWidth + timeColWidth + 10,
						rowY + 25
					);
				}

				currentY += rowHeight;
			});

			// Draw bottom border
			doc.rect(30, currentY, tableWidth, 1).fill(colors.border);

			// ===== CERTIFICATION SECTION =====
			doc.moveDown(1);

			// Certification box
			const certBoxY = doc.y;
			doc
				.roundedRect(30, certBoxY, contentWidth, 120, 5)
				.fillAndStroke(colors.light, colors.border);

			// Certification text
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(
					'"I CERTIFY on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival at and departure from office."',
					40,
					certBoxY + 15,
					{
						width: contentWidth - 20,
						align: "center",
						italic: true,
					}
				);

			// Signature lines
			const signatureY = certBoxY + 50;
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

			// ===== ADMIN COMMENTS SECTION (if applicable) =====
			if (report.adminComments) {
				// Check if we have enough space on the current page
				const remainingSpace = doc.page.height - doc.y;
				const estimatedCommentsHeight = 150;

				if (remainingSpace < estimatedCommentsHeight) {
					doc.addPage();

					// Add header to new page
					try {
						doc.image(headerImagePath, {
							fit: [contentWidth, 70],
							align: "center",
						});
					} catch (imageError) {
						console.error(
							"Error loading header image on second page:",
							imageError
						);
						doc
							.fontSize(fonts.normal)
							.fillColor(colors.secondary)
							.text("[Header image could not be loaded]", { align: "center" });
					}

					doc.moveDown(0.5);
				} else {
					doc.moveDown(1);
				}

				// Admin comments title
				doc
					.fontSize(fonts.subtitle)
					.fillColor(colors.primary)
					.text("ADMIN COMMENTS", { align: "center" });

				// Add decorative line
				const commentLineX = (pageWidth - 200) / 2;
				doc
					.moveTo(commentLineX, doc.y + 5)
					.lineTo(commentLineX + 200, doc.y + 5)
					.stroke(colors.primary);

				doc.moveDown(0.5);

				// Comments box
				const commentsBoxY = doc.y;
				const commentsBoxHeight = 100;

				doc
					.roundedRect(30, commentsBoxY, contentWidth, commentsBoxHeight, 5)
					.fillAndStroke(colors.light, colors.border);

				// Comments text
				doc
					.fontSize(fonts.normal)
					.fillColor(colors.dark)
					.text(report.adminComments, 40, commentsBoxY + 10, {
						width: contentWidth - 20,
						align: "left",
					});
			}

			// Finalize the PDF
			doc.end();
		} catch (error) {
			console.error("PDF generation error:", error);
			// Log report data for debugging (excluding large fields)
			const debugReport = { ...report };
			if (debugReport.dailyRecords) {
				debugReport.dailyRecords = `Array with ${debugReport.dailyRecords.length} items`;
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
