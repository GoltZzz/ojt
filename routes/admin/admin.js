import express from "express";
import { isLoggedIn, isAdmin } from "../../middleware.js";
import adminController from "../../controllers/admin/admin.js";

const router = express.Router();

router.route("/").get(isLoggedIn, isAdmin, adminController.renderDashboard);

router.route("/users").get(isLoggedIn, isAdmin, adminController.renderUsers);

router
	.route("/users/:id/toggle-role")
	.post(isLoggedIn, isAdmin, adminController.toggleUserRole);

router
	.route("/users/:id/delete")
	.post(isLoggedIn, isAdmin, adminController.deleteUser);

router
	.route("/pending-reports")
	.get(isLoggedIn, isAdmin, adminController.renderPendingReports);

router
	.route("/reports")
	.get(isLoggedIn, isAdmin, adminController.renderAllReports);

router
	.route("/archived-reports")
	.get(isLoggedIn, isAdmin, adminController.renderArchivedReports);

router
	.route("/reports/:id/approve")
	.post(isLoggedIn, isAdmin, adminController.approveReport);

router
	.route("/reports/:id/unarchive")
	.post(isLoggedIn, isAdmin, adminController.unarchiveReport);

export default router;
