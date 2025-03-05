import express from "express";
import catchAsync from "../utils/catchAsync.js";
import dashboard from "../controllers/dashboard.js";
import { isLoggedIn } from "../middleware.js";
const router = express.Router();

router.route("/").get(isLoggedIn, dashboard.renderDashboard);
export default router;
