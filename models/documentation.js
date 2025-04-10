import mongoose from "mongoose";
const Schema = mongoose.Schema;

const documentationSchema = new Schema({
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	dateCreated: {
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
	lastUpdated: {
		type: Date,
		default: Date.now,
	},
});

export default mongoose.model("Documentation", documentationSchema);
