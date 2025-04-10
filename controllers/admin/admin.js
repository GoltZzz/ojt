import catchAsync from "../../utils/catchAsync.js";
import User from "../../models/users.js";
import WeeklyReport from "../../models/weeklyReports.js";
import Documentation from "../../models/documentation.js";
import TimeReport from "../../models/timeReport.js";
import ExpressError from "../../utils/ExpressError.js";

const renderDashboard = catchAsync(async (req, res) => {
	// Get total counts
	const totalUsers = await User.countDocuments({});
	const totalWeeklyReports = await WeeklyReport.countDocuments({});
	const pendingReports = await WeeklyReport.countDocuments({
		status: "pending",
	});
	const totalDocumentation = await Documentation.countDocuments({});
	const totalTimeReports = await TimeReport.countDocuments({});

	// Get only regular users (exclude admins)
	const users = await User.find({ role: "user" });

	// Get stats for each user
	const userStats = await Promise.all(
		users.map(async (user) => {
			const weeklyReports = await WeeklyReport.countDocuments({
				author: user._id,
			});
			const documentation = await Documentation.countDocuments({
				author: user._id,
			});
			const timeReports = await TimeReport.countDocuments({ author: user._id });

			// Format the name as requested: FirstName MiddleInitial. LastName
			let fullName = user.firstName;

			// Add middle initial if available
			if (user.middleName && user.middleName.length > 0) {
				const middleInitial = user.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			// Add last name
			fullName += ` ${user.lastName}`;

			return {
				fullName,
				weeklyReports,
				documentation,
				timeReports,
			};
		})
	);

	// Prepare stats object
	const stats = {
		totalUsers,
		totalWeeklyReports,
		pendingReports,
		totalDocumentation,
		totalTimeReports,
	};

	res.render("admin/dashboard", { stats, userStats });
});

const renderUsers = catchAsync(async (req, res) => {
	const users = await User.find({});
	res.render("admin/users", { users });
});

const toggleUserRole = catchAsync(async (req, res) => {
	const { id } = req.params;
	const user = await User.findById(id);
	if (!user) {
		req.flash("error", "User not found");
		return res.redirect("/admin/users");
	}
	user.role = user.role === "admin" ? "user" : "admin";
	await user.save();

	req.flash("success", `${user.username}'s role updated to ${user.role}`);
	res.redirect("/admin/users");
});

const renderPendingReports = catchAsync(async (req, res) => {
	// Get filter parameters from query string
	const {
		reportType,
		studentName,
		internshipSite,
		weekPeriod,
		sortBy = "dateSubmitted_desc",
	} = req.query;

	// Build the filter object
	const filter = {
		status: "pending",
		archived: false,
	};

	// Add report type filter if provided
	if (reportType) {
		filter.reportType = reportType;
	}

	// Add student name filter if provided (case-insensitive partial match)
	if (studentName) {
		filter.studentName = { $regex: studentName, $options: "i" };
	}

	// Add internship site filter if provided (case-insensitive partial match)
	if (internshipSite) {
		filter.internshipSite = { $regex: internshipSite, $options: "i" };
	}

	// Add week period filter if provided
	if (weekPeriod) {
		const weekDate = new Date(weekPeriod);
		filter.$or = [
			{ weekStartDate: { $lte: weekDate }, weekEndDate: { $gte: weekDate } },
			{ date: weekDate }, // For time reports with a single date
		];
	}

	// Determine sort order
	let sortOptions = {};
	if (sortBy) {
		const [field, order] = sortBy.split("_");
		sortOptions[field] = order === "asc" ? 1 : -1;
	} else {
		sortOptions = { dateSubmitted: -1 }; // Default sort
	}

	// Get all pending reports with filters
	const pendingReports = await WeeklyReport.find(filter)
		.populate("author")
		.sort(sortOptions);

	// Format user names
	pendingReports.forEach((report) => {
		if (report.author) {
			// Format the name as requested: FirstName MiddleInitial. LastName
			let fullName = report.author.firstName;

			// Add middle initial if available
			if (report.author.middleName && report.author.middleName.length > 0) {
				const middleInitial = report.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			// Add last name
			fullName += ` ${report.author.lastName}`;

			report.authorFullName = fullName;
		}
	});

	res.render("admin/pending-reports", {
		pendingReports,
		filters: req.query, // Pass the filters back to the template
	});
});

const renderAllReports = catchAsync(async (req, res) => {
	// Get filter parameters from query string
	const {
		reportType,
		studentName,
		internshipSite,
		weekPeriod,
		status,
		archived,
		sortBy = "dateSubmitted_desc",
	} = req.query;

	// Build the filter object
	const filter = {};

	// Add report type filter if provided
	if (reportType) {
		filter.reportType = reportType;
	}

	// Add student name filter if provided (case-insensitive partial match)
	if (studentName) {
		filter.studentName = { $regex: studentName, $options: "i" };
	}

	// Add internship site filter if provided (case-insensitive partial match)
	if (internshipSite) {
		filter.internshipSite = { $regex: internshipSite, $options: "i" };
	}

	// Add week period filter if provided
	if (weekPeriod) {
		const weekDate = new Date(weekPeriod);
		filter.$or = [
			{ weekStartDate: { $lte: weekDate }, weekEndDate: { $gte: weekDate } },
			{ date: weekDate }, // For time reports with a single date
		];
	}

	// Add status filter if provided
	if (status) {
		filter.status = status;
	}

	// Add archived filter if provided
	if (archived !== undefined && archived !== "") {
		filter.archived = archived === "true";
	}

	// Determine sort order
	let sortOptions = {};
	if (sortBy) {
		const [field, order] = sortBy.split("_");
		sortOptions[field] = order === "asc" ? 1 : -1;
	} else {
		sortOptions = { dateSubmitted: -1 }; // Default sort
	}

	// Get all reports with filters
	const allReports = await WeeklyReport.find(filter)
		.populate("author")
		.populate("approvedBy")
		.sort(sortOptions);

	// Format user names
	allReports.forEach((report) => {
		// Format author name
		if (report.author) {
			// Format the name as requested: FirstName MiddleInitial. LastName
			let fullName = report.author.firstName;

			// Add middle initial if available
			if (report.author.middleName && report.author.middleName.length > 0) {
				const middleInitial = report.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			// Add last name
			fullName += ` ${report.author.lastName}`;

			report.authorFullName = fullName;
		}

		// Format approver name
		if (report.approvedBy) {
			// Format the name as requested: FirstName MiddleInitial. LastName
			let fullName = report.approvedBy.firstName;

			// Add middle initial if available
			if (
				report.approvedBy.middleName &&
				report.approvedBy.middleName.length > 0
			) {
				const middleInitial = report.approvedBy.middleName
					.charAt(0)
					.toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			// Add last name
			fullName += ` ${report.approvedBy.lastName}`;

			report.approverFullName = fullName;
		}
	});

	res.render("admin/all-reports", {
		allReports,
		filters: req.query, // Pass the filters back to the template
	});
});

const approveReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { status, adminComments } = req.body;

	const report = await WeeklyReport.findById(id);
	if (!report) {
		req.flash("error", "Report not found");
		return res.redirect("/admin/pending-reports");
	}

	// Update report status
	report.status = status || "approved";
	report.approvedBy = req.user._id;
	report.approvalDate = new Date();
	report.adminComments = adminComments;

	await report.save();

	req.flash(
		"success",
		`Report ${report.status === "approved" ? "approved" : "rejected"}`
	);
	res.redirect("/admin/pending-reports");
});

const renderArchivedReports = catchAsync(async (req, res) => {
	// Get filter parameters from query string
	const {
		reportType,
		studentName,
		internshipSite,
		weekPeriod,
		status,
		sortBy = "dateSubmitted_desc",
	} = req.query;

	// Build the filter object - only show archived reports
	const filter = { archived: true };

	// Add report type filter if provided
	if (reportType) {
		filter.reportType = reportType;
	}

	// Add student name filter if provided (case-insensitive partial match)
	if (studentName) {
		filter.studentName = { $regex: studentName, $options: "i" };
	}

	// Add internship site filter if provided (case-insensitive partial match)
	if (internshipSite) {
		filter.internshipSite = { $regex: internshipSite, $options: "i" };
	}

	// Add week period filter if provided
	if (weekPeriod) {
		const weekDate = new Date(weekPeriod);
		filter.$or = [
			{ weekStartDate: { $lte: weekDate }, weekEndDate: { $gte: weekDate } },
			{ date: weekDate }, // For time reports with a single date
		];
	}

	// Add status filter if provided
	if (status) {
		filter.status = status;
	}

	// Determine sort order
	let sortOptions = {};
	if (sortBy) {
		const [field, order] = sortBy.split("_");
		sortOptions[field] = order === "asc" ? 1 : -1;
	} else {
		sortOptions = { dateSubmitted: -1 }; // Default sort
	}

	// Get all archived reports with filters
	const archivedReports = await WeeklyReport.find(filter)
		.populate("author")
		.populate("approvedBy")
		.sort(sortOptions);

	// Format user names
	archivedReports.forEach((report) => {
		// Format author name
		if (report.author) {
			// Format the name as requested: FirstName MiddleInitial. LastName
			let fullName = report.author.firstName;

			// Add middle initial if available
			if (report.author.middleName && report.author.middleName.length > 0) {
				const middleInitial = report.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			// Add last name
			fullName += ` ${report.author.lastName}`;

			report.authorFullName = fullName;
		}

		// Format approver name
		if (report.approvedBy) {
			// Format the name as requested: FirstName MiddleInitial. LastName
			let fullName = report.approvedBy.firstName;

			// Add middle initial if available
			if (
				report.approvedBy.middleName &&
				report.approvedBy.middleName.length > 0
			) {
				const middleInitial = report.approvedBy.middleName
					.charAt(0)
					.toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			// Add last name
			fullName += ` ${report.approvedBy.lastName}`;

			report.approverFullName = fullName;
		}
	});

	res.render("admin/archived-reports", {
		archivedReports,
		filters: req.query, // Pass the filters back to the template
	});
});

// Function to delete a user and archive their reports
const deleteUser = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Find the user
	const user = await User.findById(id);

	if (!user) {
		req.flash("error", "User not found");
		return res.redirect("/admin/users");
	}

	// Archive all reports by this user
	await WeeklyReport.updateMany(
		{ author: user._id },
		{ archived: true, archivedReason: "User deleted" }
	);

	// Archive all documentation by this user
	await Documentation.updateMany(
		{ author: user._id },
		{ archived: true, archivedReason: "User deleted" }
	);

	// Archive all time reports by this user
	await TimeReport.updateMany(
		{ author: user._id },
		{ archived: true, archivedReason: "User deleted" }
	);

	// Delete the user
	await User.findByIdAndDelete(id);

	req.flash(
		"success",
		`User ${user.username} has been deleted and their reports archived`
	);
	res.redirect("/admin/users");
});

// Function to unarchive a report
const unarchiveReport = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Find the report
	const report = await WeeklyReport.findById(id);

	if (!report) {
		req.flash("error", "Report not found");
		return res.redirect("/admin/archived-reports");
	}

	// Unarchive the report
	report.archived = false;
	report.archivedReason = "";
	await report.save();

	req.flash("success", "Report has been unarchived");
	res.redirect("/admin/archived-reports");
});

export default {
	renderDashboard,
	renderUsers,
	toggleUserRole,
	renderPendingReports,
	renderAllReports,
	approveReport,
	renderArchivedReports,
	deleteUser,
	unarchiveReport,
};
