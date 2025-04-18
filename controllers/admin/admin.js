import catchAsync from "../../utils/catchAsync.js";
import User from "../../models/users.js";
import WeeklyReport from "../../models/weeklyReports.js";
import Documentation from "../../models/documentation.js";
import TimeReport from "../../models/timeReport.js";
import WeeklyProgressReport from "../../models/weeklyProgressReports.js";
import TrainingSchedule from "../../models/trainingSchedule.js";
import LearningOutcome from "../../models/learningOutcomes.js";
import DailyAttendance from "../../models/dailyAttendance.js";
import ExpressError from "../../utils/ExpressError.js";
import { cloudinary } from "../../utils/cloudinary.js";

const renderDashboard = catchAsync(async (req, res) => {
	const totalUsers = await User.countDocuments({});

	// Count reports by type
	const totalWeeklyReports = await WeeklyReport.countDocuments({});
	const totalWeeklyProgressReports = await WeeklyProgressReport.countDocuments(
		{}
	);
	const totalTrainingSchedules = await TrainingSchedule.countDocuments({});
	const totalLearningOutcomes = await LearningOutcome.countDocuments({});
	const totalDailyAttendances = await DailyAttendance.countDocuments({});

	// Count pending reports by type
	const pendingWeeklyReports = await WeeklyReport.countDocuments({
		status: "pending",
	});
	const pendingWeeklyProgressReports =
		await WeeklyProgressReport.countDocuments({
			status: "pending",
		});
	const pendingTrainingSchedules = await TrainingSchedule.countDocuments({
		status: "pending",
	});
	const pendingLearningOutcomes = await LearningOutcome.countDocuments({
		status: "pending",
	});
	const pendingDailyAttendances = await DailyAttendance.countDocuments({
		status: "pending",
	});

	// Calculate total pending reports
	const pendingReports =
		pendingWeeklyReports +
		pendingWeeklyProgressReports +
		pendingTrainingSchedules +
		pendingLearningOutcomes +
		pendingDailyAttendances;

	const totalDocumentation = await Documentation.countDocuments({});
	const totalTimeReports = await TimeReport.countDocuments({});
	const users = await User.find({ role: "user" });

	const userStats = await Promise.all(
		users.map(async (user) => {
			// Count reports by type for this user
			const weeklyReports = await WeeklyReport.countDocuments({
				author: user._id,
			});
			const weeklyProgressReports = await WeeklyProgressReport.countDocuments({
				author: user._id,
			});
			const trainingSchedules = await TrainingSchedule.countDocuments({
				author: user._id,
			});
			const learningOutcomes = await LearningOutcome.countDocuments({
				author: user._id,
			});
			const dailyAttendances = await DailyAttendance.countDocuments({
				author: user._id,
			});
			const documentation = await Documentation.countDocuments({
				author: user._id,
			});
			const timeReports = await TimeReport.countDocuments({ author: user._id });

			// Format user's full name
			let fullName = user.firstName;
			if (user.middleName && user.middleName.length > 0) {
				const middleInitial = user.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}
			fullName += ` ${user.lastName}`;

			return {
				fullName,
				weeklyReports,
				weeklyProgressReports,
				trainingSchedules,
				learningOutcomes,
				dailyAttendances,
				documentation,
				timeReports,
			};
		})
	);
	const stats = {
		totalUsers,
		totalWeeklyReports,
		totalWeeklyProgressReports,
		totalTrainingSchedules,
		totalLearningOutcomes,
		totalDailyAttendances,
		pendingReports,
		pendingWeeklyReports,
		pendingWeeklyProgressReports,
		pendingTrainingSchedules,
		pendingLearningOutcomes,
		pendingDailyAttendances,
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

	// Get the old role for the message
	const oldRole = user.role;

	// Toggle the role
	user.role = user.role === "admin" ? "user" : "admin";
	await user.save();

	// Create a more descriptive success message
	req.flash(
		"success",
		`${user.username}'s role has been changed from ${oldRole} to ${user.role}`
	);
	res.redirect("/admin/users");
});

const renderPendingReports = catchAsync(async (req, res) => {
	const {
		reportType,
		studentName,
		internshipSite,
		weekPeriod,
		sortBy = "dateSubmitted_desc",
	} = req.query;
	const filter = {
		status: "pending",
		archived: false,
	};
	if (reportType) {
		filter.reportType = reportType;
	}

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
			{ date: weekDate },
		];
	}
	let sortOptions = {};
	if (sortBy) {
		const [field, order] = sortBy.split("_");
		sortOptions[field] = order === "asc" ? 1 : -1;
	} else {
		sortOptions = { dateSubmitted: -1 };
	}
	const pendingReports = await WeeklyReport.find(filter)
		.populate("author")
		.sort(sortOptions);

	pendingReports.forEach((report) => {
		if (report.author) {
			let fullName = report.author.firstName;

			if (report.author.middleName && report.author.middleName.length > 0) {
				const middleInitial = report.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			fullName += ` ${report.author.lastName}`;

			report.authorFullName = fullName;
		}
	});

	res.render("admin/pending-reports", {
		pendingReports,
		filters: req.query,
	});
});

