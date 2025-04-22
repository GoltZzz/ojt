import mongoose from "mongoose";
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
	recipient: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	message: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		enum: ["success", "info", "warning", "danger"],
		default: "info",
	},
	reportType: {
		type: String,
		enum: [
			"weeklyreport",
			"weeklyprogress",
			"trainingschedule",
			"learningoutcomes",
			"dailyattendance",
			"documentation",
			"timereport",
		],
		required: true,
	},
	reportId: {
		type: Schema.Types.ObjectId,
		required: true,
	},
	action: {
		type: String,
		enum: ["approved", "rejected", "archived", "unarchived", "revised"],
		required: true,
	},
	isRead: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 2592000, // 30 days in seconds
	},
});

export default mongoose.model("Notification", notificationSchema);
