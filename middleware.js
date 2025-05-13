import User from "./models/users.js";
import WeeklyReport from "./models/weeklyReports.js";
import TimeReport from "./models/timeReport.js";
import ExpressError from "./utils/ExpressError.js";

export const isLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		console.log("User not authenticated, setting returnTo:", req.originalUrl);
		req.session.returnTo = req.originalUrl;
		req.flash("error", "You must be signed in!");
		return res.redirect("/login");
	}
	next();
};

export const isAdmin = async (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		return next();
	}
	req.flash("error", "You are not authorized to view this page!");
	return res.redirect("/");
};

export const isAuthor = async (req, res, next) => {
	const { id } = req.params;
	const report = await WeeklyReport.findById(id);
	if (!report) {
		req.flash("error", "Could not find that report!");
		return res.redirect("/weeklyreport");
	}
	if (!report.author.equals(req.user._id)) {
		req.flash("error", "You are not authorized to do that!");
		return res.redirect(`/weeklyreport/${id}`);
	}
	next();
};

export const isTimeReportAuthor = async (req, res, next) => {
	try {
		const { id } = req.params;
		const timeReport = await TimeReport.findById(id);

		if (!timeReport) {
			req.flash("error", "Could not find that time report!");
			return res.redirect("/timereport");
		}

		if (!timeReport.author.equals(req.user._id)) {
			req.flash("error", "You are not authorized to modify this time report!");
			return res.redirect(`/timereport/${id}`);
		}

		// Add timeReport to request for use in subsequent middleware/routes
		req.timeReport = timeReport;
		next();
	} catch (error) {
		return next(new ExpressError("Authorization error", 403));
	}
};

// For adding required permission
export const hasPermission = (permission) => {
	return (req, res, next) => {
		if (!req.user || !req.user.permissions) {
			req.flash("error", "You don't have the required permissions!");
			return res.redirect("/dashboard");
		}

		if (
			req.user.permissions.includes(permission) ||
			req.user.role === "admin"
		) {
			return next();
		}

		req.flash("error", "You don't have the required permissions!");
		return res.redirect("/dashboard");
	};
};

export const addCurrentUrl = (req, res, next) => {
	const pathSegments = req.path.split("/").filter((segment) => segment);
	res.locals.currentPath = pathSegments;
	next();
};

export const redirectIfUsersExist = async (req, res, next) => {
	try {
		const userCount = await User.countDocuments({});
		if (userCount > 0) {
			req.flash(
				"info",
				"Registration is closed. Please login with an existing account."
			);
			return res.redirect("/login");
		}
		next();
	} catch (error) {
		console.error("Error checking user count:", error);
		next(error);
	}
};
