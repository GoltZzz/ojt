import express from "express";
import { isLoggedIn } from "../middleware.js";
import notificationsController from "../controllers/users/notifications.js";

const router = express.Router();

// Get all notifications for the current user
router.get("/", isLoggedIn, notificationsController.getUserNotifications);

// Mark a notification as read
router.put("/:id/read", isLoggedIn, notificationsController.markAsRead);

// Mark all notifications as read
router.put("/read-all", isLoggedIn, notificationsController.markAllAsRead);

export default router;
