import mongoose from "mongoose";
const Schema = mongoose.Schema;

const LearningOutcomeSchema = new Schema(
    {
        studentName: {
            type: String,
            required: true,
        },
        internshipSite: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        competencies: [
            {
                name: String,
                description: String,
                evidenceOfAchievement: String,
                selfAssessment: {
                    type: String,
                    enum: ["excellent", "good", "satisfactory", "needs improvement"],
                    default: "satisfactory"
                }
            }
        ],
        reflectionSummary: {
            type: String,
            required: true,
        },
        futureApplications: {
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

export default mongoose.model("LearningOutcome", LearningOutcomeSchema);
