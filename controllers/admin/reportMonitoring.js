import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import WeeklyProgressReport from "../../models/weeklyProgressReports.js";
import TrainingSchedule from "../../models/trainingSchedule.js";
import LearningOutcome from "../../models/learningOutcomes.js";
import DailyAttendance from "../../models/dailyAttendance.js";
import Notification from "../../models/notification.js";

// Get pending reports for all report types
export const getPendingReports = catchAsync(async (req, res) => {
	// Get pending reports for each type
	const pendingWeeklyProgress = await WeeklyProgressReport.find({
		status: "pending",
		archived: false,
	})
		.populate("author", "username firstName middleName lastName")
		.sort({ dateSubmitted: -1 });

	const pendingTrainingSchedules = await TrainingSchedule.find({
		status: "pending",
		archived: false,
	})
		.populate("author", "username firstName middleName lastName")
		.sort({ dateSubmitted: -1 });

	const pendingLearningOutcomes = await LearningOutcome.find({
		status: "pending",
		archived: false,
	})
		.populate("author", "username firstName middleName lastName")
		.sort({ dateSubmitted: -1 });

	const pendingDailyAttendances = await DailyAttendance.find({
		status: "pending",
		archived: false,
	})
		.populate("author", "username firstName middleName lastName")
		.sort({ dateSubmitted: -1 });

	// Format author names for each report type
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

	// Format all report types
	const formattedWeeklyProgress = formatReports(pendingWeeklyProgress);
	const formattedTrainingSchedules = formatReports(pendingTrainingSchedules);
	const formattedLearningOutcomes = formatReports(pendingLearningOutcomes);
	const formattedDailyAttendances = formatReports(pendingDailyAttendances);

	res.render("admin/pendingReports", {
		weeklyProgressReports: formattedWeeklyProgress,
		trainingSchedules: formattedTrainingSchedules,
		learningOutcomes: formattedLearningOutcomes,
		dailyAttendances: formattedDailyAttendances,
	});
});

// Approve a report
export const approveReport = catchAsync(async (req, res) => {
	const { id, type } = req.params;
	const { adminComments } = req.body;

	let report;
	let redirectUrl;

	// Find the appropriate report type
	switch (type) {
		case "weeklyreport":
			report = await WeeklyReport.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		case "weeklyprogress":
			report = await WeeklyProgressReport.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		case "trainingschedule":
			report = await TrainingSchedule.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		case "learningoutcomes":
			report = await LearningOutcome.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		case "dailyattendance":
			report = await DailyAttendance.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		default:
			req.flash("error", "Invalid report type");
			return res.redirect("/admin/pending-reports");
	}

	if (!report) {
		req.flash("error", "Report not found");
		return res.redirect("/admin/pending-reports");
	}

	// Update the report
	report.status = "approved";
	report.approvedBy = req.user._id;
	report.approvalDate = new Date();
	if (adminComments) {
		report.adminComments = adminComments;
	}
	await report.save();

	// Create notification for the report author
	if (report.author) {
		const reportName = getReportTypeName(type);
		const notification = new Notification({
			recipient: report.author._id,
			message: `Your ${reportName} has been approved by an administrator${
				adminComments ? " with comments" : ""
			}.`,
			type: "success",
			reportType: type,
			reportId: report._id,
			action: "approved",
		});

		await notification.save();
	}

	req.flash("success", "Report approved successfully");
	res.redirect(redirectUrl);
});

// Reject a report
export const rejectReport = catchAsync(async (req, res) => {
	const { id, type } = req.params;
	const { adminComments } = req.body;

	if (!adminComments) {
		req.flash("error", "Please provide a reason for rejection");
		return res.redirect(`/admin/pending-reports`);
	}

	let report;
	let redirectUrl;

	// Find the appropriate report type
	switch (type) {
		case "weeklyreport":
			report = await WeeklyReport.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		case "weeklyprogress":
			report = await WeeklyProgressReport.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		case "trainingschedule":
			report = await TrainingSchedule.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		case "learningoutcomes":
			report = await LearningOutcome.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		case "dailyattendance":
			report = await DailyAttendance.findById(id).populate("author");
			redirectUrl = "/admin/pending-reports";
			break;
		default:
			req.flash("error", "Invalid report type");
			return res.redirect("/admin/pending-reports");
	}

	if (!report) {
		req.flash("error", "Report not found");
		return res.redirect("/admin/pending-reports");
	}

	// Update the report
	report.status = "rejected";
	report.adminComments = adminComments;
	report.needsRevision = true; // Flag that this report needs revision

	// Make sure the needsRevision flag is set for all report types
	if (type === "learningoutcomes" && !report.hasOwnProperty("needsRevision")) {
		report.needsRevision = true;
	}

	await report.save();

	// Create notification for the report author
	if (report.author) {
		const reportName = getReportTypeName(type);
		const notification = new Notification({
			recipient: report.author._id,
			message: `Your ${reportName} has been rejected by an administrator. Please review the comments and submit a revision.`,
			type: "danger",
			reportType: type,
			reportId: report._id,
			action: "rejected",
		});

		await notification.save();
	}

	req.flash("success", "Report rejected successfully");
	res.redirect(redirectUrl);
});

// Helper function to get report type name
const getReportTypeName = (type) => {
	switch (type) {
		case "weeklyreport":
			return "Weekly Report";
		case "weeklyprogress":
			return "Weekly Progress Report";
		case "trainingschedule":
			return "Training Schedule";
		case "learningoutcomes":
			return "Learning Outcome";
		case "dailyattendance":
			return "Daily Attendance";
		case "documentation":
			return "Documentation";
		case "timereport":
			return "Time Report";
		default:
			return "Report";
	}
};

export default {
	getPendingReports,
	approveReport,
	rejectReport,
};
