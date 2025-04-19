import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import Documentation from "../../models/documentation.js";
import TimeReport from "../../models/timeReport.js";
import WeeklyProgressReport from "../../models/weeklyProgressReports.js";
import TrainingSchedule from "../../models/trainingSchedule.js";
import LearningOutcome from "../../models/learningOutcomes.js";
import DailyAttendance from "../../models/dailyAttendance.js";

const renderDashboard = catchAsync(async (req, res) => {
	// Only fetch stats if user is logged in
	if (req.user) {
		// Count user's reports
		const weeklyReportsCount = await WeeklyReport.countDocuments({
			author: req.user._id,
			archived: false,
		});

		const documentationCount = await Documentation.countDocuments({
			author: req.user._id,
			archived: false,
		});

		const timeReportsCount = await TimeReport.countDocuments({
			author: req.user._id,
			archived: false,
		});

		// Count new report types
		const weeklyProgressCount = await WeeklyProgressReport.countDocuments({
			author: req.user._id,
			archived: false,
		});

		const trainingScheduleCount = await TrainingSchedule.countDocuments({
			author: req.user._id,
			archived: false,
		});

		const learningOutcomeCount = await LearningOutcome.countDocuments({
			author: req.user._id,
			archived: false,
		});

		const dailyAttendanceCount = await DailyAttendance.countDocuments({
			author: req.user._id,
			archived: false,
		});

		// Count pending reports for all types
		const pendingWeeklyReportsCount = await WeeklyReport.countDocuments({
			author: req.user._id,
			status: "pending",
			archived: false,
		});

		const pendingWeeklyProgressCount =
			await WeeklyProgressReport.countDocuments({
				author: req.user._id,
				status: "pending",
				archived: false,
			});

		const pendingTrainingScheduleCount = await TrainingSchedule.countDocuments({
			author: req.user._id,
			status: "pending",
			archived: false,
		});

		const pendingLearningOutcomeCount = await LearningOutcome.countDocuments({
			author: req.user._id,
			status: "pending",
			archived: false,
		});

		const pendingDailyAttendanceCount = await DailyAttendance.countDocuments({
			author: req.user._id,
			status: "pending",
			archived: false,
		});

		// Calculate total pending reports
		const pendingReportsCount =
			pendingWeeklyReportsCount +
			pendingWeeklyProgressCount +
			pendingTrainingScheduleCount +
			pendingLearningOutcomeCount +
			pendingDailyAttendanceCount;

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
				documentation: documentationCount,
				timeReports: timeReportsCount,
				weeklyProgress: weeklyProgressCount,
				trainingSchedule: trainingScheduleCount,
				learningOutcome: learningOutcomeCount,
				dailyAttendance: dailyAttendanceCount,
				pendingReports: pendingReportsCount,
			},
			latestReports,
		});
	} else {
		res.render("contents/dashboard");
	}
});

export default { renderDashboard };
