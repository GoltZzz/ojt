import express from "express";
import { isLoggedIn, isAuthor, isTimeReportAuthor } from "../../middleware.js";
import timeReport from "../../controllers/users/timeReport.js";
import { xlsxUpload } from "../../utils/localUpload.js";
import {
	validateTimeReport,
	handleValidationErrors,
} from "../../utils/sanitize.js";

const router = express.Router();

// Index route
router
	.route("/")
	.get(isLoggedIn, timeReport.renderTimeReport)
	.post(
		isLoggedIn,
		validateTimeReport,
		handleValidationErrors,
		timeReport.createTimeReport
	);

// New form route
router.get("/new", isLoggedIn, timeReport.renderNewForm);

// Excel upload route
router.post(
	"/upload-xlsx",
	isLoggedIn,
	xlsxUpload.single("xlsxFile"),
	timeReport.uploadXlsxAndShowExcel
);

// Show Excel file route
router.get("/show/:filename", isLoggedIn, timeReport.showExcel);

// Annotation routes
// router.post("/:id/annotations", isLoggedIn, timeReport.addAnnotation);

// Versioning routes
router.post(
	"/:id/versions",
	isLoggedIn,
	isTimeReportAuthor,
	xlsxUpload.single("xlsxFile"),
	timeReport.createNewVersion
);

// Delete route
router.delete(
	"/:id",
	isLoggedIn,
	isTimeReportAuthor,
	timeReport.deleteTimeReport
);

// Generic catch-all detail route (must be last)
router.get("/:id", isLoggedIn, timeReport.showTimeReport);

export default router;
