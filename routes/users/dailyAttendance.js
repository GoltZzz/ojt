import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isReportAuthor from "../../middleware/isReportAuthor.js";
import * as dailyAttendance from "../../controllers/users/dailyAttendance.js";
import { handleValidationErrors } from "../../utils/sanitize.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, dailyAttendance.index)
	.post(isLoggedIn, handleValidationErrors, dailyAttendance.createAttendance);

router.get("/new", isLoggedIn, dailyAttendance.renderNewForm);

router
	.route("/:id")
	.get(isLoggedIn, dailyAttendance.showAttendance)
	.delete(
		isLoggedIn,
		isReportAuthor("dailyAttendance"),
		dailyAttendance.deleteAttendance
	);

router
	.route("/:id/edit")
	.get(
		isLoggedIn,
		isReportAuthor("dailyAttendance"),
		dailyAttendance.renderEditForm
	);
router
	.route("/:id/update")
	.post(
		isLoggedIn,
		isReportAuthor("dailyAttendance"),
		handleValidationErrors,
		dailyAttendance.updateAttendance
	);
export default router;
