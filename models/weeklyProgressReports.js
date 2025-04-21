import mongoose from "mongoose";
const Schema = mongoose.Schema;

const WeeklyProgressReportSchema = new Schema(
	{
		studentName: {
			type: String,
			required: true,
		},
		internshipSite: {
			type: String,
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
		dutiesPerformed: {
			type: String,
			required: true,
		},
		newTrainings: {
			type: String,
			required: true,
		},
		accomplishments: [
			{
				proposedActivity: String,
				accomplishmentDetails: String,
			},
		],
		problemsEncountered: {
			type: String,
		},
		problemSolutions: {
			type: String,
		},
		goalsForNextWeek: {
			type: String,
			required: true,
		},
		supervisorName: {
			type: String,
			required: true,
		},
		supervisorRole: {
			type: String,
			required: true,
		},
		supervisorSignature: {
			type: String,
		},
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
		hasBeenExported: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

export default mongoose.model(
	"WeeklyProgressReport",
	WeeklyProgressReportSchema
);
