import catchAsync from "../../utils/catchAsync.js";
import ExpressError from "../../utils/ExpressError.js";
import TrainingSchedule from "../../models/trainingSchedule.js";

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
	// This is just a placeholder for now
	res.render("reports/trainingSchedule/show", {
		TrainingSchedule: {
			_id: req.params.id,
			studentName: "Sample Student",
			internshipSite: "Sample Site",
			startDate: new Date().toLocaleDateString(),
			endDate: new Date().toLocaleDateString(),
			status: "pending",
			isAuthor: true,
			canEdit: true,
			canDelete: true,
		},
	});
});

export const renderEditForm = catchAsync(async (req, res) => {
	// This is just a placeholder for now
	res.render("reports/trainingSchedule/edit", {
		TrainingSchedule: {
			_id: req.params.id,
			studentName: "Sample Student",
			internshipSite: "Sample Site",
			startDate: new Date(),
			endDate: new Date(),
		},
		fullName: "Sample Student",
	});
});

export const updateSchedule = catchAsync(async (req, res) => {
	// This is just a placeholder for now
	req.flash("success", "Successfully updated training schedule!");
	res.redirect(`/trainingschedule/${req.params.id}`);
});

export const deleteSchedule = catchAsync(async (req, res) => {
	// This is just a placeholder for now
	req.flash("success", "Successfully deleted training schedule!");
	res.redirect("/trainingschedule");
});

export default {
	index,
	renderNewForm,
	createSchedule,
	showSchedule,
	renderEditForm,
	updateSchedule,
	deleteSchedule,
};
