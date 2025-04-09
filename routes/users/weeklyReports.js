import express from "express";
import { isLoggedIn, hasAccess } from "../../middleware.js";
import * as weeklyReports from "../../controllers/users/weeklyReports.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, hasAccess(), weeklyReports.index)
	.post(isLoggedIn, hasAccess(), weeklyReports.createReport);

router.get("/new", isLoggedIn, hasAccess(), weeklyReports.renderNewForm);

router
	.route("/:id")
	.get(isLoggedIn, hasAccess(), weeklyReports.showReport)
	.delete(isLoggedIn, hasAccess(), weeklyReports.deleteReport);
router
	.route("/:id/edit")
	.get(isLoggedIn, hasAccess(), weeklyReports.renderEditForm);
export default router;
