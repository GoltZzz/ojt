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
		// required: true, // Now optional for upload-only flow
	},
	internshipSite: {
		type: String,
		// required: true, // Now optional for upload-only flow
	},
	weekStartDate: {
		type: Date,
		// required: true, // Now optional for upload-only flow
	},
	weekEndDate: {
		type: Date,
		// required: true, // Now optional for upload-only flow
	},
	dailyRecords: [dailyRecordSchema],
	supervisorName: {
		type: String,
		// required: true, // Now optional for upload-only flow
	},
	supervisorSignature: String,
	studentSignature: String,
	dateSubmitted: {
		type: Date,
		default: Date.now,
	},
	status: {
		type: String,
		enum: ["pending", "approved", "rejected"],
		default: "pending",
	},
	archived: {
		type: Boolean,
		default: false,
	},
	archivedReason: {
		type: String,
		default: "",
	},
	approvedBy: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
	approvalDate: {
		type: Date,
	},
	adminComments: {
		type: String,
	},
	needsRevision: {
		type: Boolean,
		default: false,
	},
	hasBeenExported: {
		type: Boolean,
		default: false,
	},
	file: {
		filename: String,
		path: String,
		mimetype: String,
		size: Number,
	},
	photos: [
		{
			filename: String,
			path: String,
			mimetype: String,
			size: Number,
		},
	],
	docxFile: {
		filename: String,
		path: String,
		mimetype: String,
		size: Number,
	},
});

export default mongoose.model("WeeklyReport", weeklyReportSchema);
