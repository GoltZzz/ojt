import catchAsync from "../../utils/catchAsync.js";
import ExpressError from "../../utils/ExpressError.js";
import TrainingSchedule from "../../models/trainingSchedule.js";
import { generateTrainingSchedulePdf } from "../../utils/pdfGenerators/index.js";

export const index = catchAsync(async (req, res) => {
	// Get query parameters for filtering and pagination
	const {
		studentName,
		internshipSite,
		activities,
		performanceMethod,
		trainer,
		timeline,
		expectedOutput,
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

	// Apply filters if provided
	if (studentName) {
		filter.studentName = { $regex: studentName, $options: "i" };
	}

	if (internshipSite) {
		filter.internshipSite = { $regex: internshipSite, $options: "i" };
	}

	if (status) {
		filter.status = status;
	}

	// Apply new filters for schedule items
	if (
		activities ||
		performanceMethod ||
		trainer ||
		timeline ||
		expectedOutput
	) {
		// Create a filter for scheduleItems array
		const scheduleItemsFilter = [];

		if (activities) {
			scheduleItemsFilter.push({
				"scheduleItems.activities": { $regex: activities, $options: "i" },
			});
		}

		if (performanceMethod) {
			scheduleItemsFilter.push({
				"scheduleItems.deliverables": {
					$regex: performanceMethod,
					$options: "i",
				},
			});
		}

		if (trainer) {
			scheduleItemsFilter.push({
				"scheduleItems.supervisorName": { $regex: trainer, $options: "i" },
			});
		}

		if (timeline) {
			scheduleItemsFilter.push({
				"scheduleItems.week": { $regex: timeline, $options: "i" },
			});
		}

		if (expectedOutput) {
			scheduleItemsFilter.push({
				"scheduleItems.deliverables": { $regex: expectedOutput, $options: "i" },
			});
		}

		// Add the $or condition to the main filter if we have any schedule item filters
		if (scheduleItemsFilter.length > 0) {
			filter.$or = scheduleItemsFilter;
		}
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
	const totalReports = await TrainingSchedule.countDocuments(filter);
	const totalPages = Math.ceil(totalReports / limitNum);

	// Get schedules with pagination
	const TrainingSchedules = await TrainingSchedule.find(filter)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username")
		.sort(sortOptions)
		.skip(skip)
		.limit(limitNum);

	// Format author names and add isCurrentUserReport flag
	TrainingSchedules.forEach((schedule) => {
		if (schedule.author) {
			// Format author full name
			let fullName = schedule.author.firstName;
			if (schedule.author.middleName && schedule.author.middleName.length > 0) {
				const middleInitial = schedule.author.middleName
					.charAt(0)
					.toUpperCase();
				fullName += ` ${middleInitial}.`;
			}
			fullName += ` ${schedule.author.lastName}`;
			schedule.authorFullName = fullName;

			// Check if this schedule belongs to the current user
			schedule.isCurrentUserReport =
				req.user && schedule.author._id.equals(req.user._id);
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

	res.render("reports/trainingSchedule/index", {
		TrainingSchedules,
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

	res.render("reports/trainingSchedule/new", { fullName });
};

export const createSchedule = catchAsync(async (req, res) => {
	try {
		// Extract data from the request body
		const {
			studentName,
			internshipSite,
			startDate,
			endDate,
			proposedActivities,
			performanceMethod,
			trainer,
			timeline,
			expectedOutput,
			additionalNotes,
		} = req.body;

		// Create a new training schedule
		const newSchedule = new TrainingSchedule({
			studentName,
			internshipSite,
			startDate,
			endDate,
			proposedActivities,
			performanceMethod,
			trainer,
			timeline,
			expectedOutput,
			additionalNotes,
			author: req.user._id,
			dateSubmitted: new Date(),
			status: "pending",
		});

		// Save the schedule
		await newSchedule.save();

		req.flash("success", "Successfully created a new training schedule!");
		res.redirect("/trainingschedule");
	} catch (error) {
		console.error("Error creating training schedule:", error);

		// Handle specific validation errors from Mongoose
		if (error.name === "ValidationError") {
			Object.values(error.errors).forEach((err) => {
				req.flash("error", err.message);
			});
		} else {
			req.flash(
				"error",
				"Failed to create training schedule. Please try again."
			);
		}

		res.redirect("/trainingschedule/new");
	}
});

export const showSchedule = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	// Find the schedule by ID and populate author and approvedBy fields
	const schedule = await TrainingSchedule.findById(id)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username");

	// If schedule not found, flash error and redirect
	if (!schedule) {
		req.flash("error", "Training Schedule not found");
		return res.redirect("/trainingschedule");
	}

	// Check if the current user is the author of the schedule
	const isAuthor =
		req.user &&
		schedule.author &&
		schedule.author._id.toString() === req.user._id.toString();

	// Check if the user can edit or delete the schedule
	// Only the author can edit/delete, and only if the schedule is pending and not archived
	const canEdit =
		isAuthor && schedule.status === "pending" && !schedule.archived;
	const canDelete = canEdit;

	// Format author name
	let authorFullName = "";
	if (schedule.author) {
		authorFullName = schedule.author.firstName;
		if (schedule.author.middleName && schedule.author.middleName.length > 0) {
			const middleInitial = schedule.author.middleName.charAt(0).toUpperCase();
			authorFullName += ` ${middleInitial}.`;
		}
		authorFullName += ` ${schedule.author.lastName}`;
	}

	// Add these properties to the schedule object
	const scheduleObj = schedule.toObject();
	scheduleObj.isAuthor = isAuthor;
	scheduleObj.canEdit = canEdit;
	scheduleObj.canDelete = canDelete;
	scheduleObj.authorFullName = authorFullName;

	res.render("reports/trainingSchedule/show", {
		TrainingSchedule: scheduleObj,
		currentUser: req.user,
	});
});

export const renderEditForm = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Find the schedule by ID
	const schedule = await TrainingSchedule.findById(id);

	// If schedule not found, flash error and redirect
	if (!schedule) {
		req.flash("error", "Training Schedule not found");
		return res.redirect("/trainingschedule");
	}

	// Check if the current user is the author of the schedule
	const isAuthor =
		req.user &&
		schedule.author &&
		schedule.author.toString() === req.user._id.toString();

	// If not the author, flash error and redirect
	if (!isAuthor) {
		req.flash("error", "You do not have permission to edit this schedule");
		return res.redirect("/trainingschedule");
	}

	// If schedule is not pending or is archived, flash error and redirect
	if (schedule.status !== "pending" || schedule.archived) {
		req.flash(
			"error",
			"You cannot edit a schedule that has been approved, rejected, or archived"
		);
		return res.redirect("/trainingschedule");
	}

	// Format the user's full name
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	res.render("reports/trainingSchedule/edit", {
		TrainingSchedule: schedule,
		fullName,
	});
});

export const updateSchedule = catchAsync(async (req, res) => {
	const { id } = req.params;

	try {
		// Find the schedule by ID
		const schedule = await TrainingSchedule.findById(id);

		// If schedule not found, flash error and redirect
		if (!schedule) {
			req.flash("error", "Training Schedule not found");
			return res.redirect("/trainingschedule");
		}

		// Check if the current user is the author of the schedule
		const isAuthor =
			req.user &&
			schedule.author &&
			schedule.author.toString() === req.user._id.toString();

		// If not the author, flash error and redirect
		if (!isAuthor) {
			req.flash("error", "You do not have permission to edit this schedule");
			return res.redirect("/trainingschedule");
		}

		// If schedule is not pending or is archived, flash error and redirect
		if (schedule.status !== "pending" || schedule.archived) {
			req.flash(
				"error",
				"You cannot edit a schedule that has been approved, rejected, or archived"
			);
			return res.redirect("/trainingschedule");
		}

		// Extract data from the request body
		const {
			internshipSite,
			startDate,
			endDate,
			proposedActivities,
			performanceMethod,
			trainer,
			timeline,
			expectedOutput,
			additionalNotes,
		} = req.body;

		// Update the schedule
		await TrainingSchedule.findByIdAndUpdate(id, {
			internshipSite,
			startDate,
			endDate,
			proposedActivities,
			performanceMethod,
			trainer,
			timeline,
			expectedOutput,
			additionalNotes,
		});

		req.flash("success", "Successfully updated training schedule!");
		res.redirect(`/trainingschedule/${id}`);
	} catch (error) {
		console.error("Error updating training schedule:", error);

		// Handle specific validation errors from Mongoose
		if (error.name === "ValidationError") {
			Object.values(error.errors).forEach((err) => {
				req.flash("error", err.message);
			});
		} else {
			req.flash(
				"error",
				"Failed to update training schedule. Please try again."
			);
		}

		res.redirect(`/trainingschedule/${id}/edit`);
	}
});

export const deleteSchedule = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { password } = req.body;

	// Check if password was provided
	if (!password) {
		req.flash("error", "Password is required to delete a schedule");
		return res.redirect(`/trainingschedule/${id}`);
	}

	// Find the schedule by ID
	const schedule = await TrainingSchedule.findById(id);

	// If schedule not found, flash error and redirect
	if (!schedule) {
		req.flash("error", "Training Schedule not found");
		return res.redirect("/trainingschedule");
	}

	// Check if the current user is the author of the schedule or an admin
	const isAuthor =
		req.user &&
		schedule.author &&
		schedule.author.toString() === req.user._id.toString();
	const isAdmin = req.user && req.user.role === "admin";

	// If not the author or admin, flash error and redirect
	if (!isAuthor && !isAdmin) {
		req.flash("error", "You do not have permission to delete this schedule");
		return res.redirect("/trainingschedule");
	}

	// For admin users: check if the schedule is archived
	if (isAdmin && !schedule.archived) {
		req.flash("error", "You must archive the schedule before deleting it");
		return res.redirect(`/trainingschedule/${id}`);
	}

	// For regular users: check if the schedule is not pending or is archived
	if (
		isAuthor &&
		!isAdmin &&
		(schedule.status !== "pending" || schedule.archived)
	) {
		req.flash(
			"error",
			"You cannot delete a schedule that has been approved, rejected, or archived"
		);
		return res.redirect("/trainingschedule");
	}

	// Verify the user's password
	try {
		// Use passport-local-mongoose's authenticate method to verify the password
		req.user.authenticate(password, async (err, user, passwordError) => {
			if (err) {
				console.error("Authentication error:", err);
				req.flash("error", "An error occurred during authentication");
				return res.redirect(`/trainingschedule/${id}`);
			}

			if (!user) {
				req.flash("error", "Incorrect password");
				return res.redirect(`/trainingschedule/${id}`);
			}

			// Password is correct, proceed with deletion
			console.log(
				`Deleting schedule ${schedule._id}, archived: ${schedule.archived}`
			);

			try {
				// Delete the schedule
				await TrainingSchedule.findByIdAndDelete(id);

				req.flash("success", "Successfully deleted training schedule!");
				res.redirect("/trainingschedule");
			} catch (error) {
				console.error("Error deleting training schedule:", error);
				req.flash(
					"error",
					"Failed to delete training schedule. Please try again."
				);
				res.redirect(`/trainingschedule/${id}`);
			}
		});
	} catch (error) {
		console.error("Error during password verification:", error);
		req.flash("error", "An error occurred during password verification");
		res.redirect(`/trainingschedule/${id}`);
	}
});

export const archiveSchedule = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { archiveReason } = req.body;

	try {
		// Check if user is admin
		if (req.user.role !== "admin") {
			req.flash("error", "Only administrators can archive schedules");
			return res.redirect(`/trainingschedule/${id}`);
		}

		// Find the schedule by ID
		const schedule = await TrainingSchedule.findById(id);

		// If schedule not found, flash error and redirect
		if (!schedule) {
			req.flash("error", "Training Schedule not found");
			return res.redirect("/trainingschedule");
		}

		// If already archived, flash error and redirect
		if (schedule.archived) {
			req.flash("error", "This schedule is already archived");
			return res.redirect(`/trainingschedule/${id}`);
		}

		// Update the schedule to archived status
		await TrainingSchedule.findByIdAndUpdate(id, {
			archived: true,
			archivedReason: archiveReason || "No reason provided",
		});

		req.flash("success", "Successfully archived training schedule!");
		res.redirect(`/trainingschedule/${id}`);
	} catch (error) {
		console.error("Error archiving training schedule:", error);
		req.flash(
			"error",
			"Failed to archive training schedule. Please try again."
		);
		res.redirect(`/trainingschedule/${id}`);
	}
});

