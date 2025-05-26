import XLSX from "xlsx";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createCanvas } from "canvas";

/**
 * Service for rendering Excel files to HTML and generating previews
 */
class ExcelRendererService {
	/**
	 * Render an Excel file to HTML for server-side rendering
	 * @param {string} filePath - Path to the Excel file
	 * @param {Object} options - Rendering options
	 * @returns {Promise<Object>} - HTML content and metadata
	 */
	async renderToHtml(filePath, options = {}) {
		try {
			// Default options
			const defaultOptions = {
				maxSheets: 3, // Maximum number of sheets to render
				maxRows: 100, // Maximum rows per sheet
				maxCols: 20, // Maximum columns per sheet
				includeStyles: true, // Include cell styles
				includeFormulas: true, // Show formulas in tooltips
				showFormulas: false, // Toggle to show formulas instead of values
				highlightFormulas: true, // Highlight formula cells
				formulaTooltips: true, // Show formulas in tooltips
			};

			const renderOptions = { ...defaultOptions, ...options };

			// Read the Excel file
			const fileBuffer = await fs.readFile(filePath);

			// Parse the Excel file with formula support
			const workbook = XLSX.read(fileBuffer, {
				type: "buffer",
				cellStyles: renderOptions.includeStyles,
				cellNF: true,
				cellFormula: true, // Enable formula parsing
				cellDates: true,
				dateNF: "yyyy-mm-dd",
			});

			// Prepare the HTML output
			const htmlOutput = {
				title: path.basename(filePath),
				sheets: [],
				metadata: {
					sheetCount: workbook.SheetNames.length,
					totalSheets: workbook.SheetNames.length,
					renderedSheets: 0,
					fileSize: fileBuffer.length,
					renderDate: new Date(),
					hasFormulas: false, // Track if any formulas were found
				},
			};

			// Process each sheet (up to maxSheets)
			const sheetsToProcess = workbook.SheetNames.slice(
				0,
				renderOptions.maxSheets
			);
			htmlOutput.metadata.renderedSheets = sheetsToProcess.length;

			for (const sheetName of sheetsToProcess) {
				const worksheet = workbook.Sheets[sheetName];

				// Get sheet dimensions
				const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

				// Apply limits
				const limitedRange = {
					s: { r: range.s.r, c: range.s.c },
					e: {
						r: Math.min(range.e.r, renderOptions.maxRows - 1),
						c: Math.min(range.e.c, renderOptions.maxCols - 1),
					},
				};

				// Check for formulas in this sheet
				let sheetHasFormulas = false;
				for (let r = limitedRange.s.r; r <= limitedRange.e.r; r++) {
					for (let c = limitedRange.s.c; c <= limitedRange.e.c; c++) {
						const cellRef = XLSX.utils.encode_cell({ r, c });
						const cell = worksheet[cellRef];
						if (cell && cell.f) {
							sheetHasFormulas = true;
							htmlOutput.metadata.hasFormulas = true;
							break;
						}
					}
					if (sheetHasFormulas) break;
				}

				// Generate HTML for this sheet
				const sheetHtml = this._generateSheetHtml(
					worksheet,
					limitedRange,
					sheetName,
					renderOptions
				);

				// Add to output
				htmlOutput.sheets.push({
					name: sheetName,
					html: sheetHtml,
					rowCount: limitedRange.e.r - limitedRange.s.r + 1,
					colCount: limitedRange.e.c - limitedRange.s.c + 1,
					isTruncated:
						limitedRange.e.r < range.e.r || limitedRange.e.c < range.e.c,
					hasFormulas: sheetHasFormulas,
				});
			}

			return htmlOutput;
		} catch (error) {
			console.error("Error rendering Excel to HTML:", error);
			throw new Error(`Failed to render Excel file: ${error.message}`);
		}
	}

