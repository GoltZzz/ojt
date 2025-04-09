// Middleware for authentication and authorization
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

export const hasAccess = () => {
	return (req, res, next) => {
		if (req.user && req.user.role === "admin") {
			return next();
		}
		const userAllowedFeatures = ["WeeklyReport", "Documentation", "TimeReport"];
		const requestedFeature = req.path.split("/")[1];
		if (userAllowedFeatures.includes(requestedFeature)) {
			return next();
		}
		req.flash("error", "You don't have permission to access that feature!");
		return res.redirect("/dashboard");
	};
};

export const addCurrentUrl = (req, res, next) => {
	const pathSegments = req.path.split("/").filter((segment) => segment);
	res.locals.currentPath = pathSegments;
	next();
};
