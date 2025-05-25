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
			// Set page setup for maximum width PDF layout with enhanced readability
			worksheet.pageSetup = {
				orientation: "landscape",
				paperSize: 9, // A4
				fitToPage: false, // Disable fit to page to allow custom scaling
				fitToWidth: 0, // Disable fit to width
				fitToHeight: 0, // Disable fit to height
				scale: 100, // Use 100% scale for maximum clarity
				margins: {
					left: 0.1, // Absolute minimum margins
					right: 0.1, // Absolute minimum margins
					top: 0.2,
					bottom: 0.2,
					header: 0.05,
					footer: 0.05,
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

			// Optimize column widths for maximum readability and width
			const totalCols = maxCol - minCol + 1;
			if (totalCols > 0) {
				// Calculate optimal column width for absolute maximum landscape width
				// Landscape A4 with absolute minimal margins = ~26cm usable width
				const availableWidth = 30; // Maximum possible width utilization
				const baseWidth = availableWidth / totalCols;

				// Set very generous column width ranges for maximum readability
				const minWidth = 12; // Increased minimum for better readability
				const maxWidth = 60; // Very wide maximum for activity descriptions
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

					// Adjust width based on content length for maximum readability
					let adjustedWidth = optimalWidth;
					if (maxContentLength > 30) {
						adjustedWidth = Math.min(maxWidth, optimalWidth * 2.0); // Double width for very long activity descriptions
					} else if (maxContentLength > 20) {
						adjustedWidth = Math.min(maxWidth, optimalWidth * 1.8); // Much more generous for long content
					} else if (maxContentLength > 10) {
						adjustedWidth = Math.min(maxWidth, optimalWidth * 1.4); // Generous for medium content
					} else if (maxContentLength > 5) {
						adjustedWidth = Math.min(maxWidth, optimalWidth * 1.2); // Slight increase for short content
					} else {
						adjustedWidth = Math.max(minWidth, optimalWidth); // Keep minimum width even for very short content
					}

					column.width = adjustedWidth;
				}
			}

			// Set more comfortable row heights for better readability
			worksheet.eachRow((row) => {
				// Set generous row heights for better text visibility
				if (!row.height || row.height > 30) {
					row.height = 25; // Increased from 20 for better readability
				} else if (row.height < 20) {
					row.height = 22; // Increased minimum height
				}
			});

			// Improve text formatting for maximum readability
			worksheet.eachRow((row) => {
				row.eachCell((cell) => {
					// Set better alignment and spacing for readability
					cell.alignment = {
						...cell.alignment,
						vertical: "middle",
						horizontal: cell.alignment?.horizontal || "left",
						wrapText: true, // Always enable text wrapping for better readability
						indent: 0.3, // Slight indentation for better readability
					};

					// Ensure larger font size for better readability
					if (!cell.font || !cell.font.size || cell.font.size < 11) {
						cell.font = {
							...cell.font,
							size: 12, // Increased font size for better readability
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