	/**
	 * Generate a static preview image of the Excel file
	 * @param {string} filePath - Path to the Excel file
	 * @param {Object} options - Preview options
	 * @returns {Promise<string>} - Path to the generated preview image
	 */
	async generatePreviewImage(filePath, options = {}) {
		try {
			// If canvas is not available, return null
			if (!createCanvas) {
				console.warn(
					"Canvas library not available. Preview generation is disabled."
				);
				return null;
			}

			// Default options
			const defaultOptions = {
				width: 800,
				height: 600,
				outputDir: path.join(process.cwd(), "public/uploads/excel/previews"),
				maxRows: 20,
				maxCols: 8,
			};

			const previewOptions = { ...defaultOptions, ...options };

			// Ensure output directory exists
			await fs.mkdir(previewOptions.outputDir, { recursive: true });

			// Read the Excel file
			const fileBuffer = await fs.readFile(filePath);

			// Generate a unique filename based on file content
			const hashSum = crypto.createHash("sha256");
			hashSum.update(fileBuffer);
			const fileHash = hashSum.digest("hex").substring(0, 12);

			const previewFilename = `preview-${path.basename(
				filePath,
				path.extname(filePath)
			)}-${fileHash}.png`;
			const previewPath = path.join(previewOptions.outputDir, previewFilename);

			// Check if preview already exists
			try {
				await fs.access(previewPath);
				// If no error, file exists, return the path
				return previewPath;
			} catch (e) {
				// File doesn't exist, continue generating
			}

			// Parse the Excel file
			const workbook = XLSX.read(fileBuffer, {
				type: "buffer",
				cellStyles: true,
				cellDates: true,
			});

			// Get the first sheet
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];

			// Create canvas - check again to make sure it's available
			if (!createCanvas) {
				throw new Error("Canvas library not available for preview generation");
			}

			const canvas = createCanvas(previewOptions.width, previewOptions.height);
			const ctx = canvas.getContext("2d");

			// Set background
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw grid and content
			await this._drawExcelPreview(ctx, worksheet, previewOptions);

			// Save the canvas to a file
			const buffer = canvas.toBuffer("image/png");
			await fs.writeFile(previewPath, buffer);

			return previewPath;
		} catch (error) {
			console.error("Error generating Excel preview:", error);
			return null;
		}
	}

	/**
	 * Generate HTML for a worksheet
	 * @private
	 */
	_generateSheetHtml(worksheet, range, sheetName, options) {
		// Create HTML table with formula controls
		let html = `
      <div class="excel-sheet" data-sheet-name="${sheetName}">
        <!-- Formula Controls -->
        <div class="formula-controls" style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">
          <div class="form-check form-check-inline">
            <input class="form-check-input formula-toggle" type="checkbox" id="showFormulas_${sheetName}" 
                   ${options.showFormulas ? "checked" : ""} 
                   onchange="toggleFormulas('${sheetName}', this.checked)">
            <label class="form-check-label" for="showFormulas_${sheetName}">
              <i class="fas fa-function"></i> Show Formulas
            </label>
          </div>
          <div class="form-check form-check-inline">
            <input class="form-check-input highlight-toggle" type="checkbox" id="highlightFormulas_${sheetName}" 
                   ${options.highlightFormulas ? "checked" : ""} 
                   onchange="toggleFormulaHighlight('${sheetName}', this.checked)">
            <label class="form-check-label" for="highlightFormulas_${sheetName}">
              <i class="fas fa-highlighter"></i> Highlight Formula Cells
            </label>
          </div>
          <small class="text-muted ms-3">
            <i class="fas fa-info-circle"></i> Hover over cells to see formulas in tooltips
          </small>
        </div>
        
        <table class="excel-table">
          <thead>
            <tr>
              <th class="corner-header"></th>`;

		// Add column headers (A, B, C, etc.)
		for (let c = range.s.c; c <= range.e.c; c++) {
			const colName = XLSX.utils.encode_col(c);
			html += `<th class="col-header">${colName}</th>`;
		}

		html += `</tr>
          </thead>
          <tbody>`;

		// Add rows
		for (let r = range.s.r; r <= range.e.r; r++) {
			html += `<tr>
        <td class="row-header">${r + 1}</td>`;

			// Add cells
			for (let c = range.s.c; c <= range.e.c; c++) {
				const cellRef = XLSX.utils.encode_cell({ r, c });
				const cell = worksheet[cellRef];

				// Determine cell style and value with enhanced formula support
				const { cellStyle, cellValue, formulaValue, title, dataAttributes } =
					this._formatCell(cell, options);

				html += `<td class="${cellStyle}" title="${title}" ${dataAttributes}>
                   <span class="cell-value">${cellValue}</span>
                   <span class="cell-formula" style="display: none;">${formulaValue}</span>
                 </td>`;
			}

			html += `</tr>`;
		}

		html += `</tbody>
        </table>
      </div>`;

		return html;
	}

	/**
	 * Format a cell for HTML display
	 * @private
	 */
	_formatCell(cell, options) {
		let cellStyle = "";
		let cellValue = "";
		let formulaValue = "";
		let title = "";
		let dataAttributes = "";

		if (!cell) {
			return { cellStyle, cellValue, formulaValue, title, dataAttributes };
		}

		// Always check for formulas first
		const hasFormula = cell.f && cell.f.length > 0;

		if (hasFormula) {
			formulaValue = cell.f;
			dataAttributes = `data-formula="${this._escapeHtml(
				formulaValue
			)}" data-has-formula="true"`;

			// Base formula styling
			cellStyle = "formula-cell";
			if (options.highlightFormulas) {
				cellStyle += " formula-highlighted";
			}

			// Set the display value (evaluated result or formula based on toggle)
			if (options.showFormulas) {
				cellValue = `=${formulaValue}`;
			} else {
				// Handle formula results specially
				if (cell.v !== undefined) {
					// Check if this is a TIME formula or SUM of time values
					const isTimeFormula =
						formulaValue.includes("TIME(") ||
						(formulaValue.includes("SUM(") && cell.z && cell.z.includes("h"));

					// Check if this has time formatting
					const hasTimeFormat =
						cell.z &&
						(cell.z.includes("h") ||
							cell.z.includes("H") ||
							cell.z.includes(":") ||
							cell.z.includes("[h]") ||
							cell.z.includes("[H]"));

					if (isTimeFormula || hasTimeFormat) {
						// This is a time-related formula
						if (cell.t === "d" && cell.v instanceof Date) {
							// Extract time from date object
							const hours = cell.v.getHours();
							const minutes = cell.v.getMinutes();
							const seconds = cell.v.getSeconds();
							cellValue = `${hours.toString().padStart(2, "0")}:${minutes
								.toString()
								.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
						} else if (typeof cell.v === "number") {
							// Handle numeric time values
							if (cell.v < 1 && cell.v > 0) {
								cellValue = (cell.v * 24).toFixed(2); // Convert fraction of day to hours
							} else {
								cellValue = this._formatNumericValue(cell.v);
							}
						} else {
							cellValue = cell.w || String(cell.v);
						}
					} else if (typeof cell.v === "number") {
						// Regular numeric formula
						cellValue = this._formatNumericValue(cell.v);
					} else {
						// Other types
						cellValue = String(cell.v);
					}
				} else {
					cellValue = "";
				}
			}

			// Enhanced tooltip for formula cells
			title = `Formula: =${formulaValue}`;
			if (cell.v !== undefined) {
				if (cell.t === "d" && cell.v instanceof Date) {
					title += `\nTime Value: ${cellValue}`;
				} else if (typeof cell.v === "number") {
					title += `\nCalculated Value: ${this._formatNumericValue(cell.v)}`;
				} else {
					title += `\nCalculated Value: ${cell.v}`;
				}
			}
			if (cell.z) {
				title += `\nOriginal Format: ${cell.z}`;
			}
		}
		// Handle non-formula cells
		else {
			// Check if cell is a date (but not if it's a formula result)
			if (
				cell.t === "d" ||
				(cell.v &&
					Object.prototype.toString.call(cell.v) === "[object Date]" &&
					!this._isNumericString(String(cell.v)))
			) {
				cellValue = cell.w || new Date(cell.v).toLocaleDateString();
				cellStyle = "date-cell";
				title = `Date: ${cellValue}`;
			}
			// Check if cell is a number but has date formatting (and it's not a formula)
			else if (
				cell.t === "n" &&
				cell.z &&
				(cell.z.includes("d") ||
					cell.z.includes("m") ||
					cell.z.includes("y")) &&
				!hasFormula
			) {
				// This is a number with date formatting, but not a formula - treat as number
				cellValue = this._formatNumericValue(cell.v);
				cellStyle = "number-cell";
				title = `Number: ${cellValue} (has date format: ${cell.z})`;
			}
			// Check if cell is a regular number
			else if (cell.t === "n") {
				cellValue = this._formatNumericValue(cell.v);
				cellStyle = "number-cell";
				title = `Number: ${cellValue}`;
			}
			// Handle boolean values
			else if (cell.t === "b") {
				cellValue = cell.v ? "TRUE" : "FALSE";
				cellStyle = "boolean-cell";
				title = `Boolean: ${cellValue}`;
			}
			// Handle error values
			else if (cell.t === "e") {
				cellValue = cell.w || "#ERROR";
				cellStyle = "error-cell";
				title = `Error: ${cellValue}`;
			}
			// Default for text and other types
			else {
				cellValue = cell.v !== undefined ? String(cell.v) : "";
				cellStyle = "text-cell";

				// Check if this is a total hours header
				if (
					typeof cellValue === "string" &&
					(cellValue.toUpperCase().includes("TOTAL HOUR") ||
						cellValue.toUpperCase().includes("TOTAL(H)") ||
						cellValue.toUpperCase().includes("TOTAL (H)"))
				) {
					cellStyle = "total-header";
				}

				title = cellValue ? `Text: ${cellValue}` : "Empty cell";
			}

			// Add formatting info to tooltip if available
			if (cell.z) {
				title += `\nFormat: ${cell.z}`;
			}

			// Add cell reference to tooltip
			if (cell.r) {
				title += `\nCell: ${cell.r}`;
			}
		}

		// Add cell type information to data attributes
		if (cell.t) {
			dataAttributes += ` data-cell-type="${cell.t}"`;
		}

		// Add cell reference if available
		if (cell.r) {
			dataAttributes += ` data-cell-ref="${cell.r}"`;
		}

		return { cellStyle, cellValue, formulaValue, title, dataAttributes };
	}

	/**
	 * Format cell value based on type (improved for formula handling)
	 * @private
	 */
	_formatCellValue(cell) {
		// If this is a formula cell, handle it specially
		if (cell.f) {
			// Check if this is a TIME formula or SUM of time values
			const isTimeFormula =
				cell.f.includes("TIME(") ||
				(cell.f.includes("SUM(") && cell.z && cell.z.includes("h"));

			// Check if this has time formatting
			const hasTimeFormat =
				cell.z &&
				(cell.z.includes("h") ||
					cell.z.includes("H") ||
					cell.z.includes(":") ||
					cell.z.includes("[h]") ||
					cell.z.includes("[H]"));

			if (isTimeFormula || hasTimeFormat) {
				// This is a time-related formula
				if (cell.t === "d" && cell.v instanceof Date) {
					// Extract time from date object
					const hours = cell.v.getHours();
					const minutes = cell.v.getMinutes();
					const seconds = cell.v.getSeconds();
					return `${hours.toString().padStart(2, "0")}:${minutes
						.toString()
						.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
				} else if (typeof cell.v === "number") {
					// Handle numeric time values
					if (cell.v < 1 && cell.v > 0) {
						return (cell.v * 24).toFixed(2); // Convert fraction of day to hours
					} else {
						return this._formatNumericValue(cell.v);
					}
				} else {
					return cell.w || String(cell.v);
				}
			} else if (typeof cell.v === "number") {
				// Regular numeric formula
				return this._formatNumericValue(cell.v);
			} else {
				return cell.v !== undefined ? String(cell.v) : "";
			}
		}

		// Regular cell formatting
		if (cell.t === "n") {
			return this._formatNumericValue(cell.v);
		} else if (cell.t === "d") {
			return cell.w || new Date(cell.v).toLocaleDateString();
		} else if (cell.t === "b") {
			return cell.v ? "TRUE" : "FALSE";
		} else if (cell.t === "e") {
			return cell.w || "#ERROR";
		} else {
			return cell.v !== undefined ? String(cell.v) : "";
		}
	}

	/**
	 * Format numeric values with appropriate precision (improved for hours)
	 * @private
	 */
	_formatNumericValue(value) {
		// Handle very small decimals that might represent time fractions
		if (value < 1 && value > 0) {
			// This might be a time fraction - convert to hours
			const hours = value * 24;
			if (hours < 24) {
				return hours.toFixed(2);
			}
		}

		// Handle regular numbers
		if (value % 1 !== 0) {
			// For decimal numbers, show appropriate precision
			if (value < 100) {
				return Number(value).toFixed(2);
			} else {
				return Number(value).toFixed(1);
			}
		} else {
			return String(value);
		}
	}

	/**
	 * Escape HTML characters for safe display
	 * @private
	 */
	_escapeHtml(text) {
		const div = { innerHTML: text };
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	/**
	 * Check if a string is numeric
	 * @private
	 */
	_isNumericString(str) {
		return !isNaN(str) && !isNaN(parseFloat(str));
	}

	/**
	 * Draw Excel preview on canvas
	 * @private
	 */
	async _drawExcelPreview(ctx, worksheet, options) {
		// Set styles
		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		const cellWidth = options.width / (options.maxCols + 1);
		const cellHeight = options.height / (options.maxRows + 1);

		// Get sheet range
		const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

		// Apply limits
		const limitedRange = {
			s: { r: range.s.r, c: range.s.c },
			e: {
				r: Math.min(range.e.r, options.maxRows - 1),
				c: Math.min(range.e.c, options.maxCols - 1),
			},
		};

		// Draw grid
		ctx.strokeStyle = "#cccccc";
		ctx.lineWidth = 0.5;

		// Draw horizontal lines
		for (let r = 0; r <= limitedRange.e.r + 1; r++) {
			ctx.beginPath();
			ctx.moveTo(0, r * cellHeight);
			ctx.lineTo(options.width, r * cellHeight);
			ctx.stroke();
		}

		// Draw vertical lines
		for (let c = 0; c <= limitedRange.e.c + 1; c++) {
			ctx.beginPath();
			ctx.moveTo(c * cellWidth, 0);
			ctx.lineTo(c * cellWidth, options.height);
			ctx.stroke();
		}

		// Draw header row
		ctx.fillStyle = "#f0f0f0";
		ctx.fillRect(0, 0, options.width, cellHeight);
		ctx.fillRect(0, 0, cellWidth, options.height);

		// Draw column headers
		ctx.fillStyle = "#000000";
		for (let c = 0; c <= limitedRange.e.c; c++) {
			const colName = XLSX.utils.encode_col(c);
			ctx.fillText(colName, (c + 1) * cellWidth + 5, cellHeight / 2);
		}

		// Draw row headers
		for (let r = 0; r <= limitedRange.e.r; r++) {
			ctx.fillText(String(r + 1), 5, (r + 1) * cellHeight + cellHeight / 2);
		}

		// Draw cells
		for (let r = 0; r <= limitedRange.e.r; r++) {
			for (let c = 0; c <= limitedRange.e.c; c++) {
				const cellRef = XLSX.utils.encode_cell({ r, c });
				const cell = worksheet[cellRef];

				if (cell) {
					let value = "";

					// Format cell value based on type
					if (cell.t === "n") {
						value = cell.v.toString();
						ctx.fillStyle = "#0000ff";
					} else if (cell.t === "d") {
						value = new Date(cell.v).toLocaleDateString();
						ctx.fillStyle = "#006600";
					} else if (cell.f) {
						value = cell.v !== undefined ? cell.v.toString() : "";
						ctx.fillStyle = "#9900cc";
					} else {
						value = cell.v !== undefined ? cell.v.toString() : "";
						ctx.fillStyle = "#000000";
					}

					// Truncate long values
					if (value.length > 15) {
						value = value.substring(0, 12) + "...";
					}

					// Draw the cell value
					ctx.fillText(
						value,
						(c + 1) * cellWidth + 5,
						(r + 1) * cellHeight + cellHeight / 2
					);
				}
			}
		}
	}
}

export default new ExcelRendererService();
