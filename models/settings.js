import mongoose from "mongoose";
const Schema = mongoose.Schema;

const settingsSchema = new Schema({
	weeklyLoopActive: { type: Boolean, default: false },
	// Add other global settings here as needed
});

export default mongoose.model("Settings", settingsSchema);
