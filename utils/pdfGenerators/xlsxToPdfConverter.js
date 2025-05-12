import fs from "fs";
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import libre from "libreoffice-convert";

const libreConvert = promisify(libre.convert);

/**
 * Converts an XLSX file to PDF and saves it locally
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
		const xlsxBuffer = await fs.promises.readFile(xlsxPath);
		const pdfBuffer = await libreConvert(xlsxBuffer, ".pdf", undefined);
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
