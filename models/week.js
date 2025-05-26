import mongoose from "mongoose";
const Schema = mongoose.Schema;

const weekSchema = new Schema({
	weekNumber: { type: Number, required: true, unique: true },
	weekStartDate: { type: Date, required: true },
	weekEndDate: { type: Date, required: true },
	createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Week", weekSchema);
