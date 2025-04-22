import WeeklyReport from "../models/weeklyReports.js";
import WeeklyProgressReport from "../models/weeklyProgressReports.js";
import TrainingSchedule from "../models/trainingSchedule.js";
import DailyAttendance from "../models/dailyAttendance.js";
import LearningOutcomes from "../models/learningOutcomes.js";
import ExpressError from "../utils/ExpressError.js";

// Middleware to check if the current user is the author of the report
const isReportAuthor = (reportType) => {
	return async (req, res, next) => {
		try {
			const { id } = req.params;
			let report;
			let redirectPath;

			// Determine which model to use based on the report type
			if (reportType === "weeklyReport") {
				report = await WeeklyReport.findById(id);
				redirectPath = "/weeklyreport";
			} else if (reportType === "weeklyProgressReport") {
				report = await WeeklyProgressReport.findById(id);
				redirectPath = "/weeklyprogress";
			} else if (reportType === "trainingSchedule") {
				report = await TrainingSchedule.findById(id);
				redirectPath = "/trainingschedule";
			} else if (reportType === "dailyAttendance") {
				report = await DailyAttendance.findById(id);
				redirectPath = "/dailyattendance";
			} else if (reportType === "learningOutcomes") {
				report = await LearningOutcomes.findById(id);
				redirectPath = "/learningoutcomes";
			} else {
				return next(new ExpressError("Invalid report type", 400));
			}

			if (!report) {
				req.flash("error", "Report not found");
				return res.redirect(redirectPath);
			}

			// Check if the current user is the author of the report
			if (!report.author || !report.author.equals(req.user._id)) {
				req.flash("error", "You don't have permission to modify this report");
				return res.redirect(`${redirectPath}/${id}`);
			}

			// If the report is approved, don't allow edits (rejected reports can be edited)
			if (report.status === "approved") {
				req.flash("error", "You cannot modify an approved report");
				return res.redirect(`${redirectPath}/${id}`);
			}

			// If the report is archived, don't allow edits
			if (report.archived) {
				req.flash("error", "You cannot modify an archived report");
				return res.redirect(`${redirectPath}/${id}`);
			}

			next();
		} catch (error) {
			console.error("Error in isReportAuthor middleware:", error);
			next(
				new ExpressError("An error occurred while checking permissions", 500)
			);
		}
	};
};

export default isReportAuthor;
