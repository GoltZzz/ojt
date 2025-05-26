import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import TimeReport from "../models/timeReport.js";

/**
 * Service for handling Excel file operations
 */
class ExcelService {
	/**
	 * Extracts data from Excel file for analysis and preview
	 * @param {string} filePath - Path to the Excel file
	 * @returns {Promise<Object>} - Extracted data
	 */
	async parseExcelFile(filePath) {
		try {
			const workbook = new ExcelJS.Workbook();
			await workbook.xlsx.readFile(filePath);

			const result = {
				sheets: [],
				summary: {
					totalSheets: workbook.worksheets.length,
					totalRows: 0,
					totalCells: 0,
					weekData: {
						hoursWorked: 0,
						startDate: null,
						endDate: null,
					},
				},
			};

			// Process each worksheet
			workbook.worksheets.forEach((worksheet) => {
				const sheetData = {
					name: worksheet.name,
					rowCount: worksheet.rowCount,
					columnCount: worksheet.columnCount,
					rows: [],
					headers: [],
				};

				// Extract headers (assuming first row contains headers)
				const headerRow = worksheet.getRow(1);
				headerRow.eachCell((cell, colNumber) => {
					sheetData.headers.push({
						value: cell.value ? cell.value.toString() : "",
						column: colNumber,
					});
				});

				// Extract data (up to 20 rows for preview)
				const maxRows = Math.min(worksheet.rowCount, 20);
				for (let rowNumber = 1; rowNumber <= maxRows; rowNumber++) {
					const row = worksheet.getRow(rowNumber);
					const rowData = [];

					row.eachCell((cell, colNumber) => {
						rowData.push({
							value: cell.value ? cell.value.toString() : "",
							column: colNumber,
						});
					});

					sheetData.rows.push(rowData);
				}

				// Update summary counts
				result.summary.totalRows += worksheet.rowCount;
				result.summary.totalCells += worksheet.rowCount * worksheet.columnCount;

				// Try to extract date info and hours (searching common patterns)
				this._extractTimeReportData(worksheet, result.summary.weekData);

				result.sheets.push(sheetData);
			});

			return result;
		} catch (error) {
			console.error("Error parsing Excel file:", error);
			throw new Error(`Failed to parse Excel file: ${error.message}`);
		}
	}

