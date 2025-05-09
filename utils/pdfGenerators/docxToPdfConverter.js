import fs from "fs";
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import libre from "libreoffice-convert";

// Promisify the libre.convert function
const libreConvert = promisify(libre.convert);

/**
 * Converts a DOCX file to PDF and saves it locally
 *
 * @param {Object} docxFile - The DOCX file object from multer
 * @param {String} docxFile.path - The path to the DOCX file
 * @param {String} docxFile.filename - The name of the DOCX file
 * @param {String} studentName - The student's name for the filename
 * @returns {Promise<Object>} - Object containing PDF file information
 */
export const convertDocxToPdf = async (docxFile, studentName) => {
	try {
		// Read the DOCX file
		const docxPath = docxFile.path;
		const docxBuffer = await fs.promises.readFile(docxPath);

		// Convert the DOCX to PDF
		const pdfBuffer = await libreConvert(docxBuffer, ".pdf", undefined);

		// Generate a unique filename for the PDF
		const currentDate = new Date().toISOString().split("T")[0];
		const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9]/g, "");
		const pdfFilename = `WeeklyReport-PDF-${sanitizedStudentName}-${currentDate}-${uuidv4().substring(
			0,
			8
		)}.pdf`;

		// Save the PDF to uploads/pdfs/
		const pdfDir = path.join(process.cwd(), "uploads/pdfs");
		if (!fs.existsSync(pdfDir)) {
			fs.mkdirSync(pdfDir, { recursive: true });
		}
		const pdfPath = path.join(pdfDir, pdfFilename);
		await fs.promises.writeFile(pdfPath, pdfBuffer);

		// Return the local URL path for serving
		return {
			filename: pdfFilename,
			path: `/pdfs/${pdfFilename}`,
			mimetype: "application/pdf",
			size: pdfBuffer.length,
			generatedFrom: docxFile.filename,
		};
	} catch (error) {
		console.error("Error converting DOCX to PDF:", error);
		throw new Error(`Failed to convert DOCX to PDF: ${error.message}`);
	}
};
