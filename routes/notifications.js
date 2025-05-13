import express from "express";
import { isLoggedIn } from "../middleware.js";
import notificationsController from "../controllers/users/notifications.js";

const router = express.Router();

// Get all notifications for the current user
router.get("/", isLoggedIn, (req, res, next) => {
	console.log("Notifications API route called with method:", req.method);
	console.log("Headers:", req.headers);
	console.log("Is XHR:", req.xhr);
	console.log("Is AJAX:", req.headers["x-requested-with"] === "XMLHttpRequest");

	// Continue with controller if it's an API request
	if (req.xhr || req.headers["x-requested-with"] === "XMLHttpRequest") {
		return notificationsController.getUserNotifications(req, res, next);
	}

	// If it's a browser navigation (not AJAX), redirect to dashboard
	console.log("Not an API call - redirecting to dashboard");
	return res.redirect("/dashboard");
});

// Mark a notification as read
router.put("/:id/read", isLoggedIn, notificationsController.markAsRead);

// Mark all notifications as read
router.put("/read-all", isLoggedIn, notificationsController.markAllAsRead);

export default router;
