import mongoose from "mongoose";
const Schema = mongoose.Schema;

const dailyRecordSchema = new Schema({
	date: {
		type: Date,
	},
	timeIn: {
		morning: String,
		afternoon: String,
	},
	timeOut: {
		morning: String,
		afternoon: String,
	},
	accomplishments: {
		type: String,
	},
});

const weeklyReportSchema = new Schema({
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
	studentName: {
		type: String,
		required: true,
	},
	internshipSite: {
		type: String,
		required: true,
	},
	weekStartDate: {
		type: Date,
		required: true,
	},
	weekEndDate: {
		type: Date,
		required: true,
	},
	dailyRecords: [dailyRecordSchema],
	supervisorName: {
		type: String,
		required: true,
	},
	supervisorSignature: String,
	studentSignature: String,
	dateSubmitted: {
		type: Date,
		default: Date.now,
	},
});

export default mongoose.model("WeeklyReport", weeklyReportSchema);
