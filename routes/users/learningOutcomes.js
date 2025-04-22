import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isReportAuthor from "../../middleware/isReportAuthor.js";
import * as learningOutcomes from "../../controllers/users/learningOutcomes.js";
import { handleValidationErrors } from "../../utils/sanitize.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, learningOutcomes.index)
	.post(isLoggedIn, handleValidationErrors, learningOutcomes.createOutcome);

router.get("/new", isLoggedIn, learningOutcomes.renderNewForm);

router
	.route("/:id")
	.get(isLoggedIn, learningOutcomes.showOutcome)
	.delete(
		isLoggedIn,
		isReportAuthor("learningOutcomes"),
		learningOutcomes.deleteOutcome
	);

router
	.route("/:id/edit")
	.get(
		isLoggedIn,
		isReportAuthor("learningOutcomes"),
		learningOutcomes.renderEditForm
	);
router
	.route("/:id/update")
	.post(
		isLoggedIn,
		isReportAuthor("learningOutcomes"),
		handleValidationErrors,
		learningOutcomes.updateOutcome
	);
export default router;
