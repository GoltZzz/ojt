import express from "express";
import { isLoggedIn, isAdmin } from "../../middleware.js";
import * as reportMonitoring from "../../controllers/admin/reportMonitoring.js";

const router = express.Router();

// Apply middleware to all routes
router.use(isLoggedIn, isAdmin);

// Get all reports
router.get("/reports", reportMonitoring.getReports);

export default router;
