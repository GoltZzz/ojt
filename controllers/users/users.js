import User from "../../models/users.js";
import { cloudinary } from "../../utils/cloudinary.js";

const renderRegister = async (_, res) => {
	res.render("forms/register");
};

const createUser = async (req, res, next) => {
	try {
		const { username, password } = req.body;
		const user = new User(req.body);

		// Handle profile image if uploaded
		if (req.file) {
			user.profileImage = {
				url: req.file.path,
				publicId: req.file.filename,
			};
		}

		const userCount = await User.countDocuments({});
		if (userCount === 0) {
			user.role = "admin";
		}

		const registeredUser = await User.register(user, password);
		await registeredUser.save();
		req.flash("success", `Welcome ${username} to OJT`);
		return res.redirect("/login");
	} catch (error) {
		// If there was an error and we uploaded an image, delete it from Cloudinary
		if (req.file && req.file.path) {
			await cloudinary.uploader.destroy(req.file.filename);
		}
		req.flash("error", error.message);
		return res.redirect("/register");
	}
};

const renderLogin = async (_, res) => {
	res.render("forms/login");
};

const login = async (req, res, next) => {
	try {
		let redirectUrl = req.session.returnTo || "/dashboard";

		if (req.user && req.user.role === "admin") {
			if (redirectUrl === "/dashboard") {
				redirectUrl = "/admin";
			}
		}

		delete req.session.returnTo;
		req.flash("success", "Logged in successfully!");
		console.log(`🔄 Redirecting to: ${redirectUrl}`);
		res.redirect(redirectUrl);
	} catch (error) {
		return next(error);
	}
};

const logout = async (req, res, next) => {
	req.logout(function (err) {
		if (err) return next(err);
		req.flash("success", "Logged out successfully!");
		res.redirect("/");
	});
};

export default { renderRegister, createUser, renderLogin, login, logout };