	/**
	 * Generate a preview image of the first sheet of an Excel file
	 * @param {string} filePath - Path to the Excel file
	 * @returns {Promise<string|null>} - Path to the generated preview image or null if failed
	 */
	async generatePreviewImage(filePath) {
		try {
			// Dynamically import canvas to handle version compatibility
			const canvasModule = await import("canvas").catch((e) => {
				console.error("Error importing canvas:", e);
				return null;
			});

			if (!canvasModule) {
				console.warn(
					"Canvas module not available, skipping preview generation"
				);
				return null;
			}

			// Get the appropriate canvas constructor based on version
			const canvasConstructor =
				canvasModule.Canvas || canvasModule.createCanvas;

			if (!canvasConstructor) {
				console.warn(
					"Canvas constructor not available, skipping preview generation"
				);
				return null;
			}

			const workbook = new ExcelJS.Workbook();
			await workbook.xlsx.readFile(filePath);

			// Get the first worksheet
			const worksheet = workbook.worksheets[0];
			if (!worksheet) {
				console.warn("No worksheets found in the Excel file");
				return null;
			}

			// Determine preview dimensions
			const rowCount = Math.min(worksheet.rowCount, 15);
			const colCount = Math.min(worksheet.columnCount, 10);

			// Create canvas for the preview
			const cellWidth = 80;
			const cellHeight = 25;
			const headerHeight = 30;
			const canvasWidth = colCount * cellWidth + 50;
			const canvasHeight = rowCount * cellHeight + headerHeight + 50;

			const canvas = new canvasConstructor(canvasWidth, canvasHeight);
			const ctx = canvas.getContext("2d");

			// Draw background
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvasWidth, canvasHeight);

			// Draw grid lines
			ctx.strokeStyle = "#e0e0e0";
			ctx.lineWidth = 1;

			// Draw column lines
			for (let i = 0; i <= colCount; i++) {
				const x = 50 + i * cellWidth;
				ctx.beginPath();
				ctx.moveTo(x, 50);
				ctx.lineTo(x, 50 + headerHeight + rowCount * cellHeight);
				ctx.stroke();
			}

			// Draw row lines
			for (let i = 0; i <= rowCount; i++) {
				const y = 50 + headerHeight + i * cellHeight;
				ctx.beginPath();
				ctx.moveTo(50, y);
				ctx.lineTo(50 + colCount * cellWidth, y);
				ctx.stroke();
			}

			// Draw header
			ctx.fillStyle = "#f3f3f3";
			ctx.fillRect(50, 50, colCount * cellWidth, headerHeight);

			// Draw header text
			ctx.fillStyle = "#000000";
			ctx.font = "bold 12px Arial";

			const headerRow = worksheet.getRow(1);
			headerRow.eachCell((cell, colNumber) => {
				if (colNumber <= colCount) {
					const value = cell.value ? cell.value.toString() : "";
					const x = 50 + (colNumber - 1) * cellWidth + 5;
					ctx.fillText(value.substring(0, 10), x, 50 + 20);
				}
			});

			// Draw data cells
			ctx.font = "12px Arial";
			for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
				const row = worksheet.getRow(rowNumber);
				row.eachCell((cell, colNumber) => {
					if (colNumber <= colCount) {
						const value = cell.value ? cell.value.toString() : "";
						const x = 50 + (colNumber - 1) * cellWidth + 5;
						const y = 50 + headerHeight + (rowNumber - 1) * cellHeight + 18;
						ctx.fillText(value.substring(0, 10), x, y);
					}
				});
			}

			// Save the preview image
			const fileName = path.basename(filePath, path.extname(filePath));
			const previewPath = path.join(
				process.cwd(),
				"public/uploads/excel/previews",
				`${fileName}-preview.png`
			);

			// Ensure directory exists
			await fs.mkdir(path.dirname(previewPath), { recursive: true });

			// Write the image file
			const buffer = canvas.toBuffer("image/png");
			await fs.writeFile(previewPath, buffer);

