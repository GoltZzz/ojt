import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isReportAuthor from "../../middleware/isReportAuthor.js";
import * as weeklyProgressReports from "../../controllers/users/weeklyProgressReports.js";
import { handleValidationErrors } from "../../utils/sanitize.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, weeklyProgressReports.index)
	.post(isLoggedIn, handleValidationErrors, weeklyProgressReports.createReport);

router.get("/new", isLoggedIn, weeklyProgressReports.renderNewForm);

router
	.route("/:id")
	.get(isLoggedIn, weeklyProgressReports.showReport)
	.delete(
		isLoggedIn,
		isReportAuthor("weeklyProgressReport"),
		weeklyProgressReports.deleteReport
	);

router
	.route("/:id/archive")
	.post(isLoggedIn, weeklyProgressReports.archiveReport);

router
	.route("/:id/unarchive")
	.post(isLoggedIn, weeklyProgressReports.unarchiveReport);

router.get(
	"/:id/export-pdf",
	isLoggedIn,
	weeklyProgressReports.exportReportAsPdf
);

router
	.route("/:id/edit")
	.get(
		isLoggedIn,
		isReportAuthor("weeklyProgressReport"),
		weeklyProgressReports.renderEditForm
	);
router
	.route("/:id/update")
	.post(
		isLoggedIn,
		isReportAuthor("weeklyProgressReport"),
		handleValidationErrors,
		weeklyProgressReports.updateReport
	);
export default router;
