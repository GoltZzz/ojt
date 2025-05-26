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

// New route
router.get("/new", isLoggedIn, timeReport.renderNewForm);

// Upload route
router.post(
	"/upload",
	isLoggedIn,
	xlsxUpload.single("xlsxFile"),
	timeReport.uploadXlsxAndShowExcel
);

// Excel viewer routes
router.get("/show/:filename", isLoggedIn, timeReport.showExcel);
router.get("/server/:filename", isLoggedIn, timeReport.showServerExcel);

// Annotation route
router.post(
	"/:id/annotate",
	isLoggedIn,
	isTimeReportAuthor,
	timeReport.addAnnotation
);

// Version route
router.post(
	"/:id/version",
	isLoggedIn,
	isTimeReportAuthor,
	xlsxUpload.single("xlsxFile"),
	timeReport.createNewVersion
);

// Archive route (admin only)
router.post("/:id/archive", isLoggedIn, timeReport.archiveTimeReport);

// Unarchive route (admin only)
router.post("/:id/unarchive", isLoggedIn, timeReport.unarchiveTimeReport);

// Delete route - now with proper authorization middleware
router.delete(
	"/:id",
	isLoggedIn,
	isTimeReportAuthor,
	timeReport.deleteTimeReport
);

// Show route - must be last as it's a catch-all for /:id
router.get("/:id", isLoggedIn, timeReport.showTimeReport);

export default router;
