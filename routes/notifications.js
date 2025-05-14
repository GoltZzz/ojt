import express from "express";
import { isLoggedIn } from "../middleware.js";
import notificationsController from "../controllers/users/notifications.js";

const router = express.Router();

// Get all notifications for the current user
router.get("/", isLoggedIn, (req, res, next) => {
	console.log("Notifications API route called with method:", req.method);

	// Check if it's an API request (XHR or has the appropriate header)
	const isApiRequest =
		req.xhr ||
		req.headers["x-requested-with"] === "XMLHttpRequest" ||
		req.headers["accept"]?.includes("application/json");

	console.log("Is API request:", isApiRequest);

	if (isApiRequest) {
		// Set the proper content type for JSON responses
		res.setHeader("Content-Type", "application/json");
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
