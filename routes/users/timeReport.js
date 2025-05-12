import express from "express";
import { isLoggedIn } from "../../middleware.js";
import timeReport from "../../controllers/users/timeReport.js";
import { xlsxUpload } from "../../utils/localUpload.js";
import {
	validateTimeReport,
	handleValidationErrors,
} from "../../utils/sanitize.js";
const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, timeReport.renderTimeReport)
	.post(
		isLoggedIn,
		validateTimeReport,
		handleValidationErrors,
		timeReport.createTimeReport
	);

// Specific routes first
router.get("/new", isLoggedIn, timeReport.renderNewForm);

router.post(
	"/upload-xlsx",
	isLoggedIn,
	xlsxUpload.single("xlsxFile"),
	timeReport.uploadXlsxAndShowExcel
);

router.get("/show/:filename", isLoggedIn, timeReport.showExcel);

// Generic catch-all route last
router.get("/:id", isLoggedIn, timeReport.showTimeReport);

export default router;
