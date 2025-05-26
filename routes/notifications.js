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

	// Always set the content type for this route
	res.setHeader("Content-Type", "application/json");

	// Check if user is authenticated again (double-check)
	if (!req.isAuthenticated()) {
		console.log("User not authenticated in notifications route");
		return res.status(401).json({ error: "Authentication required" });
	}

	if (isApiRequest) {
		// Process the API request
		return notificationsController.getUserNotifications(req, res, next);
	}

	// If it's a browser navigation (not AJAX), redirect to dashboard
	console.log("Not an API call - redirecting to dashboard");
	res.setHeader("Content-Type", "text/html"); // Reset content type for redirect
	return res.redirect("/dashboard");
});

// Mark a notification as read
router.put("/:id/read", isLoggedIn, (req, res, next) => {
	// Set content type
	res.setHeader("Content-Type", "application/json");
	return notificationsController.markAsRead(req, res, next);
});

// Mark all notifications as read
router.put("/read-all", isLoggedIn, (req, res, next) => {
	// Set content type
	res.setHeader("Content-Type", "application/json");
	return notificationsController.markAllAsRead(req, res, next);
});

export default router;
