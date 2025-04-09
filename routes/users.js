import express from "express";
import passport from "passport";
import users from "../controllers/users/users.js";
import catchAsync from "../utils/catchAsync.js";
import { isLoggedIn } from "../middleware.js";
const router = express.Router();

router
	.route("/register")
	.get(catchAsync(users.renderRegister))
	.post(catchAsync(users.createUser));
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
