import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isAuthor from "../../middleware/isAuthor.js";
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
	.delete(isLoggedIn, isAuthor, weeklyProgressReports.deleteReport);

router
	.route("/:id/archive")
	.post(isLoggedIn, weeklyProgressReports.archiveReport);

router
	.route("/:id/unarchive")
	.post(isLoggedIn, weeklyProgressReports.unarchiveReport);

router
	.route("/:id/edit")
	.get(isLoggedIn, isAuthor, weeklyProgressReports.renderEditForm);
router
	.route("/:id/update")
	.post(
		isLoggedIn,
		isAuthor,
		handleValidationErrors,
		weeklyProgressReports.updateReport
	);
export default router;
