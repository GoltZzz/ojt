import mongoose from "mongoose";
const Schema = mongoose.Schema;

const DailyAttendanceSchema = new Schema(
    {
        studentName: {
            type: String,
            required: true,
        },
        internshipSite: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        timeIn: {
            morning: {
                type: String,
                default: "N/A",
            },
            afternoon: {
                type: String,
                default: "N/A",
            },
        },
        timeOut: {
            morning: {
                type: String,
                default: "N/A",
            },
            afternoon: {
                type: String,
                default: "N/A",
            },
        },
        totalHours: {
            type: Number,
            default: 0,
        },
        accomplishments: {
            type: String,
            required: true,
        },
        supervisorName: {
            type: String,
            required: true,
        },
        supervisorVerification: {
            type: Boolean,
            default: false,
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

export default mongoose.model("DailyAttendance", DailyAttendanceSchema);
