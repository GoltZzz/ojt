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
	hoursWorked: {
		type: Number,
		required: true,
		min: 0,
	},
	description: {
		type: String,
		required: true,
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
});

export default mongoose.model("TimeReport", timeReportSchema);
