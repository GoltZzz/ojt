import express from "express";
import { isLoggedIn, isAdmin } from "../../middleware.js";
import adminController from "../../controllers/admin/admin.js";
import selfDeleteController from "../../controllers/admin/selfDelete.js";
import { validateUser, handleValidationErrors } from "../../utils/sanitize.js";
import { upload } from "../../utils/cloudinary.js";
import {
	getWeeklySummary,
	startWeeklyLoop,
	stopWeeklyLoop,
	restartWeeklyLoop,
	forceCreateNextWeek,
} from "../../controllers/admin/weeklySummary.js";
import timeReportController from "../../controllers/admin/timeReport.js";

const router = express.Router();

// Redirect root admin route to weekly summary
router.route("/").get(isLoggedIn, isAdmin, (req, res) => {
	res.redirect("/admin/weekly-summary");
});

router.route("/users").get(isLoggedIn, isAdmin, adminController.renderUsers);

router
	.route("/register")
	.get(isLoggedIn, isAdmin, adminController.renderRegisterForm)
	.post(
		isLoggedIn,
		isAdmin,
		upload.single("profileImage"),
		validateUser,
		handleValidationErrors,
		adminController.registerUser
	);

router
	.route("/users/:id/toggle-role")
	.post(isLoggedIn, isAdmin, adminController.toggleUserRole);

router
	.route("/users/:id/delete")
	.post(isLoggedIn, isAdmin, adminController.deleteUser);

router
	.route("/users/:id/self-delete")
	.post(isLoggedIn, selfDeleteController.verifySelfDelete);

router
	.route("/reports")
	.get(isLoggedIn, isAdmin, adminController.renderAllReports);

router
	.route("/archived-reports")
	.get(isLoggedIn, isAdmin, adminController.renderArchivedReports);

// Approve route moved to reportMonitoring.js

router
	.route("/reports/:type/:id/unarchive")
	.post(isLoggedIn, isAdmin, adminController.unarchiveReport);

// Time report specific routes
router
	.route("/timereport/:id/archive")
	.post(isLoggedIn, isAdmin, timeReportController.archiveTimeReport);

router
	.route("/timereport/:id/unarchive")
	.post(isLoggedIn, isAdmin, timeReportController.unarchiveTimeReport);

router
	.route("/timereport/:id/delete")
	.post(isLoggedIn, isAdmin, timeReportController.deleteTimeReport);

router.get("/weekly-summary", isLoggedIn, isAdmin, getWeeklySummary);
router.post("/weekly-summary/start", isLoggedIn, isAdmin, startWeeklyLoop);
router.post("/weekly-summary/stop", isLoggedIn, isAdmin, stopWeeklyLoop);
router.post("/weekly-summary/restart", isLoggedIn, isAdmin, restartWeeklyLoop);

router.post("/force-next-week", isLoggedIn, isAdmin, async (req, res) => {
	try {
		const success = await forceCreateNextWeek();
		if (success) {
			req.flash("success", "Successfully created the next week manually");
		} else {
			req.flash(
				"error",
				"Failed to create next week. Check if weekly loop is active."
			);
		}
	} catch (error) {
		console.error("Error while manually creating next week:", error);
		req.flash("error", "An error occurred while creating the next week");
	}
	res.redirect("/admin/weekly-summary");
});

export default router;
