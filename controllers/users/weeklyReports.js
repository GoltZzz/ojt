import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import Notification from "../../models/notification.js";
import User from "../../models/users.js";
import Week from "../../models/week.js";
import { cloudinary } from "../../utils/cloudinary.js";
import { convertDocxToPdf } from "../../utils/pdfGenerators/docxToPdfConverter.js";
import { convertXlsxToPdf } from "../../utils/pdfGenerators/xlsxToPdfConverter.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { isWeeklyLoopActive } from "../../controllers/admin/weeklySummary.js";

// Import and configure dayjs with UTC plugin
dayjs.extend(utc);

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

	// Get reports with pagination and populate author data
	const WeeklyReports = await WeeklyReport.find(filter)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username")
		.populate("weekId")
		.sort(sortOptions)
		.skip(skip)
		.limit(limitNum);

	// Format author names and add flags
	WeeklyReports.forEach((report) => {
		if (report.author) {
			let fullName = report.author.firstName;
			if (report.author.middleName && report.author.middleName.length > 0) {
				const middleInitial = report.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}
			fullName += ` ${report.author.lastName}`;
			report.authorFullName = fullName;
			report.isCurrentUserReport =
				req.user && report.author._id.equals(req.user._id);
		}

		// Format dates for display using weekId
		if (report.weekId && report.weekId.weekStartDate) {
			report.formattedWeekPeriod = `${new Date(
				report.weekId.weekStartDate
			).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			})} – ${new Date(report.weekId.weekEndDate).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			})}`;
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

	// Pass internshipSite from user to the form
	const internshipSite = req.user.internshipSite || "";

	// Get the current active week (latest week in Week collection)
	const currentWeek = await Week.findOne().sort({ weekNumber: -1 });

	// Check if the admin loop is active
	const loopActive =
		typeof isWeeklyLoopActive === "function"
			? await isWeeklyLoopActive()
			: false;

	// Format week start and end as local date strings
	const weekStartLocal = currentWeek
		? dayjs(currentWeek.weekStartDate).utc().local().format("YYYY-MM-DD")
		: "";
	const weekEndLocal = currentWeek
		? dayjs(currentWeek.weekEndDate).utc().local().format("YYYY-MM-DD")
		: "";

	res.render("reports/new", {
		fullName,
		internshipSite,
		currentWeek,
		isSaturday: dayjs().day() === 6,
		loopActive,
		weekStartLocal,
		weekEndLocal,
	});
};

export const createReport = catchAsync(async (req, res) => {
	const currentWeek = await Week.findOne().sort({ weekNumber: -1 });
	const now = dayjs();
	const loopActive =
		typeof isWeeklyLoopActive === "function"
			? await isWeeklyLoopActive()
			: false;

	// Check if weekly loop is active and it's Saturday
	if (!loopActive || !currentWeek || now.day() !== 6) {
		req.flash(
			"error",
			"You can only submit a report for the current week and only on Saturday"
		);
		return res.redirect("/weeklyreport/new");
	}

	// Prevent duplicate submission for this week
	const existing = await WeeklyReport.findOne({
		author: req.user._id,
		weekNumber: currentWeek.weekNumber,
	});

	if (existing) {
		req.flash("error", "You have already submitted a report for this week.");
		return res.redirect("/weeklyreport/new");
	}

	// Format user's full name
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	const internshipSite = req.user.internshipSite || "";

	const docxFile =
		req.files && req.files.docxFile && req.files.docxFile[0]
			? {
					filename: req.files.docxFile[0].originalname, // Use originalname instead of filename
					path: req.files.docxFile[0].path, // Cloudinary URL is already provided here
					mimetype: req.files.docxFile[0].mimetype,
					size: req.files.docxFile[0].size,
			  }
			: null;

	if (!docxFile) {
		req.flash("error", "You must upload a DOCX file.");
		return res.redirect("/weeklyreport/new");
	}

	// Convert DOCX to PDF
	let pdfFile = null;
	try {
		pdfFile = await convertDocxToPdf(docxFile, fullName);
	} catch (error) {
		console.error("PDF conversion error:", error);
		req.flash("error", `Failed to convert DOCX to PDF: ${error.message}`);
		return res.redirect("/weeklyreport/new");
	}

	// Create the report with current week's info
	const WeeklyReports = new WeeklyReport({
		author: req.user._id,
		studentName: fullName,
		internshipSite,
		weekId: currentWeek._id, // Set the weekId reference
		weekNumber: currentWeek.weekNumber,
		weekStartDate: currentWeek.weekStartDate,
		weekEndDate: currentWeek.weekEndDate,
		docxFile,
		pdfFile,
		status: "pending",
		dateSubmitted: now.toDate(),
	});

	await WeeklyReports.save();
	req.flash(
		"success",
		"Successfully uploaded weekly report! Your DOCX has been converted to PDF."
	);
	return res.redirect(`/weeklyreport/${WeeklyReports._id}`);
});

export const showReport = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const WeeklyReports = await WeeklyReport.findById(id)
		.populate("approvedBy", "username firstName middleName lastName")
		.populate("author", "username firstName middleName lastName")
		.lean();
	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/weeklyreport");
	}
	// Make sure archived status is available in the template
	WeeklyReports.weekStartDate = WeeklyReports.weekStartDate
		? WeeklyReports.weekStartDate.toLocaleDateString()
		: undefined;
	WeeklyReports.weekEndDate = WeeklyReports.weekEndDate
		? WeeklyReports.weekEndDate.toLocaleDateString()
		: undefined;
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

	// Add a flag to indicate if the report can be deleted (user is author, report is not archived, and not rejected)
	WeeklyReports.canDelete =
		WeeklyReports.isAuthor &&
		!WeeklyReports.archived &&
		WeeklyReports.status !== "rejected";

	// Add a flag to indicate if the report can be edited (user is author, report is pending or rejected, and not archived)
	WeeklyReports.canEdit =
		WeeklyReports.isAuthor &&
		(WeeklyReports.status === "pending" ||
			WeeklyReports.status === "rejected") &&
		!WeeklyReports.archived;

	res.render("reports/show", { WeeklyReports });
});

