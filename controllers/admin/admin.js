import catchAsync from "../../utils/catchAsync.js";
import User from "../../models/users.js";
import WeeklyReport from "../../models/weeklyReports.js";
import TimeReport from "../../models/timeReport.js";
import Notification from "../../models/notification.js";
import ExpressError from "../../utils/ExpressError.js";
import { cloudinary } from "../../utils/cloudinary.js";

const renderDashboard = catchAsync(async (req, res) => {
	const totalUsers = await User.countDocuments({});

	// Count reports by type
	const totalWeeklyReports = await WeeklyReport.countDocuments({});
	const totalTimeReports = await TimeReport.countDocuments({});

	// Count pending reports by type
	const pendingWeeklyReports = await WeeklyReport.countDocuments({
		status: "pending",
		archived: false,
	});
	const pendingTimeReports = await TimeReport.countDocuments({
		status: "pending",
		archived: false,
	});

	// Calculate total pending reports
	const pendingReports = pendingWeeklyReports + pendingTimeReports;

	// Get user statistics - EXCLUDE admin users
	const users = await User.find({ role: "user" });
	const userStats = await Promise.all(
		users.map(async (user) => {
			const weeklyReports = await WeeklyReport.countDocuments({
				author: user._id,
			});
			const timeReports = await TimeReport.countDocuments({
				author: user._id,
			});

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
				timeReports,
			};
		})
	);

	const stats = {
		totalUsers,
		totalWeeklyReports,
		totalTimeReports,
		pendingReports,
		pendingWeeklyReports,
		pendingTimeReports,
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
		reportType = "all",
		studentName,
		internshipSite,
		weekPeriod,
		sortBy = "dateSubmitted_desc",
	} = req.query;
	const filter = {
		status: "pending",
		archived: false,
	};

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

	const formatReportNames = (reports) => {
		return reports.map((report) => {
			if (report.author) {
				let fullName = report.author.firstName;
				if (report.author.middleName && report.author.middleName.length > 0) {
					const middleInitial = report.author.middleName
						.charAt(0)
						.toUpperCase();
					fullName += ` ${middleInitial}.`;
				}
				fullName += ` ${report.author.lastName}`;
				report.authorFullName = fullName;
			}

			if (report.needsRevision && report.status === "pending") {
				report.isRevised = true;
			}

			report.reportTypeFormatted =
				report.reportType || report.constructor.modelName;
			return report;
		});
	};

	let pendingReports = [];

	if (reportType === "all" || reportType === "weeklyreport") {
		const weeklyReports = await WeeklyReport.find(filter)
			.populate("author")
			.sort(sortOptions);

		weeklyReports.forEach((report) => {
			report.reportType = "weeklyreport";
		});
		pendingReports = [...pendingReports, ...weeklyReports];
	}

	if (reportType === "all" || reportType === "timereport") {
		const timeReports = await TimeReport.find(filter)
			.populate("author")
			.sort(sortOptions);

		timeReports.forEach((report) => {
			report.reportType = "timereport";
		});
		pendingReports = [...pendingReports, ...timeReports];
	}

	if (sortBy) {
		const [field, order] = sortBy.split("_");
		const sortMultiplier = order === "asc" ? 1 : -1;

		pendingReports.sort((a, b) => {
			if (field === "dateSubmitted") {
				return (
					(new Date(a.dateSubmitted) - new Date(b.dateSubmitted)) *
					sortMultiplier
				);
			}
			return 0;
		});
	}

	const formattedReports = formatReportNames(pendingReports);

	res.render("admin/pending-reports", {
		pendingReports: formattedReports,
		filters: req.query,
		reportTypes: [
			{ value: "all", label: "All Reports" },
			{ value: "weeklyreport", label: "Weekly Reports" },
			{ value: "timereport", label: "Time Reports" },
		],
	});
});

