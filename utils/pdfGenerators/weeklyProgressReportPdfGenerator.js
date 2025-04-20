import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { format } from "date-fns";

/**
 * Generates a PDF for a Weekly Progress Report with a layout matching the Weekly Report
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
			const addSectionSpacing = (doc, sectionType) => {
				// Define custom spacing for each section (in points)
				const spacings = {
					header: 8, // After header image
					title: 12, // After title
					info: 15, // After info box
					section: 15, // After section
					subsection: 10, // After subsection
					certification: 15, // After certification
					default: 12, // Default spacing
				};

				const spacing = spacings[sectionType] || spacings.default;
				doc.y = doc.y + spacing;
				return doc;
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

			// Create a modern info box with card-like styling to match show page
			const infoBoxY = doc.y;
			doc
				.roundedRect(30, infoBoxY, contentWidth, 100, 8) // Increased height and rounded corners
				.fillAndStroke(colors.white, colors.border);

			// Report meta information in a grid layout similar to show page
			doc.fontSize(fonts.normal).fillColor(colors.dark);

			// Student Name
			doc
				.text("Student:", 45, infoBoxY + 12, { continued: true })
				.fillColor(colors.primary)
				.text(` ${report.studentName}`, { align: "left" });

			// Internship Site
			doc
				.fillColor(colors.dark)
				.text("Internship Site:", 45, infoBoxY + 30, { continued: true })
				.fillColor(colors.primary)
				.text(` ${report.internshipSite}`, { align: "left" });

			// Week Number
			doc
				.fillColor(colors.dark)
				.text("Week Number:", 45, infoBoxY + 48, { continued: true })
				.fillColor(colors.primary)
				.text(` ${report.weekNumber}`, { align: "left" });

			// Week Period
			doc
				.fillColor(colors.dark)
				.text("Period:", 45, infoBoxY + 66, { continued: true })
				.fillColor(colors.primary)
				.text(` ${weekStartDate} - ${weekEndDate}`, { align: "left" });

			// Date Submitted
			doc
				.fillColor(colors.dark)
				.text("Date Submitted:", 45, infoBoxY + 84, { continued: true })
				.fillColor(colors.primary);

			// Format date with error handling
			let formattedSubmitDate = "N/A";
			try {
				if (report.dateSubmitted) {
					const submitDate = new Date(report.dateSubmitted);
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

			// Add spacing before section
			addSectionSpacing(doc, "section");

			// Create a card for weekly activities to match show page
			const activitiesTableTop = doc.y;
			const tableWidth = contentWidth;
			const labelColWidth = 150;
			const contentColWidth = tableWidth - labelColWidth;

			// Draw card header with rounded top corners
			doc
				.roundedRect(30, activitiesTableTop, tableWidth, 30, 8)
				.fill(colors.primary);

			// Header text - match show page card header style
			doc.fillColor(colors.white).fontSize(fonts.heading);
			doc.text("Weekly Activities", 45, activitiesTableTop + 8, {
				width: tableWidth - 20,
				align: "left",
			});

			// Current Y position for table rows
			let currentY = activitiesTableTop + 30; // Adjusted for taller header
			const rowHeight = 80; // Increased height for each row

			// Duties Performed row
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
				.text("Duties Performed", 40, currentY + 15);

			// Content column - improved text formatting
			const dutiesText = report.dutiesPerformed || "None reported";
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(dutiesText, 40 + labelColWidth + 10, currentY + 15, {
					width: contentColWidth - 20,
					align: "left",
					lineGap: 2,
				});

			// Update Y position
			currentY += rowHeight;

			// New Trainings row
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
				.text("New Trainings", 40, currentY + 15);

			// Content column - improved text formatting
			const trainingsText = report.newTrainings || "None reported";
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(trainingsText, 40 + labelColWidth + 10, currentY + 15, {
					width: contentColWidth - 20,
					align: "left",
					lineGap: 2,
				});

			// Update Y position
			currentY += rowHeight;

			// Draw bottom border
			doc.rect(30, currentY, tableWidth, 1).fill(colors.border);

			// ===== ACCOMPLISHMENTS SECTION =====
			addSectionSpacing(doc, "section");

			// Add spacing before section
			addSectionSpacing(doc, "section");

			// Check if there are accomplishments
			if (
				report.accomplishments &&
				Array.isArray(report.accomplishments) &&
				report.accomplishments.length > 0
			) {
				// Create a card for accomplishments to match show page
				const accomplishTableTop = doc.y;

				// Draw card header with rounded top corners
				doc
					.roundedRect(30, accomplishTableTop, tableWidth, 30, 8)
					.fill(colors.primary);

				// Header text - match show page card header style
				doc.fillColor(colors.white).fontSize(fonts.heading);
				doc.text("Major Accomplishments", 45, accomplishTableTop + 8, {
					align: "left",
					width: tableWidth - 20,
				});

				// Current Y position for table rows
				let currentY = accomplishTableTop + 30; // Adjusted for taller header
				const rowHeight = 120; // Height for each accomplishment

				// Loop through accomplishments
				report.accomplishments.forEach((accomplishment, index) => {
					// Check if we need to add a new page
					if (currentY + rowHeight > doc.page.height - 100) {
						// Draw bottom border for current page
						doc.rect(30, currentY, tableWidth, 1).fill(colors.border);

						// Add a new page
						doc.addPage();

						// Add header to new page
						try {
							// Add header image with optimized dimensions
							doc.image(headerImagePath, {
								fit: [contentWidth, 40], // Smaller height for continuation pages
								align: "center",
							});
						} catch (imageError) {
							console.error("Error loading header image:", imageError);
						}

						// Add continuation title
						doc
							.fontSize(fonts.heading)
							.fillColor(colors.primary)
							.text("Weekly Progress Report (Continued)", { align: "center" });

						// Add decorative line
						const lineWidth = 450;
						const lineX = (pageWidth - lineWidth) / 2;
						doc
							.moveTo(lineX, doc.y + 5)
							.lineTo(lineX + lineWidth, doc.y + 5)
							.lineWidth(1)
							.stroke(colors.primary);

						addSectionSpacing(doc, "header");

						// Reset Y position and redraw table header
						currentY = doc.y;

						// Draw table header with rounded corners
						doc
							.roundedRect(30, currentY, tableWidth, 30, 8)
							.fill(colors.primary);

						// Header text
						doc.fillColor(colors.white).fontSize(fonts.heading);
						doc.text("Accomplishment (Continued)", 45, currentY + 10, {
							align: "center",
							width: tableWidth - 20,
						});

						// Update Y position
						currentY += 30;
					}

					// Draw row with alternating colors
					doc
						.rect(30, currentY, tableWidth, rowHeight)
						.fill(index % 2 === 0 ? colors.white : colors.light);

					// Accomplishment number
					doc
						.fontSize(fonts.heading)
						.fillColor(colors.primary)
						.text(`Accomplishment ${index + 1}`, 40, currentY + 10, {
							width: tableWidth - 20,
						});

					// Proposed Activity
					doc
						.fontSize(fonts.normal)
						.fillColor(colors.dark)
						.text("Proposed Activity:", 40, currentY + 35, {
							continued: false,
						});

					doc
						.fontSize(fonts.normal)
						.fillColor(colors.secondary)
						.text(
							accomplishment.proposedActivity || "None reported",
							40,
							currentY + 50,
							{
								width: tableWidth - 20,
								align: "left",
								lineGap: 2,
							}
						);

					// Accomplishment Details
					doc
						.fontSize(fonts.normal)
						.fillColor(colors.dark)
						.text("Accomplishments:", 40, currentY + 75, { continued: false });

					doc
						.fontSize(fonts.normal)
						.fillColor(colors.secondary)
						.text(
							accomplishment.accomplishmentDetails || "None reported",
							40,
							currentY + 90,
							{
								width: tableWidth - 20,
								align: "left",
								lineGap: 2,
							}
						);

					// Update Y position
					currentY += rowHeight;
				});

				// Draw bottom border
				doc.rect(30, currentY, tableWidth, 1).fill(colors.border);

				// Update Y position
				doc.y = currentY + 10;
			} else {
				// No accomplishments message
				doc
					.fontSize(fonts.normal)
					.fillColor(colors.secondary)
					.text("No accomplishments recorded.", {
						align: "center",
					});

				doc.moveDown(1);
			}

			// ===== PROBLEMS AND GOALS SECTION =====
			addSectionSpacing(doc, "section");

			// Check if we need to add a new page
			if (doc.y > doc.page.height - 300) {
				// Add a new page
				doc.addPage();

				// Add header to new page
				try {
					// Add header image with optimized dimensions
					doc.image(headerImagePath, {
						fit: [contentWidth, 40], // Smaller height for continuation pages
						align: "center",
					});
				} catch (imageError) {
					console.error("Error loading header image:", imageError);
				}

				// Add continuation title
				doc
					.fontSize(fonts.heading)
					.fillColor(colors.primary)
					.text("Weekly Progress Report (Continued)", { align: "center" });

				// Add decorative line
				const lineWidth = 450;
				const lineX = (pageWidth - lineWidth) / 2;
				doc
					.moveTo(lineX, doc.y + 5)
					.lineTo(lineX + lineWidth, doc.y + 5)
					.lineWidth(1)
					.stroke(colors.primary);

				addSectionSpacing(doc, "header");
			}

			// Add spacing before section
			addSectionSpacing(doc, "section");

			// Create a card for problems and goals to match show page
			const problemsTableTop = doc.y;

			// Draw card header with rounded top corners
			doc
				.roundedRect(30, problemsTableTop, tableWidth, 30, 8)
				.fill(colors.primary);

			// Header text - match show page card header style
			doc.fillColor(colors.white).fontSize(fonts.heading);
			doc.text("Problems and Goals", 45, problemsTableTop + 8, {
				width: tableWidth - 20,
				align: "left",
			});

			// Current Y position for table rows
			currentY = problemsTableTop + 30; // Adjusted for taller header

			// Problems Encountered row
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
				.text("Problems Encountered", 40, currentY + 15);

			// Content column
			const problemsText = report.problemsEncountered || "None reported";
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(problemsText, 40 + labelColWidth + 10, currentY + 15, {
					width: contentColWidth - 20,
					align: "left",
					lineGap: 2,
				});

			// Update Y position
			currentY += rowHeight;

			// Solutions Applied row
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
				.text("Solutions Applied", 40, currentY + 15);

			// Content column
			const solutionsText = report.problemSolutions || "None reported";
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(solutionsText, 40 + labelColWidth + 10, currentY + 15, {
					width: contentColWidth - 20,
					align: "left",
					lineGap: 2,
				});

			// Update Y position
			currentY += rowHeight;

			// Goals for Next Week row
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
				.text("Goals for Next Week", 40, currentY + 15);

			// Content column
			const goalsText = report.goalsForNextWeek || "None reported";
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(goalsText, 40 + labelColWidth + 10, currentY + 15, {
					width: contentColWidth - 20,
					align: "left",
					lineGap: 2,
				});

			// Update Y position
			currentY += rowHeight;

			// Draw bottom border
			doc.rect(30, currentY, tableWidth, 1).fill(colors.border);

			// Update Y position
			doc.y = currentY + 10;

			// Supervisor Information section removed as requested

			// ===== CERTIFICATION SECTION =====
			addSectionSpacing(doc, "section");

			// Check if we need to add a new page
			if (doc.y > doc.page.height - 200) {
				// Add a new page
				doc.addPage();

				// Add header to new page
				try {
					// Add header image with optimized dimensions
					doc.image(headerImagePath, {
						fit: [contentWidth, 40], // Smaller height for continuation pages
						align: "center",
					});
				} catch (imageError) {
					console.error("Error loading header image:", imageError);
				}

				// Add continuation title
				doc
					.fontSize(fonts.heading)
					.fillColor(colors.primary)
					.text("Weekly Progress Report (Continued)", { align: "center" });

				// Add decorative line
				const lineWidth = 450;
				const lineX = (pageWidth - lineWidth) / 2;
				doc
					.moveTo(lineX, doc.y + 5)
					.lineTo(lineX + lineWidth, doc.y + 5)
					.lineWidth(1)
					.stroke(colors.primary);

				addSectionSpacing(doc, "header");
			}

			// Certification box
			const certBoxY = doc.y;
			doc
				.roundedRect(30, certBoxY, contentWidth, 110, 8) // Rounded corners
				.fillAndStroke(colors.light, colors.border);

			// Certification text
			doc
				.fontSize(fonts.normal)
				.fillColor(colors.dark)
				.text(
					'"I certify on my honor that the above is a true and correct report of the progress made during the week."',
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
