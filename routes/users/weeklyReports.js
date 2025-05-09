import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isReportAuthor from "../../middleware/isReportAuthor.js";
import * as weeklyReports from "../../controllers/users/weeklyReports.js";
import {
	validateWeeklyReport,
	handleValidationErrors,
} from "../../utils/sanitize.js";
import { docxUpload } from "../../utils/localUpload.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, weeklyReports.index)
	.post(
		isLoggedIn,
		docxUpload.fields([{ name: "docxFile", maxCount: 1 }]),
		validateWeeklyReport,
		handleValidationErrors,
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
		docxUpload.fields([{ name: "docxFile", maxCount: 1 }]),
		validateWeeklyReport,
		handleValidationErrors,
		weeklyReports.updateReport
	)
	.patch(
		isLoggedIn,
		isReportAuthor("weeklyReport"),
		docxUpload.fields([{ name: "docxFile", maxCount: 1 }]),
		validateWeeklyReport,
		handleValidationErrors,
		weeklyReports.updateReport
	);
export default router;
