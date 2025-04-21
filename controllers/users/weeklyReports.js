import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import Notification from "../../models/notification.js";
import ExpressError from "../../utils/ExpressError.js";
import { generateWeeklyReportPdf } from "../../utils/pdfGenerators/index.js";

export const index = catchAsync(async (req, res) => {
	// Get query parameters for filtering and pagination
	const {
		studentName,
		internshipSite,
		weekPeriod,
		status,
		archived,
		sortBy = "dateSubmitted_desc",
		page = 1,
		limit = 10,
	} = req.query;

	// Set up filter object
	const filter = {};

	// Handle archived filter
	if (archived === "true") {
		filter.archived = true;
	} else if (archived === "false" || !archived) {
		filter.archived = false;
	}
	// If archived is not specified or is an invalid value, show all reports

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

	// Add a flag to indicate if the report can be deleted (is pending or rejected and user is author)
	WeeklyReports.canDelete =
		WeeklyReports.isAuthor &&
		(WeeklyReports.status === "pending" || WeeklyReports.status === "rejected");

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

	// Check if the report is already approved (rejected reports can be deleted)
	if (report.status === "approved") {
		req.flash("error", "You cannot delete an approved report");
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

	// Create notification for the report author
	if (report.author) {
		const notification = new Notification({
			recipient: report.author,
			message: `Your Weekly Report has been archived by an administrator${
				req.body.archivedReason
					? " with reason: " + req.body.archivedReason
					: ""
			}.`,
			type: "info",
			reportType: "weeklyreport",
			reportId: report._id,
			action: "archived",
		});

		await notification.save();
	}

	req.flash("success", "Report has been archived successfully");
	return res.redirect("/admin/archived-reports");
});

export const exportReportAsPdf = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`Starting PDF export for report ID: ${id}`);

	try {
		// Find the report with populated fields
		const report = await WeeklyReport.findById(id)
			.populate("approvedBy", "username firstName middleName lastName")
			.populate("author", "username firstName middleName lastName");

		if (!report) {
			console.log(`Report not found with ID: ${id}`);
			req.flash("error", "Cannot find that weekly report!");
			return res.redirect("/weeklyreport");
		}

		console.log(`Found report: ${report._id}, status: ${report.status}`);

		// Check if the current user is authorized to export this report
		// Only the author can export the report
		const isAuthor =
			report.author && req.user && report.author._id.equals(req.user._id);

		if (!isAuthor) {
			console.log(
				`User ${req.user._id} is not the author of report ${report._id}`
			);
			req.flash("error", "Only the report owner can export to PDF");
			return res.redirect(`/weeklyreport/${id}`);
		}

		// Check if the report status is not approved
		if (report.status !== "approved") {
			console.log(`Report ${report._id} is not approved, cannot export to PDF`);
			req.flash("error", "Only approved reports can be exported to PDF");
			return res.redirect(`/weeklyreport/${id}`);
		}

		// Validate report data before generating PDF
		if (!report.studentName || !report.internshipSite) {
			console.error(`Report ${report._id} is missing required fields`);
			req.flash(
				"error",
				"Report is missing required information for PDF export"
			);
			return res.redirect(`/weeklyreport/${id}`);
		}

		console.log(`Generating PDF for report ${report._id}`);

		// Generate the PDF file
		const buffer = await generateWeeklyReportPdf(report);

		console.log(`PDF generated successfully for report ${report._id}`);

		// Set the appropriate headers for a PDF file download
		res.setHeader(
			"Content-Disposition",
			`attachment; filename=weekly-report-${id}.pdf`
		);
		res.setHeader("Content-Type", "application/pdf");

		// Send the buffer as the response
		res.send(buffer);
	} catch (error) {
		console.error(`PDF generation error for report ${id}:`, error);
		req.flash(
			"error",
			`Error generating PDF: ${error.message}. Please try again.`
		);
		return res.redirect(`/weeklyreport/${id}`);
	}
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
	exportReportAsPdf,
};