const renderAllReports = catchAsync(async (req, res) => {
	const {
		reportType = "all",
		studentName,
		internshipSite,
		weekPeriod,
		status,
		archived,
		sortBy = "dateSubmitted_desc",
	} = req.query;

	const filter = { archived: false };

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

	if (archived !== undefined && archived !== "") {
		if (archived === "all") {
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

	const formatReportNames = (reports) => {
		return reports.map((report) => {
			if (report.author) {
				let fullName = report.author.firstName;
				if (report.author.middleName && report.author.middleName.length > 0) {
					const middleInitial = report.author.middleName
						.charAt(0)
						.toUpperCase();
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

			report.reportTypeFormatted =
				report.reportType || report.constructor.modelName;
			return report;
		});
	};

	let allReports = [];

	if (reportType === "all" || reportType === "weeklyreport") {
		const weeklyReports = await WeeklyReport.find(filter)
			.populate("author")
			.populate("approvedBy")
			.sort(sortOptions);

		weeklyReports.forEach((report) => {
			report.reportType = "weeklyreport";
		});
		allReports = [...allReports, ...weeklyReports];
	}

	if (reportType === "all" || reportType === "timereport") {
		const timeReports = await TimeReport.find(filter)
			.populate("author")
			.populate("approvedBy")
			.sort(sortOptions);

		timeReports.forEach((report) => {
			report.reportType = "timereport";
		});
		allReports = [...allReports, ...timeReports];
	}

	if (sortBy) {
		const [field, order] = sortBy.split("_");
		const sortMultiplier = order === "asc" ? 1 : -1;

		allReports.sort((a, b) => {
			if (field === "dateSubmitted") {
				return (
					(new Date(a.dateSubmitted) - new Date(b.dateSubmitted)) *
					sortMultiplier
				);
			}
			return 0;
		});
	}

	const formattedReports = formatReportNames(allReports);

	res.render("admin/all-reports", {
		allReports: formattedReports,
		filters: req.query,
		reportTypes: [
			{ value: "all", label: "All Reports" },
			{ value: "weeklyreport", label: "Weekly Reports" },
			{ value: "timereport", label: "Time Reports" },
		],
	});
});

const renderArchivedReports = catchAsync(async (req, res) => {
	const {
		reportType = "all",
		studentName,
		internshipSite,
		weekPeriod,
		status,
		sortBy = "dateSubmitted_desc",
	} = req.query;

	const filter = { archived: true };

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

	const formatReportNames = (reports) => {
		return reports.map((report) => {
			if (report.author) {
				let fullName = report.author.firstName;
				if (report.author.middleName && report.author.middleName.length > 0) {
					const middleInitial = report.author.middleName
						.charAt(0)
						.toUpperCase();
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

			report.reportTypeFormatted =
				report.reportType || report.constructor.modelName;
			return report;
		});
	};

	let archivedReports = [];

	if (reportType === "all" || reportType === "weeklyreport") {
		const weeklyReports = await WeeklyReport.find(filter)
			.populate("author")
			.populate("approvedBy")
			.sort(sortOptions);

		weeklyReports.forEach((report) => {
			report.reportType = "weeklyreport";
		});
		archivedReports = [...archivedReports, ...weeklyReports];
	}

	if (reportType === "all" || reportType === "timereport") {
		const timeReports = await TimeReport.find(filter)
			.populate("author")
			.populate("approvedBy")
			.sort(sortOptions);

		timeReports.forEach((report) => {
			report.reportType = "timereport";
		});
		archivedReports = [...archivedReports, ...timeReports];
	}

	if (sortBy) {
		const [field, order] = sortBy.split("_");
		const sortMultiplier = order === "asc" ? 1 : -1;

		archivedReports.sort((a, b) => {
			if (field === "dateSubmitted") {
				return (
					(new Date(a.dateSubmitted) - new Date(b.dateSubmitted)) *
					sortMultiplier
				);
			}
			return 0;
		});
	}

	const formattedReports = formatReportNames(archivedReports);

	res.render("admin/archived-reports", {
		archivedReports: formattedReports,
		filters: req.query,
		reportTypes: [
			{ value: "all", label: "All Reports" },
			{ value: "weeklyreport", label: "Weekly Reports" },
			{ value: "timereport", label: "Time Reports" },
		],
	});
});

const deleteUser = catchAsync(async (req, res) => {
	const { id } = req.params;

	const user = await User.findById(id);

	if (!user) {
		req.flash("error", "User not found");
		return res.redirect("/admin/users");
	}

	// Archive all report types
	await WeeklyReport.updateMany(
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
	const { id, type } = req.params;
	console.log(`⏳ Running unarchive for report ID: ${id}, type: ${type}`);

	let report;
	let redirectUrl = "/admin/archived-reports";

	// Find the appropriate report type
	switch (type) {
		case "weeklyreport":
			report = await WeeklyReport.findById(id).populate("author");
			break;
		case "timereport":
			report = await TimeReport.findById(id).populate("author");
			break;
		default:
			console.log(`❌ Invalid report type: ${type}`);
			req.flash("error", "Invalid report type");
			return res.redirect(redirectUrl);
	}

	if (!report) {
		console.log(`❌ Report not found with ID: ${id}`);
		req.flash("error", "Report not found");
		return res.redirect(redirectUrl);
	}

	console.log(
		`📝 Found report: ${report._id}, current archived status: ${report.archived}`
	);
	report.archived = false;
	report.archivedReason = "";
	await report.save();
	console.log(`✅ Report unarchived successfully: ${report._id}`);

	// Create notification for the report author
	if (report.author) {
		const reportName = getReportTypeName(type);

		const notification = new Notification({
			recipient: report.author._id,
			message: `Your ${reportName} has been unarchived by an administrator.`,
			type: "info",
			reportType: type,
			reportId: report._id,
			action: "unarchived",
		});

		await notification.save();
	}

	// Set a success flash message
	req.flash("success", "Report has been unarchived successfully");

	// Redirect back to the archived reports page
	// This will reload the page and show only the remaining archived reports
	res.redirect(redirectUrl);
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

			// Check if this is the first user
		const userCount = await User.countDocuments({});
		let assignedRole = role || "user";
		if (userCount === 0) {
			assignedRole = "admin";
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
			role: assignedRole,
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

// Helper function to get report type name
const getReportTypeName = (type) => {
	switch (type) {
		case "weeklyreport":
			return "Weekly Report";
		case "timereport":
			return "Time Report";
		default:
			return "Report";
	}
};

export default {
	renderDashboard,
	renderUsers,
	toggleUserRole,
	renderPendingReports,
	renderAllReports,
	renderArchivedReports,
	deleteUser,
	unarchiveReport,
	renderRegisterForm,
	registerUser,
};
