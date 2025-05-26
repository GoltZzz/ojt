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
	internshipSite: {
		type: String,
		required: false,
	},
	course: {
		type: String,
		required: false,
	},
	profileImage: {
		url: {
			type: String,
			default:
				"https://res.cloudinary.com/dp3zv0db3/image/upload/v1715000000/ojt-profiles/default-profile_rvpzjh.png",
		},
		publicId: {
			type: String,
			default: "",
		},
	},
});

userSchema.plugin(passportLocalMongoose);
export default mongoose.model("User", userSchema);
