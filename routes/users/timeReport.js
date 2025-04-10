import express from "express";
import { isLoggedIn } from "../../middleware.js";
import timeReport from "../../controllers/users/timeReport.js";
const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, timeReport.renderTimeReport)
	.post(isLoggedIn, timeReport.createTimeReport);

// Add route for creating new time report
router.get("/new", isLoggedIn, timeReport.renderNewForm);

export default router;
