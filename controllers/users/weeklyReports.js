import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import ExpressError from "../../utils/ExpressError.js";

export const index = catchAsync(async (req, res) => {
	// Always exclude archived reports from the main reports page
	// Archived reports should only be visible on the archive page
	const filter = { archived: false };

	const WeeklyReports = await WeeklyReport.find(filter)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username")
		.sort({ dateSubmitted: -1 }); // Sort by newest first

	// Format author names and add isCurrentUserReport flag
	WeeklyReports.forEach((report) => {
		if (report.author) {
			// Format author full name
			let fullName = report.author.firstName;
			if (report.author.middleName && report.author.middleName.length > 0) {
				const middleInitial = report.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}
			fullName += ` ${report.author.lastName}`;
			report.authorFullName = fullName;

			// Check if this report belongs to the current user
			report.isCurrentUserReport =
				req.user && report.author._id.equals(req.user._id);
		}
	});

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
		.populate("author", "username")
		.lean();
	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/weeklyreport");
	}
	// Make sure archived status is available in the template
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

	// Add a flag to indicate if the current user is the author of the report
	WeeklyReports.isAuthor =
		WeeklyReports.author &&
		req.user &&
		WeeklyReports.author._id.toString() === req.user._id.toString();

	// Add a flag to indicate if the report can be edited (is pending and user is author)
	WeeklyReports.canEdit =
		WeeklyReports.isAuthor && WeeklyReports.status === "pending";

	res.render("reports/show", { WeeklyReports });
});

export const renderEditForm = catchAsync(async (req, res) => {
	const { id } = req.params;
	const WeeklyReports = await WeeklyReport.findById(id);

	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/weeklyreport");
	}

	// Double-check that the current user is the author (middleware should have caught this already)
	if (!WeeklyReports.author || !WeeklyReports.author.equals(req.user._id)) {
		req.flash("error", "You don't have permission to edit this report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Check if the report is already approved or rejected
	if (WeeklyReports.status !== "pending") {
		req.flash("error", "You cannot edit a report that has been processed");
		return res.redirect(`/weeklyreport/${id}`);
	}

	res.render("reports/edit", { WeeklyReports });
});

export const updateReport = catchAsync(async (req, res) => {
	const { id } = req.params;

	// First find the report to check permissions
	const report = await WeeklyReport.findById(id);

	if (!report) {
		req.flash("error", "Weekly Report not found");
		return res.redirect("/weeklyreport");
	}

	// Double-check that the current user is the author
	if (!report.author || !report.author.equals(req.user._id)) {
		req.flash("error", "You don't have permission to update this report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Check if the report is already approved or rejected
	if (report.status !== "pending") {
		req.flash("error", "You cannot update a report that has been processed");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Now update the report
	const WeeklyReports = await WeeklyReport.findByIdAndUpdate(id, req.body, {
		new: true,
		runValidators: true,
	});

	req.flash("success", "Successfully updated weekly report!");
	res.redirect(`/weeklyreport/${WeeklyReports._id}`);
});

export const deleteReport = catchAsync(async (req, res) => {
	const { id } = req.params;

	// First find the report to check permissions
	const report = await WeeklyReport.findById(id);

	if (!report) {
		req.flash("error", "Weekly Report not found");
		return res.redirect("/weeklyreport");
	}

	// Double-check that the current user is the author
	if (!report.author || !report.author.equals(req.user._id)) {
		req.flash("error", "You don't have permission to delete this report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Check if the report is already approved or rejected
	if (report.status !== "pending") {
		req.flash("error", "You cannot delete a report that has been processed");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Now delete the report
	await WeeklyReport.findByIdAndDelete(id);
	req.flash("success", "Successfully deleted weekly report!");
	res.redirect("/weeklyreport");
});

export const archiveReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`⏳ Running archive for report ID: ${id}`);
	console.log("Request body:", req.body);

	const report = await WeeklyReport.findById(id);

	if (!report) {
		console.log(`❌ Report not found with ID: ${id}`);
		req.flash("error", "Report not found");
		return res.redirect("/weeklyreport");
	}

	if (req.user.role !== "admin") {
		console.log(`❌ User ${req.user._id} is not an admin`);
		req.flash("error", "You don't have permission to archive reports");
		return res.redirect(`/weeklyreport/${id}`);
	}

	console.log(
		`📝 Found report: ${report._id}, current archived status: ${report.archived}`
	);
	report.archived = true;

	if (req.body.archivedReason) {
		console.log(`📝 Setting archive reason: ${req.body.archivedReason}`);
		report.archivedReason = req.body.archivedReason;
	} else {
		console.log("📝 No archive reason provided, using default");
		report.archivedReason = "Manually archived by admin";
	}

	await report.save();
	console.log(
		`✅ Report archived successfully: ${report._id} with reason: ${report.archivedReason}`
	);

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
