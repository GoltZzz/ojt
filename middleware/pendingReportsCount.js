import WeeklyReport from "../models/weeklyReports.js";
import TimeReport from "../models/timeReport.js";

// Middleware to count pending reports for admin users
const pendingReportsCount = async (req, res, next) => {
	try {
		// We no longer have pending reports, but we'll keep the middleware
		// to avoid breaking existing code that expects this value
		// Set the count to 0
		res.locals.pendingReportsCount = 0;
		next();
	} catch (error) {
		console.error("Error counting pending reports:", error);
		// Default to 0 if there's an error
		res.locals.pendingReportsCount = 0;
		next();
	}
};

export default pendingReportsCount;