			return previewPath;
		} catch (error) {
			console.error("Error generating preview image:", error);
			// If canvas fails, return a default preview path or null
			return null;
		}
	}

	/**
	 * Calculate hash of file for integrity and caching purposes
	 * @param {string} filePath - Path to the file
	 * @returns {Promise<string>} - File hash
	 */
	async calculateFileHash(filePath) {
		try {
			const fileBuffer = await fs.readFile(filePath);
			const hashSum = crypto.createHash("sha256");
			hashSum.update(fileBuffer);
			return hashSum.digest("hex");
		} catch (error) {
			console.error("Error calculating file hash:", error);
			throw new Error(`Failed to calculate file hash: ${error.message}`);
		}
	}

	/**
	 * Create a new version of a time report
	 * @param {string} timeReportId - ID of the time report
	 * @param {string} filePath - Path to the new Excel file
	 * @param {Object} user - User object
	 * @returns {Promise<Object>} - Updated time report
	 */
	async createNewVersion(timeReportId, filePath, user) {
		try {
			// Get the original time report
			const timeReport = await TimeReport.findById(timeReportId);
			if (!timeReport) {
				throw new Error("Time report not found");
			}

			// Check if user is authorized
			if (timeReport.author.toString() !== user._id.toString()) {
				throw new Error("Not authorized to create a new version");
			}

			// Extract file details
			const fileName = path.basename(filePath);
			const originalName = path.basename(filePath, path.extname(filePath));

			// Calculate file hash
			const fileHash = await this.calculateFileHash(filePath);

			// Create new version entry
			if (!timeReport.versions) {
				timeReport.versions = [];

				// Push the current version as the first version if not already tracked
				if (!timeReport.versions.some((v) => v.versionNumber === 1)) {
					timeReport.versions.push({
						versionNumber: 1,
						excelFile: timeReport.excelFile,
						uploadDate: timeReport.excelFile.uploadDate,
						updatedBy: timeReport.author,
					});
				}
			}

			// Determine new version number
			const newVersionNumber = timeReport.versions.length + 1;

			// Move the current file to archive if needed
			if (timeReport.excelFile && timeReport.excelFile.filename) {
				const currentFilePath = path.join(
					process.cwd(),
					"public/uploads/excel",
					timeReport.excelFile.filename
				);
				const archiveDir = path.join(
					process.cwd(),
					"public/uploads/excel/archive"
				);

				// Ensure archive directory exists
				await fs.mkdir(archiveDir, { recursive: true });

				// Archive the file with version number
				const archivedFileName = `v${newVersionNumber - 1}_${
					timeReport.excelFile.filename
				}`;
				const archivePath = path.join(archiveDir, archivedFileName);

				// Copy the file to archive
				try {
					await fs.copyFile(currentFilePath, archivePath);
				} catch (err) {
					console.warn(`Could not archive file ${currentFilePath}:`, err);
					// Continue even if archiving fails
				}
			}

			// Update the time report with new version info
			timeReport.versions.push({
				versionNumber: newVersionNumber,
				excelFile: {
					filename: fileName,
					originalName: originalName,
					path: filePath,
					uploadDate: new Date(),
					fileHash: fileHash,
				},
				uploadDate: new Date(),
				updatedBy: user._id,
			});

			// Update the main excelFile field
			timeReport.excelFile = {
				filename: fileName,
				originalName: originalName,
				path: filePath,
				uploadDate: new Date(),
				fileHash: fileHash,
			};

			// Save the updated time report
			await timeReport.save();

			return timeReport;
		} catch (error) {
			console.error("Error creating new version:", error);
			throw new Error(`Failed to create new version: ${error.message}`);
		}
	}

	/**
	 * Extract time report specific data from Excel file
	 * @param {Object} worksheet - ExcelJS worksheet
	 * @param {Object} weekData - Object to populate with week data
	 * @private
	 */
	_extractTimeReportData(worksheet, weekData) {
		try {
			// Attempt to find cells with date or hours information
			// This is a simple approach and should be adapted to the actual format of your Excel files

			// Search for date patterns in cell values
			const dateRegex = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/g;
			const hoursRegex = /(\d+(\.\d+)?)\s*(hours|hrs)/i;

			let dates = [];
			let totalHours = 0;

			worksheet.eachRow((row, rowNumber) => {
				row.eachCell((cell, colNumber) => {
					const cellValue = cell.value ? cell.value.toString() : "";

					// Check for dates
					const dateMatches = cellValue.match(dateRegex);
					if (dateMatches) {
						dateMatches.forEach((match) => {
							const parsedDate = new Date(match);
							if (!isNaN(parsedDate.getTime())) {
								dates.push(parsedDate);
							}
						});
					}

					// Check for hours
					const hoursMatch = cellValue.match(hoursRegex);
					if (hoursMatch) {
						const hours = parseFloat(hoursMatch[1]);
						if (!isNaN(hours)) {
							totalHours += hours;
						}
					}
				});
			});

			// Sort dates and set start/end
			if (dates.length > 0) {
				dates.sort((a, b) => a - b);
				weekData.startDate = dates[0];
				weekData.endDate = dates[dates.length - 1];
			}

			// Set hours worked
			weekData.hoursWorked = totalHours;
		} catch (error) {
			console.warn("Error extracting time report data:", error);
			// Don't throw - this is a best-effort enhancement
		}
	}
}

export default new ExcelService();
