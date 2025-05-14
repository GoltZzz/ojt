import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import TimeReport from "../../models/timeReport.js";
import Notification from "../../models/notification.js";

// Get all reports
export const getReports = catchAsync(async (req, res) => {
	// Get reports of each type
	const weeklyReports = await WeeklyReport.find({
		archived: false,
	})
		.populate("author", "username firstName middleName lastName")
		.sort({ dateSubmitted: -1 });

	const timeReports = await TimeReport.find({
		archived: false,
	})
		.populate("author", "username firstName middleName lastName")
		.sort({ dateSubmitted: -1 });

	// Format all reports
	const formatReports = (reports) => {
		return reports.map((report) => {
			if (report.author) {
				let fullName = report.author.firstName;
				if (report.author.middleName && report.author.middleName.length > 0) {
					const middleInitial = report.author.middleName
						.charAt(0)
						.toUpperCase();
					fullName += ` ${middleInitial}.`;
				}
				fullName += ` ${report.author.lastName}`;
				report.authorFullName = fullName;
			}
			return report;
		});
	};

	const formattedWeeklyReports = formatReports(weeklyReports);
	const formattedTimeReports = formatReports(timeReports);

	// Combine all reports for display
	const reports = {
		weeklyReports: formattedWeeklyReports,
		timeReports: formattedTimeReports,
	};

	res.render("admin/reports", { pendingReports: reports });
});

// Helper function to get report type name
export const getReportTypeName = (type) => {
	switch (type) {
		case "weeklyreport":
			return "Weekly Report";
		case "timereport":
			return "Time Report";
		default:
			return "Report";
	}
};

// Helper function to get appropriate model
const getModelForType = (type) => {
	switch (type) {
		case "weeklyreport":
			return WeeklyReport;
		case "timereport":
			return TimeReport;
		default:
			throw new Error("Invalid report type");
	}
};

export default {
	getReports,
	getReportTypeName,
};
