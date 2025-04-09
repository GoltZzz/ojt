import express from "express";
import { isLoggedIn, hasAccess } from "../../middleware.js";
import timeReport from "../../controllers/users/timeReport.js";
const router = express.Router();

router.route("/").get(isLoggedIn, hasAccess(), timeReport.renderTimeReport);

export default router;
