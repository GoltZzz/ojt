import express from "express";
import { isLoggedIn, isAdmin } from "../../middleware.js";
import * as reportMonitoring from "../../controllers/admin/reportMonitoring.js";

const router = express.Router();

// Apply middleware to all routes
router.use(isLoggedIn, isAdmin);

// Get all pending reports
router.get("/pending-reports", reportMonitoring.getPendingReports);

// Approve a report
router.post("/:type/:id/approve", reportMonitoring.approveReport);

// Reject a report
router.post("/:type/:id/reject", reportMonitoring.rejectReport);

export default router;
