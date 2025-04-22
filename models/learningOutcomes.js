import mongoose from "mongoose";
const Schema = mongoose.Schema;

const OutcomeEntrySchema = new Schema(
	{
		date: {
			type: Date,
			required: true,
			default: Date.now,
		},
		activity: {
			type: String,
			required: true,
		},
		learningOutcome: {
			type: String,
			required: true,
		},
	},
	{ _id: true }
);

const LearningOutcomeSchema = new Schema(
	{
		studentName: {
			type: String,
			required: true,
		},
		entries: [OutcomeEntrySchema],
		status: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending",
		},
		adminComments: {
			type: String,
		},
		approvedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		author: {
			type: Schema.Types.ObjectId,
			ref: "User",
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
		},
		needsRevision: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

export default mongoose.model("LearningOutcome", LearningOutcomeSchema);
