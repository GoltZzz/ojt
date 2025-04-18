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
        weekStartDate: {
            type: Date,
            required: true,
        },
        weekEndDate: {
            type: Date,
            required: true,
        },
        progressSummary: {
            type: String,
            required: true,
        },
        tasksCompleted: [
            {
                taskName: String,
                description: String,
                completionDate: Date,
                status: {
                    type: String,
                    enum: ["completed", "in-progress", "pending"],
                    default: "completed"
                }
            }
        ],
        challengesFaced: {
            type: String,
        },
        lessonsLearned: {
            type: String,
        },
        goalsForNextWeek: {
            type: String,
        },
        supervisorFeedback: {
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
    },
    { timestamps: true }
);

export default mongoose.model("WeeklyProgressReport", WeeklyProgressReportSchema);
