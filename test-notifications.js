import mongoose from "mongoose";
import Notification from "./models/notification.js";

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/ojt")
  .then(() => {
    console.log("MONGO Connection Open!!!");
    checkNotifications();
  })
  .catch((err) => {
    console.log("OH NO MONGO CONNECTION ERROR!!!");
    console.log(err);
  });

async function checkNotifications() {
  try {
    // Count all notifications
    const totalCount = await Notification.countDocuments();
    console.log(`Total notifications in database: ${totalCount}`);
    
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({ isRead: false });
    console.log(`Unread notifications: ${unreadCount}`);
    
    // Get a sample of notifications
    const notifications = await Notification.find().limit(5);
    console.log("Sample notifications:");
    console.log(JSON.stringify(notifications, null, 2));
    
    mongoose.connection.close();
  } catch (error) {
    console.error("Error checking notifications:", error);
    mongoose.connection.close();
  }
}
