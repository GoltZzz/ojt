import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema({
	firstName: {
		type: String,
		required: true,
	},
	middleName: { type: String, required: false },

	lastName: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
		unique: true,
	},
	role: {
		type: String,
		enum: ["admin", "user"],
		default: "user",
	},
});

userSchema.plugin(passportLocalMongoose);
export default mongoose.model("User", userSchema);
