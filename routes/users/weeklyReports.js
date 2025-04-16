import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isAuthor from "../../middleware/isAuthor.js";
import * as weeklyReports from "../../controllers/users/weeklyReports.js";
import {
	validateWeeklyReport,
	handleValidationErrors,
} from "../../utils/sanitize.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, weeklyReports.index)
	.post(
		isLoggedIn,
		validateWeeklyReport,
		handleValidationErrors,
		weeklyReports.createReport
	);

router.get("/new", isLoggedIn, weeklyReports.renderNewForm);

router
	.route("/:id")
	.get(isLoggedIn, weeklyReports.showReport)
	.delete(isLoggedIn, isAuthor, weeklyReports.deleteReport);

router.post("/:id/archive", isLoggedIn, weeklyReports.archiveReport);
router.get("/:id/export", isLoggedIn, weeklyReports.exportReportAsDocx);
router
	.route("/:id/edit")
	.get(isLoggedIn, isAuthor, weeklyReports.renderEditForm);
router
	.route("/:id/update")
	.post(
		isLoggedIn,
		isAuthor,
		validateWeeklyReport,
		handleValidationErrors,
		weeklyReports.updateReport
	);
export default router;
