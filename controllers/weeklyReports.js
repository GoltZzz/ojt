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

	// Fetch the weekly report with author details
	const WeeklyReports = await WeeklyReport.findById(id).lean();
	// Handle the case where the report is not found
	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/WeeklyReport");
	}
	// Format dates for display
	WeeklyReports.weekStartDate =
		WeeklyReports.weekStartDate.toLocaleDateString();
	WeeklyReports.weekEndDate = WeeklyReports.weekEndDate.toLocaleDateString();
	// Format daily records if they exist
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
	// Render the report view
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
