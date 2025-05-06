import express from "express";
import passport from "passport";
import users from "../controllers/users/users.js";
import catchAsync from "../utils/catchAsync.js";
import { isLoggedIn } from "../middleware.js";
import multer from "multer";

const router = express.Router();
const uploadExcel = multer({ dest: "uploads/" });

// Removed /register route

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