export const unarchiveSchedule = catchAsync(async (req, res) => {
	const { id } = req.params;

	try {
		// Check if user is admin
		if (req.user.role !== "admin") {
			req.flash("error", "Only administrators can unarchive schedules");
			return res.redirect(`/trainingschedule/${id}`);
		}

		// Find the schedule by ID
		const schedule = await TrainingSchedule.findById(id);

		// If schedule not found, flash error and redirect
		if (!schedule) {
			req.flash("error", "Training Schedule not found");
			return res.redirect("/trainingschedule");
		}

		// If not archived, flash error and redirect
		if (!schedule.archived) {
			req.flash("error", "This schedule is not archived");
			return res.redirect(`/trainingschedule/${id}`);
		}

		// Update the schedule to unarchived status
		await TrainingSchedule.findByIdAndUpdate(id, {
			archived: false,
			archivedReason: null,
		});

		req.flash("success", "Successfully unarchived training schedule!");
		res.redirect(`/trainingschedule/${id}`);
	} catch (error) {
		console.error("Error unarchiving training schedule:", error);
		req.flash(
			"error",
			"Failed to unarchive training schedule. Please try again."
		);
		res.redirect(`/trainingschedule/${id}`);
	}
});

export const exportScheduleAsPdf = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`Starting PDF export for training schedule ID: ${id}`);

	try {
		// Find the schedule with populated fields
		const schedule = await TrainingSchedule.findById(id)
			.populate("approvedBy", "username firstName middleName lastName")
			.populate("author", "username firstName middleName lastName");

		if (!schedule) {
			console.log(`Schedule not found with ID: ${id}`);
			req.flash("error", "Cannot find that training schedule!");
			return res.redirect("/trainingschedule");
		}

		console.log(`Found schedule: ${schedule._id}, status: ${schedule.status}`);

		// Check if the current user is authorized to export this schedule
		// Only the author can export the schedule
		const isAuthor =
			schedule.author && req.user && schedule.author._id.equals(req.user._id);

		if (!isAuthor) {
			console.log(
				`User ${req.user._id} is not the author of schedule ${schedule._id}`
			);
			req.flash("error", "Only the schedule owner can export to PDF");
			return res.redirect(`/trainingschedule/${id}`);
		}

		// Check if the schedule status is not approved
		if (schedule.status !== "approved") {
			console.log(
				`Schedule ${schedule._id} is not approved, cannot export to PDF`
			);
			req.flash("error", "Only approved schedules can be exported to PDF");
			return res.redirect(`/trainingschedule/${id}`);
		}

		// Validate schedule data before generating PDF
		if (!schedule.studentName || !schedule.internshipSite) {
			console.error(`Schedule ${schedule._id} is missing required fields`);
			req.flash(
				"error",
				"Schedule is missing required information for PDF export"
			);
			return res.redirect(`/trainingschedule/${id}`);
		}

		console.log(`Generating PDF for schedule ${schedule._id}`);

		// Generate the PDF file
		const buffer = await generateTrainingSchedulePdf(schedule);

		console.log(`PDF generated successfully for schedule ${schedule._id}`);

		// Set the appropriate headers for a PDF file download
		res.setHeader(
			"Content-Disposition",
			`attachment; filename=training-schedule-${id}.pdf`
		);
		res.setHeader("Content-Type", "application/pdf");

		// Send the buffer as the response
		res.send(buffer);
	} catch (error) {
		console.error(`PDF generation error for schedule ${id}:`, error);
		req.flash(
			"error",
			`Error generating PDF: ${error.message}. Please try again.`
		);
		return res.redirect(`/trainingschedule/${id}`);
	}
});

export default {
	index,
	renderNewForm,
	createSchedule,
	showSchedule,
	renderEditForm,
	updateSchedule,
	deleteSchedule,
	archiveSchedule,
	unarchiveSchedule,
	exportScheduleAsPdf,
};
