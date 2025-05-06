import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isReportAuthor from "../../middleware/isReportAuthor.js";
import * as weeklyReports from "../../controllers/users/weeklyReports.js";
import {
	validateWeeklyReport,
	handleValidationErrors,
} from "../../utils/sanitize.js";
import { weeklyReportUpload } from "../../utils/cloudinary.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, weeklyReports.index)
	.post(
		isLoggedIn,
		weeklyReportUpload.fields([
			{ name: "photos", maxCount: 10 },
			{ name: "docxFile", maxCount: 1 },
		]),
		weeklyReports.createReport
	);

router.get("/new", isLoggedIn, weeklyReports.renderNewForm);

router
	.route("/:id")
	.get(isLoggedIn, weeklyReports.showReport)
	.delete(
		isLoggedIn,
		isReportAuthor("weeklyReport"),
		weeklyReports.deleteReport
	);

router.post("/:id/archive", isLoggedIn, weeklyReports.archiveReport);
router.get("/:id/export-pdf", isLoggedIn, weeklyReports.exportReportAsPdf);
router
	.route("/:id/edit")
	.get(
		isLoggedIn,
		isReportAuthor("weeklyReport"),
		weeklyReports.renderEditForm
	);
router
	.route("/:id/update")
	.post(
		isLoggedIn,
		isReportAuthor("weeklyReport"),
		validateWeeklyReport,
		handleValidationErrors,
		weeklyReports.updateReport
	);
export default router;
