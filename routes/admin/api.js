import express from "express";
import { isLoggedIn, isAdmin } from "../../middleware.js";
import User from "../../models/users.js";
import { escapeRegex } from "../../utils/sanitize.js";
import multer from "multer";
import xlsx from "xlsx";
import bcrypt from "bcrypt";

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// API route to check if username exists
router.get("/check-username", isLoggedIn, isAdmin, async (req, res) => {
	try {
		let { username } = req.query;
		if (!username) {
			return res.status(400).json({ error: "Username is required" });
		}

		// Sanitize and escape the username
		username = username.trim();

		// Use exact match for username
		const existingUser = await User.findOne({ username });
		return res.json({ exists: !!existingUser });
	} catch (error) {
		console.error("Error checking username:", error);
		return res.status(500).json({ error: "Server error" });
	}
});

// Helper function to safely convert a value to string and trim
const toTrimmedString = (value) => {
	if (value === undefined || value === null) return "";
	return String(value).trim();
};

// Helper function to validate student data
const validateStudentData = (row) => {
	const required = [
		"LastName",
		"FirstName",
		"studentIdNumber",
		"internshipSite",
		"course",
		"password",
	];

	// Convert all field values to strings and check if they're empty
	const missing = required.filter((field) => {
		const value = toTrimmedString(row[field]);
		return !value;
	});

	if (missing.length > 0) {
		return {
			isValid: false,
			error: `Missing required fields: ${missing.join(", ")}`,
		};
	}

	// Validate studentIdNumber format after converting to string
	const studentId = toTrimmedString(row.studentIdNumber);
	if (!/^[a-zA-Z0-9-]+$/.test(studentId)) {
		return {
			isValid: false,
			error: "Invalid student ID format",
		};
	}

	return { isValid: true };
};

// Bulk register students via Excel upload
router.post(
	"/upload-students",
	isLoggedIn,
	isAdmin,
	upload.single("excel"),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({ error: "No file uploaded" });
			}

			const workbook = xlsx.readFile(req.file.path);
			const sheetName = workbook.SheetNames[0];
			const sheet = workbook.Sheets[sheetName];
			const rows = xlsx.utils.sheet_to_json(sheet);

			const results = {
				successful: [],
				failed: [],
			};

			// Process each row
			for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
				const row = rows[rowIndex];
				const rowNumber = rowIndex + 2; // Excel rows start at 1, and we have a header row

				try {
					// Validate row data
					const validation = validateStudentData(row);
					if (!validation.isValid) {
						console.log(
							`Row ${rowNumber} validation failed:`,
							validation.error
						);
						results.failed.push({
							row: rowNumber,
							studentId: toTrimmedString(row.studentIdNumber) || "N/A",
							reason: validation.error,
						});
						continue;
					}

					// Check for existing user
					const existingUser = await User.findOne({
						username: toTrimmedString(row.studentIdNumber),
					});
					if (existingUser) {
						console.log(
							`Row ${rowNumber}: Student ID ${row.studentIdNumber} already exists`
						);
						results.failed.push({
							row: rowNumber,
							studentId: toTrimmedString(row.studentIdNumber),
							reason: "Student ID already exists",
						});
						continue;
					}

					// Create new user with safely converted string values
					const user = new User({
						username: toTrimmedString(row.studentIdNumber),
						firstName: toTrimmedString(row.FirstName),
						middleName: toTrimmedString(row.MiddleName),
						lastName: toTrimmedString(row.LastName),
						internshipSite: toTrimmedString(row.internshipSite),
						course: toTrimmedString(row.course),
						role: "user",
					});

					// Set password (skipping validation)
					if (user.setPassword) {
						await user.setPassword(String(row.password));
					} else {
						const hash = await bcrypt.hash(String(row.password), 10);
						user.password = hash;
					}

					await user.save();
					console.log(
						`Row ${rowNumber}: Successfully registered student ${row.studentIdNumber}`
					);
					results.successful.push(toTrimmedString(row.studentIdNumber));
				} catch (error) {
					console.error(`Row ${rowNumber} error:`, {
						studentId: toTrimmedString(row.studentIdNumber) || "N/A",
						error: error.message,
						stack: error.stack,
					});

					results.failed.push({
						row: rowNumber,
						studentId: toTrimmedString(row.studentIdNumber) || "N/A",
						reason: `Database error: ${error.message}`,
					});
				}
			}

			// Return detailed results
			return res.json({
				summary: {
					total: rows.length,
					successful: results.successful.length,
					failed: results.failed.length,
				},
				successful: results.successful,
				failed: results.failed,
			});
		} catch (error) {
			console.error("Fatal error processing Excel upload:", error);
			return res.status(500).json({
				error: "Server error processing the upload",
				details: error.message,
			});
		}
	}
);

export default router;
