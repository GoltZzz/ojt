import catchAsync from "../../utils/catchAsync.js";
import User from "../../models/users.js";
import WeeklyReport from "../../models/weeklyReports.js";
import TimeReport from "../../models/timeReport.js";
import passport from "passport";

const verifySelfDelete = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { password } = req.body;

	// Check if the user is trying to delete their own account
	if (id !== req.user._id.toString()) {
		req.flash(
			"error",
			"You can only delete your own account with password verification"
		);
		return res.redirect("/admin/users");
	}

	// Verify the password
	const user = await User.findById(id);
	if (!user) {
		req.flash("error", "User not found");
		return res.redirect("/admin/users");
	}

	// Use passport-local-mongoose's authenticate method to verify the password
	user.authenticate(password, async (err, authenticatedUser, passwordError) => {
		if (err) {
			console.error("Authentication error:", err);
			req.flash("error", "An error occurred during authentication");
			return res.redirect("/admin/users");
		}

		if (!authenticatedUser) {
			req.flash("error", "Incorrect password");
			return res.redirect("/admin/users");
		}

		// Password is correct, proceed with account deletion

		// Archive all user's reports
		await WeeklyReport.updateMany(
			{ author: user._id },
			{ archived: true, archivedReason: "User deleted their account" }
		);

		await TimeReport.updateMany(
			{ author: user._id },
			{ archived: true, archivedReason: "User deleted their account" }
		);

		// Delete the user
		await User.findByIdAndDelete(id);

		// Log the user out
		req.logout(function (err) {
			if (err) {
				console.error("Logout error:", err);
				req.flash("error", "An error occurred during logout");
				return res.redirect("/admin/users");
			}

			req.flash("success", "Your account has been deleted successfully");
			res.redirect("/");
		});
	});
});

export default {
	verifySelfDelete,
};
