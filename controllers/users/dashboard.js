import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import TimeReport from "../../models/timeReport.js";

const renderDashboard = catchAsync(async (req, res) => {
	// Only fetch stats if user is logged in
	if (req.user) {
		// Count user's reports
		const weeklyReportsCount = await WeeklyReport.countDocuments({
			author: req.user._id,
			archived: false,
		});

		const timeReportsCount = await TimeReport.countDocuments({
			author: req.user._id,
			archived: false,
		});

		// Count pending reports
		const pendingWeeklyReportsCount = await WeeklyReport.countDocuments({
			author: req.user._id,
			status: "pending",
			archived: false,
		});

		const pendingTimeReportsCount = await TimeReport.countDocuments({
			author: req.user._id,
			status: "pending",
			archived: false,
		});

		// Calculate total pending reports
		const pendingReportsCount =
			pendingWeeklyReportsCount + pendingTimeReportsCount;

		// Get latest reports
		const latestReports = await WeeklyReport.find({
			author: req.user._id,
			archived: false,
		})
			.sort({ dateSubmitted: -1 })
			.limit(3);

		// Render dashboard with stats
		res.render("contents/dashboard", {
			userStats: {
				weeklyReports: weeklyReportsCount,
				timeReports: timeReportsCount,
				pendingReports: pendingReportsCount,
			},
			latestReports,
		});
	} else {
		res.render("contents/dashboard");
	}
});

export default {
	renderDashboard,
};
