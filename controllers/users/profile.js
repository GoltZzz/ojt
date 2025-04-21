import User from "../../models/users.js";
import WeeklyReport from "../../models/weeklyReports.js";
import Documentation from "../../models/documentation.js";
import TimeReport from "../../models/timeReport.js";
import WeeklyProgressReport from "../../models/weeklyProgressReports.js";
import TrainingSchedule from "../../models/trainingSchedule.js";
import LearningOutcome from "../../models/learningOutcomes.js";
import DailyAttendance from "../../models/dailyAttendance.js";
import catchAsync from "../../utils/catchAsync.js";
import { cloudinary } from "../../utils/cloudinary.js";

// Render the user profile page
const renderProfile = catchAsync(async (req, res) => {
	const user = await User.findById(req.user._id);
	if (!user) {
		req.flash("error", "User not found");
		return res.redirect("/dashboard");
	}

	// Count user's reports
	const weeklyReportsCount = await WeeklyReport.countDocuments({
		author: req.user._id,
		archived: false,
	});

	const documentationCount = await Documentation.countDocuments({
		author: req.user._id,
		archived: false,
	});

	const timeReportsCount = await TimeReport.countDocuments({
		author: req.user._id,
		archived: false,
	});

	// Count new report types
	const weeklyProgressCount = await WeeklyProgressReport.countDocuments({
		author: req.user._id,
		archived: false,
	});

	const trainingScheduleCount = await TrainingSchedule.countDocuments({
		author: req.user._id,
		archived: false,
	});

	const learningOutcomeCount = await LearningOutcome.countDocuments({
		author: req.user._id,
		archived: false,
	});

	const dailyAttendanceCount = await DailyAttendance.countDocuments({
		author: req.user._id,
		archived: false,
	});

	// Prepare report stats
	const reportStats = {
		weeklyReports: weeklyReportsCount,
		documentation: documentationCount,
		timeReports: timeReportsCount,
		weeklyProgress: weeklyProgressCount,
		trainingSchedule: trainingScheduleCount,
		learningOutcome: learningOutcomeCount,
		dailyAttendance: dailyAttendanceCount,
	};

	res.render("profile/index", { user, reportStats });
});

// Update the user profile
const updateProfile = catchAsync(async (req, res) => {
	try {
		const { firstName, middleName, lastName } = req.body;

		// Find the user and update their profile
		const user = await User.findById(req.user._id);
		if (!user) {
			req.flash("error", "User not found");
			return res.redirect("/profile");
		}

		// Update user fields
		user.firstName = firstName;
		user.middleName = middleName;
		user.lastName = lastName;

		// Handle profile image update if a new one is uploaded
		if (req.file) {
			// Delete the old image from Cloudinary if it exists
			if (user.profileImage && user.profileImage.publicId) {
				await cloudinary.uploader.destroy(user.profileImage.publicId);
			}

			// Update with the new image
			user.profileImage = {
				url: req.file.path,
				publicId: req.file.filename,
			};
		}

		await user.save();

		req.flash("success", "Profile updated successfully");
		res.redirect("/profile");
	} catch (error) {
		// If there was an error and we uploaded an image, delete it from Cloudinary
		if (req.file && req.file.path) {
			await cloudinary.uploader.destroy(req.file.filename);
		}
		req.flash(
			"error",
			error.message || "An error occurred while updating your profile"
		);
		res.redirect("/profile");
	}
});

// Render the change password page
const renderChangePassword = catchAsync(async (req, res) => {
	res.render("profile/change-password");
});

// Update the user's password
const updatePassword = catchAsync(async (req, res) => {
	const { currentPassword, newPassword, confirmPassword } = req.body;

	// Check if new password and confirm password match
	if (newPassword !== confirmPassword) {
		req.flash("error", "New passwords do not match");
		return res.redirect("/profile/change-password");
	}

	// Validate password requirements
	const isLengthValid = newPassword.length >= 8 && newPassword.length <= 16;
	const hasUppercase = /[A-Z]/.test(newPassword);
	const hasNoSpecialChars = !/[^a-zA-Z0-9]/.test(newPassword);

	if (!isLengthValid || !hasUppercase || !hasNoSpecialChars) {
		let errorMessage = "Password does not meet the requirements: ";
		if (!isLengthValid) {
			errorMessage += "must be between 8-16 characters. ";
		}
		if (!hasUppercase) {
			errorMessage += "must contain at least one uppercase letter. ";
		}
		if (!hasNoSpecialChars) {
			errorMessage += "must not contain special characters. ";
		}

		req.flash("error", errorMessage);
		return res.redirect("/profile/change-password");
	}

	// Change the password using passport-local-mongoose's method
	const user = await User.findById(req.user._id);
	await user.changePassword(currentPassword, newPassword);

	req.flash("success", "Password changed successfully");
	res.redirect("/profile");
});

export default {
	renderProfile,
	updateProfile,
	renderChangePassword,
	updatePassword,
};
