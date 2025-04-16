import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import ExpressError from "../../utils/ExpressError.js";
import {
	generateWeeklyReportDocx,
	generateDailyAttendanceForm,
} from "../../utils/docxGenerator.js";

export const index = catchAsync(async (req, res) => {
	// Get query parameters for filtering and pagination
	const {
		studentName,
		internshipSite,
		weekPeriod,
		status,
		sortBy = "dateSubmitted_desc",
		page = 1,
		limit = 10,
	} = req.query;

	// Always exclude archived reports from the main reports page
	// Archived reports should only be visible on the archive page
	const filter = { archived: false };

	// Apply filters if provided
	if (studentName) {
		filter.studentName = { $regex: studentName, $options: "i" };
	}

	if (internshipSite) {
		filter.internshipSite = { $regex: internshipSite, $options: "i" };
	}

	if (weekPeriod) {
		const weekDate = new Date(weekPeriod);
		filter.$or = [
			{ weekStartDate: { $lte: weekDate }, weekEndDate: { $gte: weekDate } },
		];
	}

	if (status) {
		filter.status = status;
	}

	// Set up sorting
	let sortOptions = {};
	if (sortBy) {
		const [field, order] = sortBy.split("_");
		sortOptions[field] = order === "asc" ? 1 : -1;
	} else {
		sortOptions = { dateSubmitted: -1 }; // Default sort by newest first
	}

	// Calculate pagination values
	const pageNum = parseInt(page, 10) || 1;
	const limitNum = parseInt(limit, 10) || 10;
	const skip = (pageNum - 1) * limitNum;

	// Get total count for pagination
	const totalReports = await WeeklyReport.countDocuments(filter);
	const totalPages = Math.ceil(totalReports / limitNum);

	// Get reports with pagination
	const WeeklyReports = await WeeklyReport.find(filter)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username")
		.sort(sortOptions)
		.skip(skip)
		.limit(limitNum);

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

	// Prepare pagination data
	const pagination = {
		currentPage: pageNum,
		totalPages,
		totalReports,
		hasNext: pageNum < totalPages,
		hasPrev: pageNum > 1,
		nextPage: pageNum < totalPages ? pageNum + 1 : null,
		prevPage: pageNum > 1 ? pageNum - 1 : null,
		pageSize: limitNum,
	};

	res.render("reports/index", {
		WeeklyReports,
		pagination,
		filters: req.query,
	});
});

export const renderNewForm = async (req, res) => {
	// Format the user's full name
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	res.render("reports/new", { fullName });
};

export const createReport = catchAsync(async (req, res) => {
	// Format the user's full name to ensure it's consistent
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	// Override the studentName in the request body with the formatted full name
	// This ensures the student name is always set to the user's full name
	req.body.studentName = fullName;

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

	// Format the user's full name to ensure it's consistent
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	res.render("reports/edit", { WeeklyReports, fullName });
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

	// Format the user's full name to ensure it's consistent
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	// Override the studentName in the request body with the formatted full name
	// This ensures the student name cannot be changed even if someone tries to manipulate the form
	req.body.studentName = fullName;

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

export const exportReportAsDocx = catchAsync(async (req, res) => {
	const { id } = req.params;
	const report = await WeeklyReport.findById(id)
		.populate("approvedBy", "username firstName middleName lastName")
		.populate("author", "username firstName middleName lastName");

	if (!report) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/weeklyreport");
	}

	// Check if the current user is authorized to export this report
	// Only the author can export the report
	const isAuthor =
		report.author && req.user && report.author._id.equals(req.user._id);

	if (!isAuthor) {
		req.flash("error", "Only the report owner can export to DOCX");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Generate the DOCX file
	const buffer = await generateWeeklyReportDocx(report);

	// Set the appropriate headers for a DOCX file download
	res.setHeader(
		"Content-Disposition",
		`attachment; filename=weekly-report-${id}.docx`
	);
	res.setHeader(
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	);

	// Send the buffer as the response
	res.send(buffer);
});

export const exportDailyAttendanceForm = catchAsync(async (req, res) => {
	// Only allow logged-in users to export the form
	if (!req.user) {
		req.flash("error", "You must be logged in to export forms");
		return res.redirect("/login");
	}

	// Get data from query parameters if available
	const { beginDate, endDate } = req.query;

	// Prepare data for the form
	const data = {
		studentName:
			req.user.firstName +
			(req.user.middleName
				? ` ${req.user.middleName.charAt(0).toUpperCase()}. `
				: " ") +
			req.user.lastName,
		internshipSite: req.query.internshipSite || "",
		beginDate,
		endDate,
		supervisorName: req.query.supervisorName || "",
	};

	// Generate the DOCX file
	const buffer = await generateDailyAttendanceForm(data);

	// Set the appropriate headers for a DOCX file download
	res.setHeader(
		"Content-Disposition",
		`attachment; filename=daily-attendance-form-${
			new Date().toISOString().split("T")[0]
		}.docx`
	);
	res.setHeader(
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	);

	// Send the buffer as the response
	res.send(buffer);
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
	exportReportAsDocx,
	exportDailyAttendanceForm,
};
