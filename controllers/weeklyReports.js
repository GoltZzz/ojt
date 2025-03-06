import catchAsync from "../utils/catchAsync.js";
import WeeklyReport from "../models/weeklyReports.js";
import ExpressError from "../utils/ExpressError.js";

export const index = catchAsync(async (req, res) => {
	const WeeklyReports = await WeeklyReport.find({}).populate(
		"author",
		"username"
	);
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
	res.redirect(`/WeeklyReport/${WeeklyReports._id}`);
});

export const showReport = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const WeeklyReports = await WeeklyReport.findById(id)
		.populate({
			path: "author",
			select: "username firstName lastName",
		})
		.lean();

	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/WeeklyReport");
	}

	// Create a full name for breadcrumb
	WeeklyReports.authorName =
		WeeklyReports.author.firstName && WeeklyReports.author.lastName
			? `${WeeklyReports.author.firstName} ${WeeklyReports.author.lastName}`
			: WeeklyReports.author.username;

	// Format dates for display
	WeeklyReports.weekStartDate =
		WeeklyReports.weekStartDate.toLocaleDateString();
	WeeklyReports.weekEndDate = WeeklyReports.weekEndDate.toLocaleDateString();

	// Format time records if they exist
	if (WeeklyReports.dailyRecords) {
		WeeklyReports.dailyRecords = WeeklyReports.dailyRecords.map((record) => ({
			...record,
			timeIn: {
				morning: record.timeIn?.morning || "N/A",
				afternoon: record.timeIn?.afternoon || "01:00",
			},
			timeOut: {
				morning: record.timeOut?.morning || "12:00",
				afternoon: record.timeOut?.afternoon || "N/A",
			},
			accomplishments: record.accomplishments || "No accomplishments recorded",
		}));
	}
	res.render("reports/show", { WeeklyReports });
});

export const renderEditForm = catchAsync(async (req, res) => {
	const { id } = req.params;
	const WeeklyReports = await WeeklyReport.findById(id);
	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/WeeklyReport");
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
	res.redirect(`/WeeklyReport/${WeeklyReports._id}`);
});

export const deleteReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	await WeeklyReport.findByIdAndDelete(id);
	req.flash("success", "Successfully deleted weekly report!");
	res.redirect("/WeeklyReport");
});
