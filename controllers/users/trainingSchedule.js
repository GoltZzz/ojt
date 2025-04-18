import catchAsync from "../../utils/catchAsync.js";
import ExpressError from "../../utils/ExpressError.js";
import TrainingSchedule from "../../models/trainingSchedule.js";

export const index = catchAsync(async (req, res) => {
	// Get query parameters for filtering and pagination
	const {
		studentName,
		internshipSite,
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
	// This is just a placeholder for now
	req.flash("success", "Successfully created a new training schedule!");
	res.redirect("/trainingschedule");
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
