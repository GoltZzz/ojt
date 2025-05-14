import express from "express";
import passport from "passport";
import users from "../controllers/users/users.js";
import catchAsync from "../utils/catchAsync.js";
import { isLoggedIn, redirectIfUsersExist } from "../middleware.js";
import multer from "multer";
import { upload, cloudinary } from "../utils/cloudinary.js";
import User from "../models/users.js";

const router = express.Router();
const uploadExcel = multer({ dest: "uploads/" });

router
	.route("/register")
	.get(redirectIfUsersExist, (req, res) => {
		res.render("forms/register");
	})
	.post(
		upload.single("profileImage"),
		catchAsync(async (req, res) => {
			try {
				const { username, password, firstName, middleName, lastName } =
					req.body;

				// Check if this is the first user
				const userCount = await User.countDocuments({});

				const user = new User({
					username,
					firstName,
					middleName,
					lastName,
					// If no users exist, make this user an admin
					role: userCount === 0 ? "admin" : "user",
				});

				if (req.file) {
					user.profileImage = {
						url: req.file.path,
						publicId: req.file.filename,
					};
				}

				const registeredUser = await User.register(user, password);
				req.login(registeredUser, (err) => {
					if (err) return next(err);
					const welcomeMessage =
						userCount === 0
							? "Welcome Admin! Your account has been created with administrator privileges"
							: "Welcome! Your account has been created";
					req.flash("success", welcomeMessage);
					res.redirect(
						registeredUser.role === "admin"
							? "/admin/weekly-summary"
							: "/dashboard"
					);
				});
			} catch (error) {
				if (req.file) {
					await cloudinary.uploader.destroy(req.file.filename);
				}
				req.flash("error", error.message);
				res.redirect("/register");
			}
		})
	);

router
	.route("/login")
	.get(users.renderLogin)
	.post(
		passport.authenticate("local", {
			failureFlash: true,
			failureRedirect: "/login",
			keepSessionInfo: true,
		}),
		users.login
	);
router.get("/logout", isLoggedIn, catchAsync(users.logout));

// Bulk register students via Excel upload
router.post(
	"/bulk-register",
	isLoggedIn, // Only allow logged-in users (e.g., admin)
	uploadExcel.single("excel"),
	catchAsync(users.bulkRegister)
);

export default router;
