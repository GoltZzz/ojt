import catchAsync from "../../utils/catchAsync.js";
import WeeklyProgressReport from "../../models/weeklyProgressReports.js";
import TrainingSchedule from "../../models/trainingSchedule.js";
import LearningOutcome from "../../models/learningOutcomes.js";
import DailyAttendance from "../../models/dailyAttendance.js";

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
                    const middleInitial = report.author.middleName.charAt(0).toUpperCase();
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
        case "weeklyprogress":
            report = await WeeklyProgressReport.findById(id);
            redirectUrl = "/admin/pending-reports";
            break;
        case "trainingschedule":
            report = await TrainingSchedule.findById(id);
            redirectUrl = "/admin/pending-reports";
            break;
        case "learningoutcome":
            report = await LearningOutcome.findById(id);
            redirectUrl = "/admin/pending-reports";
            break;
        case "dailyattendance":
            report = await DailyAttendance.findById(id);
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
    if (adminComments) {
        report.adminComments = adminComments;
    }
    await report.save();

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
        case "weeklyprogress":
            report = await WeeklyProgressReport.findById(id);
            redirectUrl = "/admin/pending-reports";
            break;
        case "trainingschedule":
            report = await TrainingSchedule.findById(id);
            redirectUrl = "/admin/pending-reports";
            break;
        case "learningoutcome":
            report = await LearningOutcome.findById(id);
            redirectUrl = "/admin/pending-reports";
            break;
        case "dailyattendance":
            report = await DailyAttendance.findById(id);
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
    await report.save();

    req.flash("success", "Report rejected successfully");
    res.redirect(redirectUrl);
});

export default {
    getPendingReports,
    approveReport,
    rejectReport,
};
