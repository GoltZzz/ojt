import catchAsync from "../../utils/catchAsync.js";
import Notification from "../../models/notification.js";

// Get all notifications for the current user
export const getUserNotifications = catchAsync(async (req, res) => {
	try {
		// Set content type explicitly
		res.setHeader("Content-Type", "application/json");

		// Check if user is authenticated
		if (!req.user || !req.user._id) {
			console.log("User not authenticated in notifications controller");
			return res.status(401).json({ error: "Authentication required" });
		}

		const notifications = await Notification.find({
			recipient: req.user._id,
			isRead: false,
		})
			.sort({ createdAt: -1 })
			.limit(10);

		return res.json(notifications);
	} catch (error) {
		console.error("Error in getUserNotifications:", error);
		return res.status(500).json({ error: "Failed to fetch notifications" });
	}
});

// Mark a notification as read
export const markAsRead = catchAsync(async (req, res) => {
	try {
		// Set content type explicitly
		res.setHeader("Content-Type", "application/json");

		const { id } = req.params;

		const notification = await Notification.findById(id);

		if (!notification) {
			return res.status(404).json({ error: "Notification not found" });
		}

		// Ensure the notification belongs to the current user
		if (!notification.recipient.equals(req.user._id)) {
			return res.status(403).json({ error: "Not authorized" });
		}

		notification.isRead = true;
		await notification.save();

		return res.json({ success: true });
	} catch (error) {
		console.error("Error in markAsRead:", error);
		return res
			.status(500)
			.json({ error: "Failed to mark notification as read" });
	}
});

// Mark all notifications as read
export const markAllAsRead = catchAsync(async (req, res) => {
	try {
		// Set content type explicitly
		res.setHeader("Content-Type", "application/json");

		await Notification.updateMany(
			{ recipient: req.user._id, isRead: false },
			{ isRead: true }
		);

		return res.json({ success: true });
	} catch (error) {
		console.error("Error in markAllAsRead:", error);
		return res
			.status(500)
			.json({ error: "Failed to mark all notifications as read" });
	}
});

export default {
	getUserNotifications,
	markAsRead,
	markAllAsRead,
};
