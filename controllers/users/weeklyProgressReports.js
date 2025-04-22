import catchAsync from "../../utils/catchAsync.js";
import ExpressError from "../../utils/ExpressError.js";
import WeeklyProgressReport from "../../models/weeklyProgressReports.js";
import {
	validateWeeklyProgressReport,
	sanitizeWeeklyProgressReport,
} from "../../utils/weeklyProgressValidator.js";
import { generateWeeklyProgressReportPdf } from "../../utils/pdfGenerators/index.js";

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
	const totalReports = await WeeklyProgressReport.countDocuments(filter);
	const totalPages = Math.ceil(totalReports / limitNum);

	// Get reports with pagination
	const WeeklyProgressReports = await WeeklyProgressReport.find(filter)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username")
		.sort(sortOptions)
		.skip(skip)
		.limit(limitNum);

	// Format author names and add isCurrentUserReport flag
	WeeklyProgressReports.forEach((report) => {
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

	res.render("reports/weeklyProgress/index", {
		WeeklyProgressReports,
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

	res.render("reports/weeklyProgress/new", { fullName });
};

export const createReport = catchAsync(async (req, res) => {
	try {
		// Extract data from the request body
		const {
			studentName,
			internshipSite,
			weekNumber,
			weekStartDate,
			weekEndDate,
			dutiesPerformed,
			newTrainings,
			accomplishments,
			problemsEncountered,
			problemSolutions,
			goalsForNextWeek,
			supervisorName,
			supervisorRole,
		} = req.body;

		// Format accomplishments array if it's not already an array
		let formattedAccomplishments = [];
		if (accomplishments) {
			if (Array.isArray(accomplishments)) {
				formattedAccomplishments = accomplishments;
			} else {
				// Handle single accomplishment case
				formattedAccomplishments = [
					{
						proposedActivity: accomplishments.proposedActivity,
						accomplishmentDetails: accomplishments.accomplishmentDetails,
					},
				];
			}
		}

		// Prepare report data for validation
		const reportData = {
			studentName,
			internshipSite,
			weekNumber,
			weekStartDate,
			weekEndDate,
			dutiesPerformed,
			newTrainings,
			accomplishments: formattedAccomplishments,
			problemsEncountered,
			problemSolutions,
			goalsForNextWeek,
			supervisorName,
			supervisorRole,
		};

		// Validate the report data
		const validation = validateWeeklyProgressReport(reportData);
		if (!validation.isValid) {
			// If validation fails, flash error messages and redirect back to form
			validation.errors.forEach((error) => {
				req.flash("error", error);
			});
			return res.redirect("/weeklyprogress/new");
		}

		// Sanitize the report data
		const sanitizedData = sanitizeWeeklyProgressReport(reportData);

		// Create a new weekly progress report with sanitized data
		const newReport = new WeeklyProgressReport({
			...sanitizedData,
			author: req.user._id,
			dateSubmitted: new Date(),
		});

		// Save the report
		await newReport.save();

		req.flash("success", "Successfully created a new weekly progress report!");
		res.redirect("/weeklyprogress");
	} catch (error) {
		console.error("Error creating weekly progress report:", error);

		// Handle specific validation errors from Mongoose
		if (error.name === "ValidationError") {
			Object.values(error.errors).forEach((err) => {
				req.flash("error", err.message);
			});
		} else {
			req.flash(
				"error",
				"Failed to create weekly progress report. Please try again."
			);
		}

		res.redirect("/weeklyprogress/new");
	}
});

export const showReport = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Find the report by ID
	const report = await WeeklyProgressReport.findById(id).populate(
		"author",
		"username firstName middleName lastName"
	);

	// If report not found, flash error and redirect
	if (!report) {
		req.flash("error", "Weekly Progress Report not found");
		return res.redirect("/weeklyprogress");
	}

	// Check if the current user is the author of the report
	const isAuthor =
		req.user && report.author && report.author._id.equals(req.user._id);

	// Check if the user can edit or delete the report
	// Only the author can edit if the report is pending and not archived
	const canEdit = isAuthor && report.status === "pending" && !report.archived;

	// Only the author can delete if the report is not archived
	const canDelete = isAuthor && !report.archived;

	// Add these properties to the report object
	report.isAuthor = isAuthor;
	report.canEdit = canEdit;
	report.canDelete = canDelete;

	// No longer checking hasBeenExported status

	res.render("reports/weeklyProgress/show", {
		WeeklyProgressReport: report,
	});
});

export const renderEditForm = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Find the report by ID
	const report = await WeeklyProgressReport.findById(id);

	// If report not found, flash error and redirect
	if (!report) {
		req.flash("error", "Weekly Progress Report not found");
		return res.redirect("/weeklyprogress");
	}

	// Check if the current user is the author of the report
	const isAuthor =
		req.user && report.author && report.author.equals(req.user._id);

	// If not the author, flash error and redirect
	if (!isAuthor) {
		req.flash("error", "You do not have permission to edit this report");
		return res.redirect("/weeklyprogress");
	}

	// If report is not pending or is archived, flash error and redirect
	if (report.status !== "pending" || report.archived) {
		req.flash(
			"error",
			"You cannot edit a report that has been approved, rejected, or archived"
		);
		return res.redirect("/weeklyprogress");
	}

	// Format the user's full name
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	res.render("reports/weeklyProgress/edit", {
		WeeklyProgressReport: report,
		fullName,
	});
});

