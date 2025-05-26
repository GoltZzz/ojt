import { body, validationResult } from "express-validator";
import ExpressError from "./ExpressError.js";

// Function to escape regex special characters
export const escapeRegex = (string) => {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Middleware to sanitize request body
export const sanitizeBody = (req, res, next) => {
	// Fields that should preserve spaces (like textareas and reason fields)
	const preserveSpacesFields = [
		"content",
		"description",
		"accomplishments",
		"reason",
		"archivedReason",
		"approvalReason",
		"rejectionReason",
	];

	// Sanitize each field in the request body
	for (const key in req.body) {
		if (typeof req.body[key] === "string") {
			// Check if this is a field where we should preserve spaces
			const shouldPreserveSpaces = preserveSpacesFields.some((field) =>
				key.includes(field)
			);

			// For fields like textareas, preserve spaces but still sanitize
			if (shouldPreserveSpaces) {
				// Only trim leading/trailing whitespace
				req.body[key] = req.body[key].trim();
			} else {
				// For other fields, trim all excess whitespace
				req.body[key] = req.body[key].trim().replace(/\s+/g, " ");
			}
		}
	}
	next();
};

// Create validation chains for common fields
export const validateUser = [
	body("username").trim().escape(),
	body("firstName").trim().escape(),
	body("middleName").trim().escape(),
	body("lastName").trim().escape(),
	body("password").trim(),
];

export const validateWeeklyReport = [
	body("studentName").trim().escape(),
	body("internshipSite").trim().escape(),
	body("supervisorName").trim().escape(),
	body("weekStartDate").trim().escape(),
	body("weekEndDate").trim().escape(),
	body("dailyRecords.*.timeIn.morning").trim().escape(),
	body("dailyRecords.*.timeOut.afternoon").trim().escape(),
	// Preserve line breaks and spacing in accomplishments
	body("dailyRecords.*.accomplishments").trim().escape(),
];

export const validateDocumentation = [
	body("title").trim().escape(),
	// Preserve formatting in content field
	body("content").trim().escape(),
];

export const validateTimeReport = [
	body("date").trim().escape(),
	body("hours").trim().escape(),
	// Preserve formatting in description field
	body("description").trim().escape(),
	body("project").trim().escape(),
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const errorMessages = errors.array().map((err) => err.msg);
		req.flash("error", errorMessages.join(", "));
		return res.redirect("back");
	}
	next();
};
