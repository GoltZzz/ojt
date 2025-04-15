import express from "express";
import { isLoggedIn } from "../../middleware.js";
import timeReport from "../../controllers/users/timeReport.js";
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

router.get("/new", isLoggedIn, timeReport.renderNewForm);

export default router;