export const updateReport = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Find the report by ID
	const report = await WeeklyProgressReport.findById(id);

	// If report not found, flash error and redirect
	if (!report) {
		req.flash("error", "Weekly Progress Report not found");
		return res.redirect("/weeklyprogress");
	}

	// Check if the current user is the author of the report
	const isAuthor =
		req.user && report.author && report.author.equals(req.user._id);

	// If not the author, flash error and redirect
	if (!isAuthor) {
		req.flash("error", "You do not have permission to edit this report");
		return res.redirect("/weeklyprogress");
	}

	// If report is not pending or is archived, flash error and redirect
	if (report.status !== "pending" || report.archived) {
		req.flash(
			"error",
			"You cannot edit a report that has been approved, rejected, or archived"
		);
		return res.redirect("/weeklyprogress");
	}

	try {
		// Extract data from the request body
		const {
			internshipSite,
			weekNumber,
			weekStartDate,
			weekEndDate,
			dutiesPerformed,
			newTrainings,
			accomplishments,
			problemsEncountered,
			problemSolutions,
			goalsForNextWeek,
			supervisorName,
			supervisorRole,
		} = req.body;

		// Format accomplishments array if it's not already an array
		let formattedAccomplishments = [];
		if (accomplishments) {
			if (Array.isArray(accomplishments)) {
				formattedAccomplishments = accomplishments;
			} else {
				// Handle single accomplishment case
				formattedAccomplishments = [
					{
						proposedActivity: accomplishments.proposedActivity,
						accomplishmentDetails: accomplishments.accomplishmentDetails,
					},
				];
			}
		}

		// Get the student name from the existing report for validation
		const existingReport = await WeeklyProgressReport.findById(id);
		const studentName = existingReport.studentName;

		// Prepare report data for validation
		const reportData = {
			studentName,
			internshipSite,
			weekNumber,
			weekStartDate,
			weekEndDate,
			dutiesPerformed,
			newTrainings,
			accomplishments: formattedAccomplishments,
			problemsEncountered,
			problemSolutions,
			goalsForNextWeek,
			supervisorName,
			supervisorRole,
		};

		// Validate the report data
		const validation = validateWeeklyProgressReport(reportData);
		if (!validation.isValid) {
			// If validation fails, flash error messages and redirect back to form
			validation.errors.forEach((error) => {
				req.flash("error", error);
			});
			return res.redirect(`/weeklyprogress/${id}/edit`);
		}

		// Sanitize the report data
		const sanitizedData = sanitizeWeeklyProgressReport(reportData);

		// Update the report with sanitized data
		await WeeklyProgressReport.findByIdAndUpdate(id, {
			internshipSite: sanitizedData.internshipSite,
			weekNumber: sanitizedData.weekNumber,
			weekStartDate: sanitizedData.weekStartDate,
			weekEndDate: sanitizedData.weekEndDate,
			dutiesPerformed: sanitizedData.dutiesPerformed,
			newTrainings: sanitizedData.newTrainings,
			accomplishments: sanitizedData.accomplishments,
			problemsEncountered: sanitizedData.problemsEncountered,
			problemSolutions: sanitizedData.problemSolutions,
			goalsForNextWeek: sanitizedData.goalsForNextWeek,
			supervisorName: sanitizedData.supervisorName,
			supervisorRole: sanitizedData.supervisorRole,
		});

		req.flash("success", "Successfully updated weekly progress report!");
		res.redirect(`/weeklyprogress/${id}`);
	} catch (error) {
		console.error("Error updating weekly progress report:", error);

		// Handle specific validation errors from Mongoose
		if (error.name === "ValidationError") {
			Object.values(error.errors).forEach((err) => {
				req.flash("error", err.message);
			});
		} else {
			req.flash(
				"error",
				"Failed to update weekly progress report. Please try again."
			);
		}

		res.redirect(`/weeklyprogress/${id}/edit`);
	}
});

