import catchAsync from "../../utils/catchAsync.js";
import User from "../../models/users.js";
import ExpressError from "../../utils/ExpressError.js";

const renderDashboard = catchAsync(async (req, res) => {
	res.render("admin/dashboard");
});

const renderUsers = catchAsync(async (req, res) => {
	res.render("admin/users");
});

const toggleUserRole = catchAsync(async (req, res) => {
	const { id } = req.params;
	const user = await User.findById(id);
	if (!user) {
		req.flash("error", "User not found");
		return res.redirect("/admin/users");
	}
	user.role = user.role === "admin" ? "user" : "admin";
	await user.save();

	req.flash("success", `${user.username}'s role updated to ${user.role}`);
	res.redirect("/admin/users");
});

export default { renderDashboard, renderUsers, toggleUserRole };
