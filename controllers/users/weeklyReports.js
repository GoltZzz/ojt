import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import ExpressError from "../../utils/ExpressError.js";

export const index = catchAsync(async (req, res) => {
	// For admin users, show all reports including archived ones
	// For regular users, only show non-archived reports
	const filter = req.user.role === "admin" ? {} : { archived: false };

	const WeeklyReports = await WeeklyReport.find(filter)
		.populate("author", "username")
		.populate("approvedBy", "username")
		.sort({ dateSubmitted: -1 }); // Sort by newest first

	res.render("reports/index", { WeeklyReports });
});

export const renderNewForm = (req, res) => {
	res.render("reports/new");
};

export const createReport = catchAsync(async (req, res) => {
	const WeeklyReports = new WeeklyReport(req.body);
	WeeklyReports.author = req.user._id;
	await WeeklyReports.save();
	req.flash("success", "Successfully created a new weekly report!");
	res.redirect(`/weeklyreport/${WeeklyReports._id}`);
});

export const showReport = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const WeeklyReports = await WeeklyReport.findById(id)
		.populate("approvedBy", "username")
		.lean();
	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/weeklyreport");
	}
	WeeklyReports.weekStartDate =
		WeeklyReports.weekStartDate.toLocaleDateString();
	WeeklyReports.weekEndDate = WeeklyReports.weekEndDate.toLocaleDateString();
	if (WeeklyReports.dailyRecords) {
		const defaultTimeIn = { morning: "N/A", afternoon: "01:00" };
		const defaultTimeOut = { morning: "12:00", afternoon: "N/A" };
		const defaultAccomplishments = "No accomplishments recorded";
		WeeklyReports.dailyRecords = WeeklyReports.dailyRecords.map(
			({ timeIn, timeOut, accomplishments }) => ({
				timeIn: {
					morning: timeIn?.morning || defaultTimeIn.morning,
					afternoon: timeIn?.afternoon || defaultTimeIn.afternoon,
				},
				timeOut: {
					morning: timeOut?.morning || defaultTimeOut.morning,
					afternoon: timeOut?.afternoon || defaultTimeOut.afternoon,
				},
				accomplishments: accomplishments || defaultAccomplishments,
			})
		);
	}
	res.render("reports/show", { WeeklyReports });
});

export const renderEditForm = catchAsync(async (req, res) => {
	const { id } = req.params;
	const WeeklyReports = await WeeklyReport.findById(id);

	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/weeklyreport");
	}

	res.render("reports/edit", { WeeklyReports });
});

export const updateReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	const WeeklyReports = await WeeklyReport.findByIdAndUpdate(id, req.body, {
		new: true,
		runValidators: true,
	});

	if (!WeeklyReports) {
		throw new ExpressError("Weekly Report not found", 404);
	}

	req.flash("success", "Successfully updated weekly report!");
	res.redirect(`/weeklyreport/${WeeklyReports._id}`);
});

export const deleteReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	await WeeklyReport.findByIdAndDelete(id);
	req.flash("success", "Successfully deleted weekly report!");
	res.redirect("/weeklyreport");
});

export const archiveReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	const report = await WeeklyReport.findById(id);

	if (!report) {
		req.flash("error", "Report not found");
		return res.redirect("/weeklyreport");
	}

	if (req.user.role !== "admin") {
		req.flash("error", "You don't have permission to archive reports");
		return res.redirect(`/weeklyreport/${id}`);
	}
	report.archived = true;

	if (req.body.archivedReason) {
		report.archivedReason = req.body.archivedReason;
	} else {
		report.archivedReason = "Manually archived by admin";
	}

	await report.save();

	req.flash("success", "Report has been archived successfully");
	return res.redirect("/admin/archived-reports");
});

export default {
	index,
	renderNewForm,
	createReport,
	showReport,
	renderEditForm,
	updateReport,
	deleteReport,
	archiveReport,
};
