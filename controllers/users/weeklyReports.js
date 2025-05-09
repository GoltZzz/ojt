import catchAsync from "../../utils/catchAsync.js";
import WeeklyReport from "../../models/weeklyReports.js";
import Notification from "../../models/notification.js";
import User from "../../models/users.js";
import { cloudinary } from "../../utils/cloudinary.js";
import { convertDocxToPdf } from "../../utils/pdfGenerators/docxToPdfConverter.js";

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

		// Format dates for display
		if (report.weekStartDate) {
			report.formattedWeekPeriod = `${new Date(
				report.weekStartDate
			).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			})} – ${new Date(report.weekEndDate).toLocaleDateString("en-US", {
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

	res.render("reports/new", { fullName, internshipSite });
};

export const createReport = catchAsync(async (req, res) => {
	const { weekNumber, weekStartDate, weekEndDate, supervisorName } = req.body;

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

	const WeeklyReports = new WeeklyReport({
		author: req.user._id,
		studentName: fullName,
		internshipSite,
		weekNumber,
		weekStartDate,
		weekEndDate,
		supervisorName,
		docxFile,
		pdfFile,
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

export const renderEditForm = catchAsync(async (req, res) => {
	const { id } = req.params;
	const WeeklyReports = await WeeklyReport.findById(id);

	if (!WeeklyReports) {
		req.flash("error", "Cannot find that weekly report!");
		return res.redirect("/weeklyreport");
	}

	// Double-check that the current user is the author (middleware should have caught this already)
	if (!WeeklyReports.author || !WeeklyReports.author.equals(req.user._id)) {
		req.flash("error", "You don't have permission to edit this report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Check if the report is already approved (rejected reports can be edited)
	if (WeeklyReports.status === "approved") {
		req.flash("error", "You cannot edit an approved report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Check if the report is archived
	if (WeeklyReports.archived) {
		req.flash("error", "You cannot edit an archived report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Format the user's full name to ensure it's consistent
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	res.render("reports/edit", { WeeklyReports, fullName });
});

export const updateReport = catchAsync(async (req, res) => {
	const { id } = req.params;

	// First find the report to check permissions
	const report = await WeeklyReport.findById(id);

	if (!report) {
		req.flash("error", "Weekly Report not found");
		return res.redirect("/weeklyreport");
	}

	// Double-check that the current user is the author
	if (!report.author || !report.author.equals(req.user._id)) {
		req.flash("error", "You don't have permission to update this report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Check if the report is already approved (rejected reports can be updated)
	if (report.status === "approved") {
		req.flash("error", "You cannot update an approved report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Check if the report is archived
	if (report.archived) {
		req.flash("error", "You cannot update an archived report");
		return res.redirect(`/weeklyreport/${id}`);
	}

	// Store the original status to check if this is a revision of a rejected report
	const isRejectedReport = report.status === "rejected";

	// Format the user's full name to ensure it's consistent
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	// Handle file uploads if present
	const updateData = { ...req.body };

	// Always use the user's internshipSite
	updateData.internshipSite = req.user.internshipSite || "";

	// Handle photo updates
	if (req.files && req.files.photos && req.files.photos.length > 0) {
		updateData.photos = req.files.photos.map((file) => ({
			filename: file.filename,
			path: file.path,
			mimetype: file.mimetype,
			size: file.size,
		}));
	}

	// Handle docx file update
	if (req.files && req.files.docxFile && req.files.docxFile[0]) {
		updateData.docxFile = {
			filename: req.files.docxFile[0].originalname, // Use originalname instead of filename
			path: req.files.docxFile[0].path,
			mimetype: req.files.docxFile[0].mimetype,
			size: req.files.docxFile[0].size,
		};

		// Convert DOCX to PDF
		try {
			updateData.pdfFile = await convertDocxToPdf(
				updateData.docxFile,
				fullName
			);
		} catch (error) {
			console.error("PDF conversion error:", error);
			req.flash("error", `Failed to convert DOCX to PDF: ${error.message}`);
			return res.redirect(`/weeklyreport/${id}/edit`);
		}
	}

	// Override the studentName with the formatted full name
	updateData.studentName = fullName;

	// If this is a rejected report being revised, set status back to pending
	if (isRejectedReport) {
		updateData.status = "pending";
	}

	// Update the report
	const WeeklyReports = await WeeklyReport.findByIdAndUpdate(id, updateData, {
		new: true,
		runValidators: true,
	});

	// If this was a revision of a rejected report, send notification to all admins
	if (isRejectedReport) {
		// Find all admin users
		const adminUsers = await User.find({ role: "admin" });

		// Create a notification for each admin
		for (const admin of adminUsers) {
			const notification = new Notification({
				recipient: admin._id,
				message: `${fullName} has done a revision on weekly report you rejected. Do you want to view it?`,
				type: "info",
				reportType: "weeklyreport",
				reportId: WeeklyReports._id,
				action: "revised",
			});
			await notification.save();
		}

		req.flash("success", "Your revised report has been submitted for review!");
	} else {
		req.flash("success", "Successfully updated weekly report!");
	}

	res.redirect(`/weeklyreport/${WeeklyReports._id}`);
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

export default {
	index,
	renderNewForm,
	createReport,
	showReport,
	renderEditForm,
	updateReport,
	deleteReport,
	archiveReport,
};
