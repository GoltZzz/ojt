import WeeklyReport from "../models/weeklyReports.js";
import TimeReport from "../models/timeReport.js";

// Middleware to count pending reports for admin users
const pendingReportsCount = async (req, res, next) => {
	try {
		// Only count pending reports for admin users
		if (req.user && req.user.role === "admin") {
			// Count pending reports from all report types that are not archived
			const pendingWeeklyReports = await WeeklyReport.countDocuments({
				status: "pending",
				archived: false,
			});

			const pendingTimeReports = await TimeReport.countDocuments({
				status: "pending",
				archived: false,
			});

			// Calculate total pending reports
			const totalPendingCount = pendingWeeklyReports + pendingTimeReports;

			// Add the counts to res.locals so they're available in all templates
			res.locals.pendingReportsCount = totalPendingCount;
			res.locals.pendingReportDetails = {
				weeklyReports: pendingWeeklyReports,
				timeReports: pendingTimeReports,
			};
		} else {
			// Set to 0 for non-admin users
			res.locals.pendingReportsCount = 0;
			res.locals.pendingReportDetails = {
				weeklyReports: 0,
				timeReports: 0,
			};
		}
		next();
	} catch (error) {
		console.error("Error counting pending reports:", error);
		// Don't fail the request if counting fails
		res.locals.pendingReportsCount = 0;
		res.locals.pendingReportDetails = {
			weeklyReports: 0,
			timeReports: 0,
		};
		next();
	}
};

export default pendingReportsCount;
