import express from "express";
import { isLoggedIn, isAdmin } from "../../middleware.js";
import User from "../../models/users.js";
import { escapeRegex } from "../../utils/sanitize.js";

const router = express.Router();

// API route to check if username exists
router.get("/check-username", isLoggedIn, isAdmin, async (req, res) => {
	try {
		let { username } = req.query;
		if (!username) {
			return res.status(400).json({ error: "Username is required" });
		}

		// Sanitize and escape the username
		username = username.trim();

		// Use exact match for username
		const existingUser = await User.findOne({ username });
		return res.json({ exists: !!existingUser });
	} catch (error) {
		console.error("Error checking username:", error);
		return res.status(500).json({ error: "Server error" });
	}
});

export default router;
