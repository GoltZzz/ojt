import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import XLSX from "xlsx";
import puppeteer from "puppeteer";

/**
 * Converts an XLSX file to PDF via HTML with full width control
 * This approach gives us complete control over the layout
 */
export const convertXlsxToPdfViaHtml = async (xlsxFile, studentName) => {
	try {
		const xlsxPath = xlsxFile.path;

		// Read the Excel file using XLSX (SheetJS) for better formula handling
		const fileBuffer = fs.readFileSync(xlsxPath);
		const workbook = XLSX.read(fileBuffer, {
			type: "buffer",
			cellStyles: true,
			cellNF: true,
			cellFormula: false, // Don't show formulas, show calculated values
			cellDates: true,
			dateNF: "mm/dd/yyyy",
		});

		// Convert Excel to HTML with custom styling
		const htmlContent = await convertExcelToHtml(workbook);

		// Generate PDF from HTML using Puppeteer
		const pdfBuffer = await generatePdfFromHtml(htmlContent);

		// Save the PDF
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
		console.error("Error converting XLSX to PDF via HTML:", error);
		throw new Error(`Failed to convert XLSX to PDF: ${error.message}`);
	}
};

async function convertExcelToHtml(workbook) {
	let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4 landscape;
            margin: 0.2in;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            margin: 0;
            padding: 0;
            width: 100%;
        }
        
        .excel-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin: 0;
            font-size: 10pt;
        }
        
        .excel-table th,
        .excel-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.2;
        }
        
        .excel-table th {
            background-color: #5B9BD5;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 10pt;
            padding: 6px 4px;
        }
        
        /* Exact column widths to match your screenshot */
        .col-date { width: 10%; }
        .col-activity { width: 60%; } /* Much wider for activities */
        .col-items { width: 6%; }
        .col-duration { width: 8%; }
        .col-total-s { width: 8%; }
        .col-total-h { width: 8%; }
        
        /* Remove alternating colors for cleaner look */
        .excel-table tr:nth-child(even) {
            background-color: white;
        }
        
        /* Special styling for total rows */
        .total-row {
            background-color: #FFE699 !important;
            font-weight: bold;
        }
        
        /* Activity cell specific styling */
        .activity-cell {
            word-break: break-word;
            white-space: normal;
            line-height: 1.3;
            padding: 6px 8px;
            text-align: left;
        }
        
        /* Center align numeric columns */
        .col-items, .col-duration, .col-total-s, .col-total-h {
            text-align: center;
        }
        
        /* Date column styling */
        .col-date {
            text-align: center;
            font-weight: bold;
        }
    </style>
</head>
<body>
`;

	// Process each worksheet
	workbook.SheetNames.forEach((sheetName) => {
		const worksheet = workbook.Sheets[sheetName];

		// Get the range of the worksheet
		const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

		htmlContent += `<table class="excel-table">`;

		let isFirstRow = true;

		// Process each row
		for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
			const rowData = [];
			let hasData = false;

			// Process each column in this row
			for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
				const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
				const cell = worksheet[cellAddress];

				let cellValue = "";
				if (cell) {
					// Use the formatted value (w) if available, otherwise the raw value (v)
					if (cell.w !== undefined) {
						cellValue = cell.w; // Formatted display value
					} else if (cell.v !== undefined) {
						cellValue = formatCellValue(cell);
					}

					if (
						cellValue !== "" &&
						cellValue !== null &&
						cellValue !== undefined
					) {
						hasData = true;
					}
				}

				rowData[colNum] = cellValue || "";
			}

			if (!hasData) continue; // Skip empty rows

			if (isFirstRow) {
				// Header row
				htmlContent += "<tr>";
				rowData.forEach((cellValue, index) => {
					const colClass = getColumnClass(index);
					htmlContent += `<th class="${colClass}">${escapeHtml(
						cellValue
					)}</th>`;
				});
				htmlContent += "</tr>";
				isFirstRow = false;
			} else {
				// Data row
				const isTotal = rowData.some(
					(cell) =>
						typeof cell === "string" && cell.toLowerCase().includes("total")
				);
				const rowClass = isTotal ? "total-row" : "";

				htmlContent += `<tr class="${rowClass}">`;
				rowData.forEach((cellValue, index) => {
					const colClass = getColumnClass(index);
					const cellClass = index === 1 ? "activity-cell" : ""; // Activity column
					htmlContent += `<td class="${colClass} ${cellClass}">${escapeHtml(
						cellValue
					)}</td>`;
				});
				htmlContent += "</tr>";
			}
		}

		htmlContent += "</table>";
	});

	htmlContent += `
</body>
</html>`;

	return htmlContent;
}

function getColumnClass(index) {
	const classes = [
		"col-date", // 0: DATE
		"col-activity", // 1: ACTIVITY
		"col-items", // 2: NO. ITEMS
		"col-duration", // 3: TIME DURATION
		"col-total-s", // 4: TOTAL (S)
		"col-total-h", // 5: TOTAL (H)
	];
	return classes[index] || "col-default";
}

function formatCellValue(cell) {
	if (!cell || cell.v === undefined || cell.v === null) return "";

	// For numbers, check if they should be formatted as time
	if (cell.t === "n") {
		// If the cell has a time format, handle it specially
		if (
			cell.z &&
			(cell.z.includes("h") || cell.z.includes("H") || cell.z.includes(":"))
		) {
			// This is a time value - convert decimal to hours:minutes
			const totalHours = cell.v * 24; // Convert from Excel's decimal day format
			const hours = Math.floor(totalHours);
			const minutes = Math.round((totalHours - hours) * 60);
			return `${hours}:${minutes.toString().padStart(2, "0")}`;
		}
		// Regular number
		return Number.isInteger(cell.v) ? cell.v.toString() : cell.v.toFixed(2);
	}

	// For dates
	if (cell.t === "d") {
		return new Date(cell.v).toLocaleDateString("en-US", {
			month: "2-digit",
			day: "2-digit",
			year: "numeric",
		});
	}

	// For booleans
	if (cell.t === "b") {
		return cell.v ? "TRUE" : "FALSE";
	}

	// For errors
	if (cell.t === "e") {
		return "#ERROR";
	}

	// For strings and everything else
	return String(cell.v);
}

function escapeHtml(text) {
	if (typeof text !== "string") return text;
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

async function generatePdfFromHtml(htmlContent) {
	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const page = await browser.newPage();
		await page.setContent(htmlContent, { waitUntil: "networkidle0" });

		const pdfBuffer = await page.pdf({
			format: "A4",
			landscape: true,
			margin: {
				top: "0.2in",
				right: "0.2in",
				bottom: "0.2in",
				left: "0.2in",
			},
			printBackground: true,
			preferCSSPageSize: true,
			scale: 1.0, // Ensure no scaling
		});

		return pdfBuffer;
	} finally {
		await browser.close();
	}
}
