import catchAsync from "../../utils/catchAsync.js";
import ExpressError from "../../utils/ExpressError.js";
import DailyAttendance from "../../models/dailyAttendance.js";

export const index = catchAsync(async (req, res) => {
	// Get query parameters for filtering and pagination
	const {
		studentName,
		internshipSite,
		date,
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

	if (date) {
		const searchDate = new Date(date);
		// Set time to midnight to compare just the date
		searchDate.setHours(0, 0, 0, 0);

		// Create a date range for the entire day
		const nextDay = new Date(searchDate);
		nextDay.setDate(nextDay.getDate() + 1);

		filter.date = { $gte: searchDate, $lt: nextDay };
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
	const totalReports = await DailyAttendance.countDocuments(filter);
	const totalPages = Math.ceil(totalReports / limitNum);

	// Get attendance records with pagination
	const DailyAttendances = await DailyAttendance.find(filter)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username")
		.sort(sortOptions)
		.skip(skip)
		.limit(limitNum);

	// Format author names and add isCurrentUserReport flag
	DailyAttendances.forEach((attendance) => {
		if (attendance.author) {
			// Format author full name
			let fullName = attendance.author.firstName;
			if (
				attendance.author.middleName &&
				attendance.author.middleName.length > 0
			) {
				const middleInitial = attendance.author.middleName
					.charAt(0)
					.toUpperCase();
				fullName += ` ${middleInitial}.`;
			}
			fullName += ` ${attendance.author.lastName}`;
			attendance.authorFullName = fullName;

			// Check if this attendance record belongs to the current user
			attendance.isCurrentUserReport =
				req.user && attendance.author._id.equals(req.user._id);
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

	res.render("reports/dailyAttendance/index", {
		DailyAttendances,
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

	res.render("reports/dailyAttendance/new", { fullName });
};

export const createAttendance = catchAsync(async (req, res) => {
	// This is just a placeholder for now
	req.flash("success", "Successfully created a new daily attendance record!");
	res.redirect("/dailyattendance");
});

export const showAttendance = catchAsync(async (req, res, next) => {
	// This is just a placeholder for now
	res.render("reports/dailyAttendance/show", {
		DailyAttendance: {
			_id: req.params.id,
			studentName: "Sample Student",
			internshipSite: "Sample Site",
			date: new Date().toLocaleDateString(),
			status: "pending",
			isAuthor: true,
			canEdit: true,
			canDelete: true,
		},
	});
});

export const renderEditForm = catchAsync(async (req, res) => {
	// This is just a placeholder for now
	res.render("reports/dailyAttendance/edit", {
		DailyAttendance: {
			_id: req.params.id,
			studentName: "Sample Student",
			internshipSite: "Sample Site",
			date: new Date(),
		},
		fullName: "Sample Student",
	});
});

export const updateAttendance = catchAsync(async (req, res) => {
	// This is just a placeholder for now
	req.flash("success", "Successfully updated daily attendance record!");
	res.redirect(`/dailyattendance/${req.params.id}`);
});

export const deleteAttendance = catchAsync(async (req, res) => {
	// This is just a placeholder for now
	req.flash("success", "Successfully deleted daily attendance record!");
	res.redirect("/dailyattendance");
});

export default {
	index,
	renderNewForm,
	createAttendance,
	showAttendance,
	renderEditForm,
	updateAttendance,
	deleteAttendance,
};
