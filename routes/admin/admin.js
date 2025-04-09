import express from "express";
import { isLoggedIn, isAdmin } from "../../middleware.js";
import adminController from "../../controllers/admin/admin.js";

const router = express.Router();

router.route("/").get(isLoggedIn, isAdmin, adminController.renderDashboard);

router.route("/users").get(isLoggedIn, isAdmin, adminController.renderUsers);

router
	.route("/users/:id/toggle-role")
	.post(isLoggedIn, isAdmin, adminController.toggleUserRole);

export default router;
