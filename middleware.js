import User from "./models/users.js";
export const isLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		req.flash("error", "You must be signed in first!");
		return res.redirect("/login");
	}
	next();
};

export const isAdmin = (req, res, next) => {
	if (!req.user || req.user.role !== "admin") {
		req.flash("error", "You don't have permission to do that!");
		return res.redirect("/dashboard");
	}
	next();
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