const renderAllReports = catchAsync(async (req, res) => {
	const {
		reportType,
		studentName,
		internshipSite,
		weekPeriod,
		status,
		archived,
		sortBy = "dateSubmitted_desc",
	} = req.query;

	// By default, exclude archived reports
	const filter = { archived: false };

	if (reportType) {
		filter.reportType = reportType;
	}

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
			{ date: weekDate },
		];
	}
	if (status) {
		filter.status = status;
	}

	// Override the default archived filter if explicitly specified in the query
	if (archived !== undefined && archived !== "") {
		if (archived === "all") {
			// Remove the archived filter to show all reports
			delete filter.archived;
		} else {
			filter.archived = archived === "true";
		}
	}

	let sortOptions = {};
	if (sortBy) {
		const [field, order] = sortBy.split("_");
		sortOptions[field] = order === "asc" ? 1 : -1;
	} else {
		sortOptions = { dateSubmitted: -1 };
	}

	const allReports = await WeeklyReport.find(filter)
		.populate("author")
		.populate("approvedBy")
		.sort(sortOptions);

	allReports.forEach((report) => {
		if (report.author) {
			let fullName = report.author.firstName;
			if (report.author.middleName && report.author.middleName.length > 0) {
				const middleInitial = report.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			fullName += ` ${report.author.lastName}`;

			report.authorFullName = fullName;
		}

		if (report.approvedBy) {
			let fullName = report.approvedBy.firstName;
			if (
				report.approvedBy.middleName &&
				report.approvedBy.middleName.length > 0
			) {
				const middleInitial = report.approvedBy.middleName
					.charAt(0)
					.toUpperCase();
				fullName += ` ${middleInitial}.`;
			}
			fullName += ` ${report.approvedBy.lastName}`;

			report.approverFullName = fullName;
		}
	});

	res.render("admin/all-reports", {
		allReports,
		filters: req.query,
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
	const {
		reportType,
		studentName,
		internshipSite,
		weekPeriod,
		status,
		sortBy = "dateSubmitted_desc",
	} = req.query;

	const filter = { archived: true };

	if (reportType) {
		filter.reportType = reportType;
	}

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
			{ date: weekDate },
		];
	}

	if (status) {
		filter.status = status;
	}

	let sortOptions = {};
	if (sortBy) {
		const [field, order] = sortBy.split("_");
		sortOptions[field] = order === "asc" ? 1 : -1;
	} else {
		sortOptions = { dateSubmitted: -1 };
	}

	const archivedReports = await WeeklyReport.find(filter)
		.populate("author")
		.populate("approvedBy")
		.sort(sortOptions);

	archivedReports.forEach((report) => {
		if (report.author) {
			let fullName = report.author.firstName;

			if (report.author.middleName && report.author.middleName.length > 0) {
				const middleInitial = report.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			fullName += ` ${report.author.lastName}`;

			report.authorFullName = fullName;
		}

		if (report.approvedBy) {
			let fullName = report.approvedBy.firstName;

			if (
				report.approvedBy.middleName &&
				report.approvedBy.middleName.length > 0
			) {
				const middleInitial = report.approvedBy.middleName
					.charAt(0)
					.toUpperCase();
				fullName += ` ${middleInitial}.`;
			}

			fullName += ` ${report.approvedBy.lastName}`;

			report.approverFullName = fullName;
		}
	});

	res.render("admin/archived-reports", {
		archivedReports,
		filters: req.query,
	});
});

