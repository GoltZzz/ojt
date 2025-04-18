import mongoose from "mongoose";
const Schema = mongoose.Schema;

const TrainingScheduleSchema = new Schema(
    {
        studentName: {
            type: String,
            required: true,
        },
        internshipSite: {
            type: String,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        trainingObjectives: {
            type: String,
            required: true,
        },
        scheduleItems: [
            {
                week: Number,
                startDate: Date,
                endDate: Date,
                activities: String,
                deliverables: String,
                supervisorName: String
            }
        ],
        additionalNotes: {
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

export default mongoose.model("TrainingSchedule", TrainingScheduleSchema);
