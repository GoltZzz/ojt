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

// Upload Excel route
router.post(
	"/upload",
	isLoggedIn,
	xlsxUpload.single("xlsxFile"),
	timeReport.uploadXlsxAndShowExcel
);

// Show Excel file route
router.get("/show/:filename", isLoggedIn, timeReport.showExcel);

// Server-rendered Excel viewer route
router.get("/server-view/:filename", isLoggedIn, timeReport.showServerExcel);

// Test route without authentication
router.get("/test-server-view/:filename", timeReport.showServerExcel);

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
router.delete("/:id", isLoggedIn, timeReport.deleteTimeReport);

// Show route - must be last as it's a catch-all for /:id
router.get("/:id", isLoggedIn, timeReport.showTimeReport);

export default router;