const deleteUser = catchAsync(async (req, res) => {
	const { id } = req.params;

	const user = await User.findById(id);

	if (!user) {
		req.flash("error", "User not found");
		return res.redirect("/admin/users");
	}

	await WeeklyReport.updateMany(
		{ author: user._id },
		{ archived: true, archivedReason: "User deleted" }
	);

	await Documentation.updateMany(
		{ author: user._id },
		{ archived: true, archivedReason: "User deleted" }
	);

	await TimeReport.updateMany(
		{ author: user._id },
		{ archived: true, archivedReason: "User deleted" }
	);

	await User.findByIdAndDelete(id);

	req.flash(
		"success",
		`User ${user.username} has been deleted and their reports archived`
	);
	res.redirect("/admin/users");
});

const unarchiveReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`⏳ Running unarchive for report ID: ${id}`);

	const report = await WeeklyReport.findById(id);

	if (!report) {
		console.log(`❌ Report not found with ID: ${id}`);
		req.flash("error", "Report not found");
		return res.redirect("/admin/archived-reports");
	}

	console.log(
		`📝 Found report: ${report._id}, current archived status: ${report.archived}`
	);
	report.archived = false;
	report.archivedReason = "";
	await report.save();
	console.log(`✅ Report unarchived successfully: ${report._id}`);

	// Set a success flash message
	req.flash("success", "Report has been unarchived successfully");

	// Redirect back to the archived reports page
	// This will reload the page and show only the remaining archived reports
	res.redirect("/admin/archived-reports");
});

const renderRegisterForm = catchAsync(async (req, res) => {
	res.render("admin/register");
});

const registerUser = catchAsync(async (req, res) => {
	try {
		const { username, password, firstName, middleName, lastName, role } =
			req.body;

		// Check if username already exists
		const existingUser = await User.findOne({ username });
		if (existingUser) {
			req.flash(
				"error",
				"Username already exists. Please choose a different username."
			);
			return res.redirect("/admin/register");
		}

		// Validate password
		const isLengthValid = password.length >= 8 && password.length <= 16;
		const hasUppercase = /[A-Z]/.test(password);
		const hasNoSpecialChars = !/[^a-zA-Z0-9]/.test(password);

		if (!isLengthValid || !hasUppercase || !hasNoSpecialChars) {
			let errorMessage = "Password does not meet the requirements: ";
			if (!isLengthValid) {
				errorMessage += "must be between 8-16 characters. ";
			}
			if (!hasUppercase) {
				errorMessage += "must contain at least one uppercase letter. ";
			}
			if (!hasNoSpecialChars) {
				errorMessage += "must not contain special characters. ";
			}

			req.flash("error", errorMessage);
			return res.redirect("/admin/register");
		}

		const user = new User({
			username,
			firstName,
			middleName,
			lastName,
			role: role || "user",
		});

		// Handle profile image if uploaded
		if (req.file) {
			user.profileImage = {
				url: req.file.path,
				publicId: req.file.filename,
			};
		}

		const registeredUser = await User.register(user, password);
		await registeredUser.save();
		req.flash("success", `User ${username} has been registered successfully`);
		return res.redirect("/admin/users");
	} catch (error) {
		// If there was an error and we uploaded an image, delete it from Cloudinary
		if (req.file && req.file.path) {
			await cloudinary.uploader.destroy(req.file.filename);
		}

		// Handle passport-local-mongoose errors
		if (error.name === "UserExistsError") {
			req.flash(
				"error",
				"Username already exists. Please choose a different username."
			);
		} else {
			req.flash("error", error.message);
		}
		return res.redirect("/admin/register");
	}
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
	renderRegisterForm,
	registerUser,
};
