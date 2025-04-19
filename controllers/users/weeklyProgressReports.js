import catchAsync from "../../utils/catchAsync.js";
import ExpressError from "../../utils/ExpressError.js";
import WeeklyProgressReport from "../../models/weeklyProgressReports.js";

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

		// Create a new weekly progress report
		const newReport = new WeeklyProgressReport({
			studentName,
			internshipSite,
			weekNumber: parseInt(weekNumber),
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
			author: req.user._id,
			dateSubmitted: new Date(),
		});

		// Save the report
		await newReport.save();

		req.flash("success", "Successfully created a new weekly progress report!");
		res.redirect("/weeklyprogress");
	} catch (error) {
		console.error("Error creating weekly progress report:", error);
		req.flash(
			"error",
			"Failed to create weekly progress report. Please try again."
		);
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
	// Only the author can edit/delete, and only if the report is pending and not archived
	const canEdit = isAuthor && report.status === "pending" && !report.archived;
	const canDelete = canEdit;

	// Add these properties to the report object
	report.isAuthor = isAuthor;
	report.canEdit = canEdit;
	report.canDelete = canDelete;

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

		// Update the report
		await WeeklyProgressReport.findByIdAndUpdate(id, {
			internshipSite,
			weekNumber: parseInt(weekNumber),
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
		});

		req.flash("success", "Successfully updated weekly progress report!");
		res.redirect(`/weeklyprogress/${id}`);
	} catch (error) {
		console.error("Error updating weekly progress report:", error);
		req.flash(
			"error",
			"Failed to update weekly progress report. Please try again."
		);
		res.redirect(`/weeklyprogress/${id}/edit`);
	}
});

export const deleteReport = catchAsync(async (req, res) => {
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
		req.flash("error", "You do not have permission to delete this report");
		return res.redirect("/weeklyprogress");
	}

	// If report is not pending or is archived, flash error and redirect
	if (report.status !== "pending" || report.archived) {
		req.flash(
			"error",
			"You cannot delete a report that has been approved, rejected, or archived"
		);
		return res.redirect("/weeklyprogress");
	}

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

export default {
	index,
	renderNewForm,
	createReport,
	showReport,
	renderEditForm,
	updateReport,
	deleteReport,
};
