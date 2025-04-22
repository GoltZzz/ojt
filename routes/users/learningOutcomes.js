import express from "express";
import { isLoggedIn, isAdmin } from "../../middleware.js";
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
	.put(
		isLoggedIn,
		isReportAuthor("learningOutcomes"),
		handleValidationErrors,
		learningOutcomes.updateOutcome
	)
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

// Archive and unarchive routes (admin only)
router.post(
	"/:id/archive",
	isLoggedIn,
	isAdmin,
	learningOutcomes.archiveOutcome
);

router.post(
	"/:id/unarchive",
	isLoggedIn,
	isAdmin,
	learningOutcomes.unarchiveOutcome
);

// Export to PDF route
router.get("/:id/export-pdf", isLoggedIn, learningOutcomes.exportOutcomeAsPdf);

export default router;
