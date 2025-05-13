import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import crypto from "crypto";
import { fileTypeFromBuffer } from "file-type";

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(process.cwd(), "uploads/docx"));
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const base = path.basename(file.originalname, ext);
		cb(null, `${base}-${uuidv4().substring(0, 8)}${ext}`);
	},
});

const docxUpload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
	fileFilter: (req, file, cb) => {
		if (
			file.mimetype ===
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		) {
			cb(null, true);
		} else {
			cb(new Error("Only DOCX files are allowed."), false);
		}
	},
});

// Create directory if it doesn't exist
const ensureDirectoryExists = (directory) => {
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
	}
};

// Ensure upload directories exist
ensureDirectoryExists("./public/uploads/excel");

// Custom storage engine for xlsx files
const xlsxStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./public/uploads/excel");
	},
	filename: function (req, file, cb) {
		// Generate safe filename with user identifier prefix
		const userPrefix = req.user
			? req.user.username.substring(0, 8).replace(/[^a-z0-9]/gi, "")
			: "anon";
		const randomHash = crypto.randomBytes(4).toString("hex");
		const safeFilename = `excel ${userPrefix}-${randomHash}${path.extname(
			file.originalname
		)}`;
		cb(null, safeFilename);
	},
});

// Enhanced file filter for xlsx files
const xlsxFileFilter = async (req, file, cb) => {
	try {
		// Check mime type from multer
		const allowedMimes = [
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-excel",
		];

		if (!allowedMimes.includes(file.mimetype)) {
			return cb(new Error("Only Excel files are allowed (.xlsx, .xls)"), false);
		}

		// Size validation - handled by multer limits

		// Create buffer for file type detection
		const buffer = [];
		file.stream.on("data", (chunk) => buffer.push(chunk));

		// Wait for the entire file
		await new Promise((resolve, reject) => {
			file.stream.on("end", resolve);
			file.stream.on("error", reject);
		});

		// Concatenate chunks
		const fileBuffer = Buffer.concat(buffer);

		// Detect file type from buffer
		const fileType = await fileTypeFromBuffer(fileBuffer);

		// Validate actual file type
		if (!fileType || !["xlsx", "xls"].includes(fileType.ext)) {
			return cb(new Error("File content doesn't match Excel format"), false);
		}

		// Reattach buffer to new stream
		file.stream = new require("stream").Readable();
		file.stream.push(fileBuffer);
		file.stream.push(null);

		// Optional: Add virus scanning here if you have an integration

		cb(null, true);
	} catch (err) {
		cb(new Error(`File validation error: ${err.message}`), false);
	}
};

// Set up multer instance for xlsx file uploads
const xlsxUpload = multer({
	storage: xlsxStorage,
	fileFilter: xlsxFileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max size
		files: 1, // Only allow one file per upload
	},
});

export { docxUpload, xlsxUpload };

// Export other upload configurations if needed
export default {
	docxUpload,
	xlsxUpload,
};