export const deleteReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { password } = req.body;

	// Check if password was provided
	if (!password) {
		req.flash("error", "Password is required to delete a report");
		return res.redirect(`/weeklyprogress/${id}`);
	}

	// Find the report by ID
	const report = await WeeklyProgressReport.findById(id);

	// If report not found, flash error and redirect
	if (!report) {
		req.flash("error", "Weekly Progress Report not found");
		return res.redirect("/weeklyprogress");
	}

	// Check if the current user is the author of the report or an admin
	const isAuthor =
		req.user && report.author && report.author.equals(req.user._id);
	const isAdmin = req.user && req.user.role === "admin";

	// If not the author or admin, flash error and redirect
	if (!isAuthor && !isAdmin) {
		req.flash("error", "You do not have permission to delete this report");
		return res.redirect("/weeklyprogress");
	}

	// No longer requiring export before deletion

	// For admin users: check if the report is archived
	if (isAdmin && !report.archived) {
		req.flash("error", "You must archive the report before deleting it");
		return res.redirect(`/weeklyprogress/${id}`);
	}

	// Verify the user's password
	try {
		// Use passport-local-mongoose's authenticate method to verify the password
		req.user.authenticate(password, async (err, user, passwordError) => {
			if (err) {
				console.error("Authentication error:", err);
				req.flash("error", "An error occurred during authentication");
				return res.redirect(`/weeklyprogress/${id}`);
			}

			if (!user) {
				req.flash("error", "Incorrect password");
				return res.redirect(`/weeklyprogress/${id}`);
			}

			// Password is correct, proceed with deletion
			console.log(
				`Deleting report ${report._id}, hasBeenExported: ${report.hasBeenExported}, archived: ${report.archived}`
			);

			try {
				// Delete the report
				await WeeklyProgressReport.findByIdAndDelete(id);

				req.flash("success", "Successfully deleted weekly progress report!");
				res.redirect("/weeklyprogress");
			} catch (error) {
				console.error("Error deleting weekly progress report:", error);
				req.flash(
					"error",
					"Failed to delete weekly progress report. Please try again."
				);
				res.redirect(`/weeklyprogress/${id}`);
			}
		});
	} catch (error) {
		console.error("Error during password verification:", error);
		req.flash("error", "An error occurred during password verification");
		res.redirect(`/weeklyprogress/${id}`);
	}
});

