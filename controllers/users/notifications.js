import catchAsync from "../../utils/catchAsync.js";
import Notification from "../../models/notification.js";

// Get all notifications for the current user
export const getUserNotifications = catchAsync(async (req, res) => {
    const notifications = await Notification.find({ 
        recipient: req.user._id,
        isRead: false
    })
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json(notifications);
});

// Mark a notification as read
export const markAsRead = catchAsync(async (req, res) => {
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
    
    res.json({ success: true });
});

// Mark all notifications as read
export const markAllAsRead = catchAsync(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );
    
    res.json({ success: true });
});

export default {
    getUserNotifications,
    markAsRead,
    markAllAsRead
};
