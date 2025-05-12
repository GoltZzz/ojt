import mongoose from "mongoose";
const Schema = mongoose.Schema;

const timeReportSchema = new Schema({
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	date: {
		type: Date,
		required: true,
	},
	weekId: {
		type: Schema.Types.ObjectId,
		ref: "Week",
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
	studentName: {
		type: String,
		required: true,
	},
	internshipSite: {
		type: String,
		required: true,
	},
	hoursWorked: {
		type: Number,
		min: 0,
		required: false,
	},
	description: {
		type: String,
		required: false,
	},
	dateSubmitted: {
		type: Date,
		default: Date.now,
	},
	archived: {
		type: Boolean,
		default: false,
	},
	archivedReason: {
		type: String,
		default: "",
	},
	excelFile: {
		filename: String,
		originalName: String,
		path: String,
		uploadDate: {
			type: Date,
			default: Date.now,
		},
	},
});

export default mongoose.model("TimeReport", timeReportSchema);