export const archiveReport = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Check if user is admin
	if (req.user.role !== "admin") {
		req.flash("error", "Only administrators can archive reports");
		return res.redirect(`/weeklyprogress/${id}`);
	}

	// Find the report by ID
	const report = await WeeklyProgressReport.findById(id).populate("author");

	// If report not found, flash error and redirect
	if (!report) {
		req.flash("error", "Weekly Progress Report not found");
		return res.redirect("/weeklyprogress");
	}

	// Check if the report is approved
	if (report.status !== "approved") {
		req.flash("error", "Only approved reports can be archived");
		return res.redirect(`/weeklyprogress/${id}`);
	}

	try {
		// Archive the report
		report.archived = true;
		report.archivedReason =
			req.body.archivedReason || "Manually archived by admin";
		await report.save();

		// Create notification for the report author
		if (report.author) {
			const notification = new Notification({
				recipient: report.author._id,
				message: `Your Weekly Progress Report has been archived by an administrator${
					req.body.archivedReason
						? " with reason: " + req.body.archivedReason
						: ""
				}.`,
				type: "info",
				reportType: "weeklyprogress",
				reportId: report._id,
				action: "archived",
			});

			await notification.save();
		}

		req.flash("success", "Successfully archived weekly progress report!");
		res.redirect("/admin/archived-reports");
	} catch (error) {
		console.error("Error archiving weekly progress report:", error);
		req.flash(
			"error",
			"Failed to archive weekly progress report. Please try again."
		);
		res.redirect(`/weeklyprogress/${id}`);
	}
});

export const unarchiveReport = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Check if user is admin
	if (req.user.role !== "admin") {
		req.flash("error", "Only administrators can unarchive reports");
		return res.redirect(`/weeklyprogress/${id}`);
	}

	// Find the report by ID
	const report = await WeeklyProgressReport.findById(id).populate("author");

	// If report not found, flash error and redirect
	if (!report) {
		req.flash("error", "Weekly Progress Report not found");
		return res.redirect("/weeklyprogress");
	}

	try {
		// Unarchive the report
		report.archived = false;
		report.archivedReason = "";
		await report.save();

		// Create notification for the report author
		if (report.author) {
			const notification = new Notification({
				recipient: report.author._id,
				message: `Your Weekly Progress Report has been unarchived by an administrator.`,
				type: "info",
				reportType: "weeklyprogress",
				reportId: report._id,
				action: "unarchived",
			});

			await notification.save();
		}

		req.flash("success", "Successfully unarchived weekly progress report!");
		res.redirect("/weeklyprogress");
	} catch (error) {
		console.error("Error unarchiving weekly progress report:", error);
		req.flash(
			"error",
			"Failed to unarchive weekly progress report. Please try again."
		);
		res.redirect(`/weeklyprogress/${id}`);
	}
});

export const exportReportAsPdf = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`Starting PDF export for weekly progress report ID: ${id}`);

	try {
		// Find the report with populated fields
		const report = await WeeklyProgressReport.findById(id)
			.populate("approvedBy", "username firstName middleName lastName")
			.populate("author", "username firstName middleName lastName");

		if (!report) {
			console.log(`Report not found with ID: ${id}`);
			req.flash("error", "Cannot find that weekly progress report!");
			return res.redirect("/weeklyprogress");
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
			return res.redirect(`/weeklyprogress/${id}`);
		}

		// Check if the report status is rejected
		if (report.status === "rejected") {
			console.log(`Report ${report._id} is rejected, cannot export to PDF`);
			req.flash("error", "Rejected reports cannot be exported to PDF");
			return res.redirect(`/weeklyprogress/${id}`);
		}

		// Validate report data before generating PDF
		if (!report.studentName || !report.internshipSite) {
			console.error(`Report ${report._id} is missing required fields`);
			req.flash(
				"error",
				"Report is missing required information for PDF export"
			);
			return res.redirect(`/weeklyprogress/${id}`);
		}

		console.log(`Generating PDF for report ${report._id}`);

		// Generate the PDF file
		const buffer = await generateWeeklyProgressReportPdf(report);

		console.log(`PDF generated successfully for report ${report._id}`);

		// Mark the report as exported
		report.hasBeenExported = true;
		await report.save();
		console.log(`Report ${report._id} marked as exported`);

		// Set the appropriate headers for a PDF file download
		res.setHeader(
			"Content-Disposition",
			`attachment; filename=weekly-progress-report-${id}.pdf`
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
		return res.redirect(`/weeklyprogress/${id}`);
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
	unarchiveReport,
	exportReportAsPdf,
};
