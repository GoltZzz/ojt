import express from "express";
import { isLoggedIn } from "../../middleware.js";
import profileController from "../../controllers/users/profile.js";
import { validateUser, handleValidationErrors } from "../../utils/sanitize.js";
import { upload } from "../../utils/cloudinary.js";

const router = express.Router();

// Profile routes
router
	.route("/")
	.get(isLoggedIn, profileController.renderProfile)
	.post(
		isLoggedIn,
		upload.single("profileImage"),
		validateUser,
		handleValidationErrors,
		profileController.updateProfile
	);

// Change password routes
router
	.route("/change-password")
	.get(isLoggedIn, profileController.renderChangePassword)
	.post(isLoggedIn, profileController.updatePassword);

// Notification routes
router.post(
	"/notifications/:id/mark-as-read",
	isLoggedIn,
	profileController.markNotificationAsRead
);

export default router;
