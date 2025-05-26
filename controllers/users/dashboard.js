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

		// Count active reports for the user (since all are approved by default)
		const pendingWeeklyReportsCount = await WeeklyReport.countDocuments({
			author: req.user._id,
			archived: false,
		});

		// TimeReports don't have pending status anymore
		const pendingTimeReportsCount = 0;

		// Calculate total pending reports
		const pendingReportsCount =
			pendingWeeklyReportsCount + pendingTimeReportsCount;

		// Get latest weekly reports
		const latestWeeklyReports = await WeeklyReport.find({
			author: req.user._id,
			archived: false,
		})
			.sort({ dateSubmitted: -1 })
			.limit(2);

		// Get latest time reports
		const latestTimeReports = await TimeReport.find({
			author: req.user._id,
			archived: false,
		})
			.sort({ dateSubmitted: -1 })
			.limit(2);

		// Combine and sort all reports by date
		const allReports = [
			...latestWeeklyReports.map((report) => ({
				...report.toObject(),
				reportType: "weeklyreport",
			})),
			...latestTimeReports.map((report) => ({
				...report.toObject(),
				reportType: "timereport",
			})),
		];

		// Sort by dateSubmitted and take the latest 3
		const latestReports = allReports
			.sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted))
			.slice(0, 3);

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