export const deleteReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { password } = req.body;

	// Check if password was provided (except for admin bypass)
	if (!password && password !== "admin-bypass") {
		req.flash("error", "Password is required to delete a report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// First find the report to check permissions
	const report = await WeeklyReport.findById(id);

	if (!report) {
		req.flash("error", "Weekly Report not found");
		return res.redirect("/weeklyreport");
	}

	// Check if the current user is the author of the report or an admin
	const isAuthor =
		req.user && report.author && report.author.equals(req.user._id);
	const isAdmin = req.user && req.user.role === "admin";

	// If not the author or admin, flash error and redirect
	if (!isAuthor && !isAdmin) {
		req.flash("error", "You don't have permission to delete this report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// For admin users: check if the report is archived
	if (isAdmin && !report.archived) {
		req.flash("error", "You must archive the report before deleting it");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// No longer restricting deletion of approved reports for regular users

	// Check if this is an admin bypass or regular password verification
	if (password === "admin-bypass" && isAdmin) {
		// Admin bypass - proceed with deletion without password verification
		console.log(
			`Admin deleting report ${report._id}, archived: ${report.archived}`
		);

		try {
			// Delete the report
			await WeeklyReport.findByIdAndDelete(id);

			req.flash("success", "Successfully deleted weekly report!");
			return res.redirect("/admin/archived-reports");
		} catch (error) {
			console.error("Error deleting weekly report:", error);
			req.flash("error", "Failed to delete weekly report. Please try again.");
			return res.redirect(`/weeklyreport/${id}`);
		}
	} else {
		// Regular password verification for non-admin users
		try {
			// Use passport-local-mongoose's authenticate method to verify the password
			req.user.authenticate(password, async (err, user, passwordError) => {
				if (err) {
					console.error("Authentication error:", err);
					req.flash("error", "An error occurred during authentication");
					return res.redirect(`/weeklyreport/${id}`);
				}

				if (!user) {
					req.flash("error", "Incorrect password");
					return res.redirect(`/weeklyreport/${id}`);
				}

				// Password is correct, proceed with deletion
				console.log(
					`Deleting report ${report._id}, archived: ${report.archived}`
				);

				try {
					// Delete the report
					await WeeklyReport.findByIdAndDelete(id);

					req.flash("success", "Successfully deleted weekly report!");
					res.redirect("/weeklyreport");
				} catch (error) {
					console.error("Error deleting weekly report:", error);
					req.flash(
						"error",
						"Failed to delete weekly report. Please try again."
					);
					res.redirect(`/weeklyreport/${id}`);
				}
			});
		} catch (error) {
			console.error("Error during password verification:", error);
			req.flash("error", "An error occurred during password verification");
			res.redirect(`/weeklyreport/${id}`);
		}
	}
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

export const uploadXlsxAndShowPdf = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).send("No XLSX file uploaded.");
		}
		let fullName = req.user.firstName;
		if (req.user.middleName && req.user.middleName.length > 0) {
			const middleInitial = req.user.middleName.charAt(0).toUpperCase();
			fullName += ` ${middleInitial}.`;
		}
		fullName += ` ${req.user.lastName}`;

		const pdfFile = await convertXlsxToPdf(req.file, fullName);
		res.render("reports/showXlsxPdf", { pdfFile });
	} catch (error) {
		console.error("Error uploading or converting XLSX:", error);
		res.status(500).send("Failed to convert XLSX to PDF: " + error.message);
	}
};

export default {
	index,
	renderNewForm,
	createReport,
	showReport,
	deleteReport,
	archiveReport,
	uploadXlsxAndShowPdf,
};
