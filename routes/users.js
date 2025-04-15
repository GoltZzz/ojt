import express from "express";
import passport from "passport";
import users from "../controllers/users/users.js";
import catchAsync from "../utils/catchAsync.js";
import { isLoggedIn, redirectIfUsersExist } from "../middleware.js";
import { validateUser, handleValidationErrors } from "../utils/sanitize.js";
import { upload } from "../utils/cloudinary.js";
const router = express.Router();

router
	.route("/register")
	.get(catchAsync(redirectIfUsersExist), catchAsync(users.renderRegister))
	.post(
		catchAsync(redirectIfUsersExist),
		upload.single("profileImage"),
		validateUser,
		handleValidationErrors,
		catchAsync(users.createUser)
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
export default router;
