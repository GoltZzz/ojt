import WeeklyReport from "../models/weeklyReports.js";
import WeeklyProgressReport from "../models/weeklyProgressReports.js";
import TrainingSchedule from "../models/trainingSchedule.js";
import LearningOutcome from "../models/learningOutcomes.js";
import DailyAttendance from "../models/dailyAttendance.js";

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

			const pendingWeeklyProgressReports =
				await WeeklyProgressReport.countDocuments({
					status: "pending",
					archived: false,
				});

			const pendingTrainingSchedules = await TrainingSchedule.countDocuments({
				status: "pending",
				archived: false,
			});

			const pendingLearningOutcomes = await LearningOutcome.countDocuments({
				status: "pending",
				archived: false,
			});

			const pendingDailyAttendances = await DailyAttendance.countDocuments({
				status: "pending",
				archived: false,
			});

			// Calculate total pending reports
			const totalPendingCount =
				pendingWeeklyReports +
				pendingWeeklyProgressReports +
				pendingTrainingSchedules +
				pendingLearningOutcomes +
				pendingDailyAttendances;

			// Add the counts to res.locals so they're available in all templates
			res.locals.pendingReportsCount = totalPendingCount;
			res.locals.pendingReportDetails = {
				weeklyReports: pendingWeeklyReports,
				weeklyProgressReports: pendingWeeklyProgressReports,
				trainingSchedules: pendingTrainingSchedules,
				learningOutcomes: pendingLearningOutcomes,
				dailyAttendances: pendingDailyAttendances,
			};
		} else {
			// Set to 0 for non-admin users
			res.locals.pendingReportsCount = 0;
			res.locals.pendingReportDetails = {
				weeklyReports: 0,
				weeklyProgressReports: 0,
				trainingSchedules: 0,
				learningOutcomes: 0,
				dailyAttendances: 0,
			};
		}
		next();
	} catch (error) {
		console.error("Error counting pending reports:", error);
		// Don't fail the request if counting fails
		res.locals.pendingReportsCount = 0;
		res.locals.pendingReportDetails = {
			weeklyReports: 0,
			weeklyProgressReports: 0,
			trainingSchedules: 0,
			learningOutcomes: 0,
			dailyAttendances: 0,
		};
		next();
	}
};

export default pendingReportsCount;
