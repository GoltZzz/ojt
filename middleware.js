import ExpressError from "./utils/ExpressError.js";
export const isLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		req.flash("error", "You must be signed in first!");
		return res.redirect("/login");
	}
	next();
};
export const addCurrentUrl = (req, res, next) => {
	const pathSegments = req.path.split("/").filter((segment) => segment);
	res.locals.currentPath = pathSegments;
	next();
};
