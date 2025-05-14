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
		required: true,
	},
	studentName: {
		type: String,
		required: true,
	},
	internshipSite: {
		type: String,
		required: true,
	},
	weekId: {
		type: Schema.Types.ObjectId,
		ref: "Week",
		required: true,
	},
	weekNumber: {
		type: Number,
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
	supervisorSignature: String,
	studentSignature: String,
	dateSubmitted: {
		type: Date,
		default: Date.now,
	},
	status: {
		type: String,
		enum: ["approved"],
		default: "approved",
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
	pdfFile: {
		filename: String,
		path: String,
		mimetype: String,
		size: Number,
		generatedFrom: String,
	},
});

// Create a compound index to enforce one report per author per week
weeklyReportSchema.index({ author: 1, weekNumber: 1 }, { unique: true });

export default mongoose.model("WeeklyReport", weeklyReportSchema);
