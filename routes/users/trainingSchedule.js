import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isReportAuthor from "../../middleware/isReportAuthor.js";
import * as trainingSchedule from "../../controllers/users/trainingSchedule.js";
import { handleValidationErrors } from "../../utils/sanitize.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, trainingSchedule.index)
	.post(isLoggedIn, handleValidationErrors, trainingSchedule.createSchedule);

router.get("/new", isLoggedIn, trainingSchedule.renderNewForm);

router
	.route("/:id")
	.get(isLoggedIn, trainingSchedule.showSchedule)
	.delete(
		isLoggedIn,
		isReportAuthor("trainingSchedule"),
		trainingSchedule.deleteSchedule
	);

router.route("/:id/archive").post(isLoggedIn, trainingSchedule.archiveSchedule);

router
	.route("/:id/unarchive")
	.post(isLoggedIn, trainingSchedule.unarchiveSchedule);

router.get("/:id/export-pdf", isLoggedIn, trainingSchedule.exportScheduleAsPdf);

router
	.route("/:id/edit")
	.get(
		isLoggedIn,
		isReportAuthor("trainingSchedule"),
		trainingSchedule.renderEditForm
	);
router
	.route("/:id/update")
	.post(
		isLoggedIn,
		isReportAuthor("trainingSchedule"),
		handleValidationErrors,
		trainingSchedule.updateSchedule
	);
export default router;
