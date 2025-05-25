import fs from "fs";
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import libre from "libreoffice-convert";
import ExcelJS from "exceljs";

const libreConvert = promisify(libre.convert);

/**
 * Converts an XLSX file to PDF and saves it locally
 * Optimizes the Excel layout for better PDF viewing
 *
 * @param {Object} xlsxFile - The XLSX file object from multer
 * @param {String} xlsxFile.path - The path to the XLSX file
 * @param {String} xlsxFile.filename - The name of the XLSX file
 * @param {String} studentName - The student's name for the filename
 * @returns {Promise<Object>} - Object containing PDF file information
 */
export const convertXlsxToPdf = async (xlsxFile, studentName) => {
	try {
		const xlsxPath = xlsxFile.path;

		// First, optimize the Excel file for PDF conversion
		const optimizedBuffer = await optimizeExcelForPdf(xlsxPath);

		// Convert the optimized Excel to PDF
		const pdfBuffer = await libreConvert(optimizedBuffer, ".pdf", undefined);

		const currentDate = new Date().toISOString().split("T")[0];
		const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9]/g, "");
		const pdfFilename = `ExcelUpload-PDF-${sanitizedStudentName}-${currentDate}-${uuidv4().substring(
			0,
			8
		)}.pdf`;
		const pdfDir = path.join(process.cwd(), "uploads/pdfs");
		if (!fs.existsSync(pdfDir)) {
			fs.mkdirSync(pdfDir, { recursive: true });
		}
		const pdfPath = path.join(pdfDir, pdfFilename);
		await fs.promises.writeFile(pdfPath, pdfBuffer);
		return {
			filename: pdfFilename,
			path: `/pdfs/${pdfFilename}`,
			mimetype: "application/pdf",
			size: pdfBuffer.length,
			generatedFrom: xlsxFile.filename,
		};
	} catch (error) {
		console.error("Error converting XLSX to PDF:", error);
		throw new Error(`Failed to convert XLSX to PDF: ${error.message}`);
	}
};

/**
 * Optimizes Excel file layout for better PDF conversion
 * - Sets page orientation to landscape
 * - Adjusts column widths to fit on one page
 * - Sets print area and scaling
 */
async function optimizeExcelForPdf(xlsxPath) {
	try {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(xlsxPath);

		// Process each worksheet
		workbook.worksheets.forEach((worksheet) => {
			// Set page setup for better PDF layout with wider landscape layout
			worksheet.pageSetup = {
				orientation: "landscape",
				paperSize: 9, // A4
				fitToPage: true,
				fitToWidth: 1,
				fitToHeight: 0, // Allow multiple pages vertically if needed
				margins: {
					left: 0.3, // Reduced from 0.5 for wider layout
					right: 0.3, // Reduced from 0.5 for wider layout
					top: 0.4, // Slightly reduced from 0.5
					bottom: 0.4, // Slightly reduced from 0.5
					header: 0.2, // Reduced from 0.3
					footer: 0.2, // Reduced from 0.3
				},
				printArea: undefined, // Will be set based on actual data
				showGridLines: true,
			};

			// Find the actual data range (non-empty cells)
			let maxRow = 0;
			let maxCol = 0;
			let minRow = Infinity;
			let minCol = Infinity;

			worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
					maxRow = Math.max(maxRow, rowNumber);
					maxCol = Math.max(maxCol, colNumber);
					minRow = Math.min(minRow, rowNumber);
					minCol = Math.min(minCol, colNumber);
				});
			});

			// Set print area to actual data range if data exists
			if (maxRow > 0 && maxCol > 0 && minRow !== Infinity) {
				const startCell = worksheet.getCell(minRow, minCol);
				const endCell = worksheet.getCell(maxRow, maxCol);
				worksheet.pageSetup.printArea = `${startCell.address}:${endCell.address}`;
			}

			// Optimize column widths for landscape PDF with wider layout
			const totalCols = maxCol - minCol + 1;
			if (totalCols > 0) {
				// Calculate optimal column width for landscape page with wider layout
				// Landscape A4 has about 25cm width, with reduced margins = ~24cm usable
				const availableWidth = 24; // Increased from 22 due to smaller margins
				const baseWidth = availableWidth / totalCols;

				// Set minimum and maximum widths for better space utilization
				const minWidth = 10; // Reduced from 12 to allow more columns
				const maxWidth = 30; // Increased from 25 for wider columns when needed
				const optimalWidth = Math.max(minWidth, Math.min(maxWidth, baseWidth));

				for (let col = minCol; col <= maxCol; col++) {
					const column = worksheet.getColumn(col);

					// Analyze content to determine if column needs more space
					let maxContentLength = 0;
					for (let row = minRow; row <= maxRow; row++) {
						const cell = worksheet.getCell(row, col);
						if (cell.value) {
							const cellText = cell.value.toString();
							maxContentLength = Math.max(maxContentLength, cellText.length);
						}
					}

					// Adjust width based on content length for wider layout
					let adjustedWidth = optimalWidth;
					if (maxContentLength > 20) {
						adjustedWidth = Math.min(maxWidth, optimalWidth * 1.4); // More generous for long content
					} else if (maxContentLength > 12) {
						adjustedWidth = Math.min(maxWidth, optimalWidth * 1.2); // Moderate increase
					} else if (maxContentLength < 6) {
						adjustedWidth = Math.max(minWidth, optimalWidth * 0.9); // Slight reduction for short content
					}

					column.width = adjustedWidth;
				}
			}

			// Set more comfortable row heights
			worksheet.eachRow((row) => {
				if (!row.height || row.height > 25) {
					row.height = 20; // Increased from 15 for better readability
				} else if (row.height < 15) {
					row.height = 18; // Minimum comfortable height
				}
			});

			// Improve text formatting for better readability
			worksheet.eachRow((row) => {
				row.eachCell((cell) => {
					// Set better alignment and spacing
					cell.alignment = {
						...cell.alignment,
						vertical: "middle", // Changed from 'top' to 'middle'
						horizontal: cell.alignment?.horizontal || "left",
						wrapText:
							cell.value &&
							typeof cell.value === "string" &&
							cell.value.length > 25,
						indent: 0.5, // Add slight indentation for better readability
					};

					// Ensure proper font size for readability
					if (!cell.font || !cell.font.size || cell.font.size < 10) {
						cell.font = {
							...cell.font,
							size: 11, // Slightly larger font for better readability
							name: "Calibri", // Use a clean, readable font
						};
					}
				});
			});
		});

		// Return the optimized workbook as buffer
		const buffer = await workbook.xlsx.writeBuffer();
		return buffer;
	} catch (error) {
		console.error("Error optimizing Excel for PDF:", error);
		// If optimization fails, return original file
		return await fs.promises.readFile(xlsxPath);
	}
}
