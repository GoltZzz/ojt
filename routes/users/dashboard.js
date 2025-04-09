import express from "express";
import dashboard from "../../controllers/users/dashboard.js";
import { isLoggedIn } from "../../middleware.js";
const router = express.Router();

router.route("/").get(isLoggedIn, dashboard.renderDashboard);
export default router;
