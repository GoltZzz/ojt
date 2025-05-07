import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import TimeReport from "../../models/timeReport.js";
import Notification from "../../models/notification.js";

// Get pending reports for all report types
export const getPendingReports = catchAsync(async (req, res) => {
	// Get pending reports for each type
	const pendingWeeklyReports = await WeeklyReport.find({
		status: "pending",
		archived: false,
	})
		.populate("author", "username firstName middleName lastName")
		.sort({ dateSubmitted: -1 });

	const pendingTimeReports = await TimeReport.find({
		status: "pending",
		archived: false,
	})
		.populate("author", "username firstName middleName lastName")
		.sort({ dateSubmitted: -1 });

	// Format all pending reports
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

	const formattedWeeklyReports = formatReports(pendingWeeklyReports);
	const formattedTimeReports = formatReports(pendingTimeReports);

	// Combine all pending reports for display
	const pendingReports = {
		weeklyReports: formattedWeeklyReports,
		timeReports: formattedTimeReports,
	};

	res.render("admin/pending-reports", { pendingReports });
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

// Approve a report
export const approveReport = catchAsync(async (req, res) => {
	const { id, type } = req.params;
	const { adminComments } = req.body;

	const Model = getModelForType(type);
	const report = await Model.findById(id).populate("author");

	if (!report) {
		req.flash("error", "Report not found");
		return res.redirect("/admin/pending-reports");
	}

	report.status = "approved";
	report.approvedBy = req.user._id;
	report.adminComments = adminComments;
	report.dateApproved = new Date();
	await report.save();

	// Create notification for the report author
	if (report.author) {
		const notification = new Notification({
			recipient: report.author._id,
			message: `Your ${getReportTypeName(type)} has been approved.`,
			type: "success",
			reportType: type,
			reportId: report._id,
			action: "approved",
		});
		await notification.save();
	}

	req.flash("success", "Report has been approved successfully");
	res.redirect("/admin/pending-reports");
});

// Reject a report
export const rejectReport = catchAsync(async (req, res) => {
	const { id, type } = req.params;
	const { adminComments } = req.body;

	const Model = getModelForType(type);
	const report = await Model.findById(id).populate("author");

	if (!report) {
		req.flash("error", "Report not found");
		return res.redirect("/admin/pending-reports");
	}

	report.status = "rejected";
	report.approvedBy = req.user._id;
	report.adminComments = adminComments;
	await report.save();

	// Create notification for the report author
	if (report.author) {
		const notification = new Notification({
			recipient: report.author._id,
			message: `Your ${getReportTypeName(type)} has been rejected.`,
			type: "error",
			reportType: type,
			reportId: report._id,
			action: "rejected",
		});
		await notification.save();
	}

	req.flash("success", "Report has been rejected successfully");
	res.redirect("/admin/pending-reports");
});

export default {
	getPendingReports,
	approveReport,
	rejectReport,
	getReportTypeName,
};
