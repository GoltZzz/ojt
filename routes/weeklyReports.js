import express from "express";
import { isLoggedIn } from "../middleware.js";
import * as weeklyReports from "../controllers/weeklyReports.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, weeklyReports.index)
	.post(isLoggedIn, weeklyReports.createReport);

router.get("/new", isLoggedIn, weeklyReports.renderNewForm);

router
	.route("/:id")
	.get(isLoggedIn, weeklyReports.showReport)
	.delete(isLoggedIn, weeklyReports.deleteReport);
router.route("/:id/edit").get(isLoggedIn, weeklyReports.renderEditForm);
export default router;
