import catchAsync from "../../utils/catchAsync.js";
import ExpressError from "../../utils/ExpressError.js";
import LearningOutcome from "../../models/learningOutcomes.js";
import Notification from "../../models/notification.js";
import User from "../../models/users.js";
import { generateLearningOutcomePdf } from "../../utils/pdfGenerators/index.js";

export const index = catchAsync(async (req, res) => {
	// Get query parameters for filtering and pagination
	const {
		studentName,
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
	const totalReports = await LearningOutcome.countDocuments(filter);
	const totalPages = Math.ceil(totalReports / limitNum);

	// Get learning outcomes with pagination
	const LearningOutcomes = await LearningOutcome.find(filter)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username")
		.sort(sortOptions)
		.skip(skip)
		.limit(limitNum);

	// Format author names and add isCurrentUserReport flag
	LearningOutcomes.forEach((outcome) => {
		if (outcome.author) {
			// Format author full name
			let fullName = outcome.author.firstName;
			if (outcome.author.middleName && outcome.author.middleName.length > 0) {
				const middleInitial = outcome.author.middleName.charAt(0).toUpperCase();
				fullName += ` ${middleInitial}.`;
			}
			fullName += ` ${outcome.author.lastName}`;
			outcome.authorFullName = fullName;

			// Check if this outcome belongs to the current user
			outcome.isCurrentUserReport =
				req.user && outcome.author._id.equals(req.user._id);
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

	res.render("reports/learningOutcomes/index", {
		LearningOutcomes,
		pagination,
		filters: req.query,
		currentUrl: req.originalUrl,
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

	res.render("reports/learningOutcomes/new", { fullName });
};

export const createOutcome = catchAsync(async (req, res) => {
	const { learningOutcome } = req.body;

	// Extract entries from the form data
	const entries = [];
	if (Array.isArray(learningOutcome.date)) {
		// Multiple entries
		for (let i = 0; i < learningOutcome.date.length; i++) {
			if (
				learningOutcome.date[i] &&
				learningOutcome.activity[i] &&
				learningOutcome.learningOutcome[i]
			) {
				entries.push({
					date: learningOutcome.date[i],
					activity: learningOutcome.activity[i],
					learningOutcome: learningOutcome.learningOutcome[i],
				});
			}
		}
	} else {
		// Single entry
		if (
			learningOutcome.date &&
			learningOutcome.activity &&
			learningOutcome.learningOutcome
		) {
			entries.push({
				date: learningOutcome.date,
				activity: learningOutcome.activity,
				learningOutcome: learningOutcome.learningOutcome,
			});
		}
	}

	// Create a new learning outcome
	const newOutcome = new LearningOutcome({
		studentName: learningOutcome.studentName,
		entries: entries,
		author: req.user._id,
		dateSubmitted: new Date(),
	});

	// Save the learning outcome
	await newOutcome.save();

	req.flash("success", "Successfully created a new learning outcome!");
	res.redirect("/learningoutcomes");
});

export const showOutcome = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	// Find the learning outcome by ID and populate author and approvedBy fields
	const outcome = await LearningOutcome.findById(id)
		.populate("author", "username firstName middleName lastName")
		.populate("approvedBy", "username");

	// If outcome not found, flash error and redirect
	if (!outcome) {
		req.flash("error", "Learning Outcome not found");
		return res.redirect("/learningoutcomes");
	}

	// Check if the current user is the author
	const isAuthor =
		req.user && outcome.author && outcome.author._id.equals(req.user._id);

	// Check if the current user is an admin
	const isAdmin = req.user && req.user.role === "admin";

	// Determine if the user can edit or delete the outcome
	const canEdit =
		isAuthor &&
		(outcome.status === "pending" || outcome.status === "rejected") &&
		!outcome.archived;
	const canDelete =
		(isAuthor && outcome.status === "pending" && !outcome.archived) ||
		(isAdmin && outcome.archived);

	// Format author name
	let authorFullName = "";
	if (outcome.author) {
		authorFullName = outcome.author.firstName;
		if (outcome.author.middleName && outcome.author.middleName.length > 0) {
			const middleInitial = outcome.author.middleName.charAt(0).toUpperCase();
			authorFullName += ` ${middleInitial}.`;
		}
		authorFullName += ` ${outcome.author.lastName}`;
	}

	// Add properties to the outcome object
	outcome.isAuthor = isAuthor;
	outcome.canEdit = canEdit;
	outcome.canDelete = canDelete;
	outcome.authorFullName = authorFullName;

	res.render("reports/learningOutcomes/show", {
		LearningOutcome: outcome,
		currentUrl: req.originalUrl,
	});
});

export const renderEditForm = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Find the learning outcome by ID
	const outcome = await LearningOutcome.findById(id);

	// If outcome not found, flash error and redirect
	if (!outcome) {
		req.flash("error", "Learning Outcome not found");
		return res.redirect("/learningoutcomes");
	}

	// Check if the current user is the author
	const isAuthor = outcome.author.equals(req.user._id);

	// If not the author, flash error and redirect
	if (!isAuthor) {
		req.flash("error", "You do not have permission to edit this outcome");
		return res.redirect("/learningoutcomes");
	}

	// If the outcome is approved or archived, flash error and redirect
	if (outcome.status === "approved" || outcome.archived) {
		req.flash(
			"error",
			"You cannot edit an outcome that has been approved or archived"
		);
		return res.redirect(`/learningoutcomes/${id}`);
	}

	// Allow editing if the outcome is pending or rejected

	// Format the user's full name
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	res.render("reports/learningOutcomes/edit", {
		LearningOutcome: outcome,
		fullName,
	});
});

export const updateOutcome = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { learningOutcome } = req.body;

	// Find the learning outcome by ID
	const outcome = await LearningOutcome.findById(id);

	// If outcome not found, flash error and redirect
	if (!outcome) {
		req.flash("error", "Learning Outcome not found");
		return res.redirect("/learningoutcomes");
	}

	// Check if the current user is the author
	const isAuthor = outcome.author.equals(req.user._id);

	// If not the author, flash error and redirect
	if (!isAuthor) {
		req.flash("error", "You do not have permission to edit this outcome");
		return res.redirect("/learningoutcomes");
	}

	// If the outcome is approved or archived, flash error and redirect
	if (outcome.status === "approved" || outcome.archived) {
		req.flash(
			"error",
			"You cannot edit an outcome that has been approved or archived"
		);
		return res.redirect(`/learningoutcomes/${id}`);
	}

	// Store the original status to check if this is a revision of a rejected report
	const isRejectedReport = outcome.status === "rejected";

	// If the outcome was previously rejected, set needsRevision to false
	if (outcome.status === "rejected" && outcome.needsRevision) {
		outcome.needsRevision = false;
		outcome.status = "pending";
	}

	// Extract entries from the form data
	const entries = [];
	if (Array.isArray(learningOutcome.date)) {
		// Multiple entries
		for (let i = 0; i < learningOutcome.date.length; i++) {
			if (
				learningOutcome.date[i] &&
				learningOutcome.activity[i] &&
				learningOutcome.learningOutcome[i]
			) {
				// Check if this entry has an ID (existing entry)
				const entryData = {
					date: learningOutcome.date[i],
					activity: learningOutcome.activity[i],
					learningOutcome: learningOutcome.learningOutcome[i],
				};

				if (learningOutcome.entryId && learningOutcome.entryId[i]) {
					entryData._id = learningOutcome.entryId[i];
				}

				entries.push(entryData);
			}
		}
	} else {
		// Single entry
		if (
			learningOutcome.date &&
			learningOutcome.activity &&
			learningOutcome.learningOutcome
		) {
			const entryData = {
				date: learningOutcome.date,
				activity: learningOutcome.activity,
				learningOutcome: learningOutcome.learningOutcome,
			};

			if (learningOutcome.entryId) {
				entryData._id = learningOutcome.entryId;
			}

			entries.push(entryData);
		}
	}

	// Update the learning outcome
	outcome.studentName = learningOutcome.studentName;
	outcome.entries = entries;

	// If this is a rejected report being revised, set status back to pending
	if (isRejectedReport) {
		outcome.status = "pending";
		outcome.needsRevision = false;
	}

	await outcome.save();

	// If this was a revision of a rejected report, send notification to all admins
	if (isRejectedReport) {
		// Format the user's full name for the notification
		let userFullName = req.user.firstName;
		if (req.user.middleName && req.user.middleName.length > 0) {
			const middleInitial = req.user.middleName.charAt(0).toUpperCase();
			userFullName += ` ${middleInitial}.`;
		}
		userFullName += ` ${req.user.lastName}`;

		// Find all admin users
		const adminUsers = await User.find({ role: "admin" });

		// Create a notification for each admin
		for (const admin of adminUsers) {
			const notification = new Notification({
				recipient: admin._id,
				message: `${userFullName} has done a revision on learning outcome you rejected. Do you want to view it?`,
				type: "info",
				reportType: "learningoutcomes",
				reportId: outcome._id,
				action: "revised",
			});
			await notification.save();
		}

		req.flash(
			"success",
			"Your revised learning outcome has been submitted for review!"
		);
	} else {
		req.flash("success", "Successfully updated learning outcome!");
	}

	res.redirect(`/learningoutcomes/${id}`);
});

export const deleteOutcome = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { password, returnUrl } = req.body;

	// Check if password was provided (except for admin bypass)
	if (!password && password !== "admin-bypass") {
		req.flash("error", "Password is required to delete an outcome");
		return res.redirect(returnUrl || `/learningoutcomes/${id}`);
	}

	// Find the learning outcome by ID
	const outcome = await LearningOutcome.findById(id);

	// If outcome not found, flash error and redirect
	if (!outcome) {
		req.flash("error", "Learning Outcome not found");
		return res.redirect(returnUrl || "/learningoutcomes");
	}

	// Check if the current user is the author
	const isAuthor = outcome.author.equals(req.user._id);

	// Check if the current user is an admin
	const isAdmin = req.user.role === "admin";

	// If not the author or admin, flash error and redirect
	if (!isAuthor && !isAdmin) {
		req.flash("error", "You do not have permission to delete this outcome");
		return res.redirect(returnUrl || "/learningoutcomes");
	}

	// For admin users: check if the outcome is archived
	if (isAdmin && !outcome.archived) {
		req.flash("error", "You must archive the outcome before deleting it");
		return res.redirect(returnUrl || `/learningoutcomes/${id}`);
	}

	// For regular users: check if the outcome is not pending or is archived
	if (
		isAuthor &&
		!isAdmin &&
		(outcome.status !== "pending" || outcome.archived)
	) {
		req.flash(
			"error",
			"You cannot delete an outcome that has been approved, rejected, or archived"
		);
		return res.redirect(returnUrl || "/learningoutcomes");
	}

	// Check if this is an admin bypass or regular password verification
	if (password === "admin-bypass" && isAdmin) {
		// Admin bypass - proceed with deletion without password verification
		console.log(
			`Admin deleting outcome ${outcome._id}, archived: ${outcome.archived}`
		);

		try {
			// Delete the outcome
			await LearningOutcome.findByIdAndDelete(id);

			req.flash("success", "Successfully deleted learning outcome!");
			return res.redirect("/admin/archived-reports");
		} catch (error) {
			console.error("Error deleting learning outcome:", error);
			req.flash(
				"error",
				"Failed to delete learning outcome. Please try again."
			);
			return res.redirect(returnUrl || `/learningoutcomes/${id}`);
		}
	} else {
		// Regular password verification for non-admin users
		try {
			// Use passport-local-mongoose's authenticate method to verify the password
			req.user.authenticate(password, async (err, user, passwordError) => {
				if (err) {
					console.error("Authentication error:", err);
					req.flash("error", "An error occurred during authentication");
					return res.redirect(returnUrl || `/learningoutcomes/${id}`);
				}

				if (!user) {
					req.flash("error", "Incorrect password");
					return res.redirect(returnUrl || `/learningoutcomes/${id}`);
				}

				// Password is correct, proceed with deletion
				console.log(
					`Deleting outcome ${outcome._id}, archived: ${outcome.archived}`
				);

				try {
					// Delete the outcome
					await LearningOutcome.findByIdAndDelete(id);

					req.flash("success", "Successfully deleted learning outcome!");
					res.redirect(returnUrl || "/learningoutcomes");
				} catch (error) {
					console.error("Error deleting learning outcome:", error);
					req.flash(
						"error",
						"Failed to delete learning outcome. Please try again."
					);
					res.redirect(returnUrl || `/learningoutcomes/${id}`);
				}
			});
		} catch (error) {
			console.error("Error during password verification:", error);
			req.flash("error", "An error occurred during password verification");
			res.redirect(returnUrl || `/learningoutcomes/${id}`);
		}
	}
});

export const archiveOutcome = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { archiveReason } = req.body;

	// Check if the user is an admin
	if (req.user.role !== "admin") {
		req.flash("error", "You do not have permission to archive outcomes");
		return res.redirect(`/learningoutcomes/${id}`);
	}

	// Find the learning outcome by ID
	const outcome = await LearningOutcome.findById(id);

	// If outcome not found, flash error and redirect
	if (!outcome) {
		req.flash("error", "Learning Outcome not found");
		return res.redirect("/learningoutcomes");
	}

	// Check if the outcome is already archived
	if (outcome.archived) {
		req.flash("error", "This outcome is already archived");
		return res.redirect(`/learningoutcomes/${id}`);
	}

	// Check if the outcome is approved
	if (outcome.status !== "approved") {
		req.flash("error", "Only approved outcomes can be archived");
		return res.redirect(`/learningoutcomes/${id}`);
	}

	// Update the outcome to archived status
	outcome.archived = true;
	outcome.archivedReason = archiveReason;
	await outcome.save();

	req.flash("success", "Learning Outcome has been archived");
	res.redirect("/admin/archived-reports");
});

export const unarchiveOutcome = catchAsync(async (req, res) => {
	const { id } = req.params;

	// Check if the user is an admin
	if (req.user.role !== "admin") {
		req.flash("error", "You do not have permission to unarchive outcomes");
		return res.redirect(`/learningoutcomes/${id}`);
	}

	// Find the learning outcome by ID
	const outcome = await LearningOutcome.findById(id);

	// If outcome not found, flash error and redirect
	if (!outcome) {
		req.flash("error", "Learning Outcome not found");
		return res.redirect("/learningoutcomes");
	}

	// Check if the outcome is not archived
	if (!outcome.archived) {
		req.flash("error", "This outcome is not archived");
		return res.redirect(`/learningoutcomes/${id}`);
	}

	// Update the outcome to unarchived status
	outcome.archived = false;
	outcome.archivedReason = undefined;
	await outcome.save();

	req.flash("success", "Learning Outcome has been unarchived");
	res.redirect(`/learningoutcomes/${id}`);
});

export const exportOutcomeAsPdf = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`Starting PDF export for learning outcome ID: ${id}`);

	try {
		// Find the learning outcome with populated fields
		const outcome = await LearningOutcome.findById(id)
			.populate("approvedBy", "username firstName middleName lastName")
			.populate("author", "username firstName middleName lastName");

		if (!outcome) {
			console.log(`Learning outcome not found with ID: ${id}`);
			req.flash("error", "Cannot find that learning outcome!");
			return res.redirect("/learningoutcomes");
		}

		console.log(
			`Found learning outcome: ${outcome._id}, status: ${outcome.status}`
		);

		// Check if the current user is authorized to export this outcome
		// Only the author can export the outcome
		const isAuthor =
			outcome.author && req.user && outcome.author._id.equals(req.user._id);

		if (!isAuthor) {
			console.log(
				`User ${req.user._id} is not the author of learning outcome ${outcome._id}`
			);
			req.flash("error", "Only the report owner can export to PDF");
			return res.redirect(`/learningoutcomes/${id}`);
		}

		// Check if the outcome status is not approved
		if (outcome.status !== "approved") {
			console.log(
				`Learning outcome ${outcome._id} is not approved, cannot export to PDF`
			);
			req.flash(
				"error",
				"Only approved learning outcomes can be exported to PDF"
			);
			return res.redirect(`/learningoutcomes/${id}`);
		}

		// Validate outcome data before generating PDF
		if (
			!outcome.studentName ||
			!outcome.entries ||
			outcome.entries.length === 0
		) {
			console.error(
				`Learning outcome ${outcome._id} is missing required fields`
			);
			req.flash(
				"error",
				"Learning outcome is missing required information for PDF export"
			);
			return res.redirect(`/learningoutcomes/${id}`);
		}

		console.log(`Generating PDF for learning outcome ${outcome._id}`);

		// Generate the PDF file
		const buffer = await generateLearningOutcomePdf(outcome);

		console.log(
			`PDF generated successfully for learning outcome ${outcome._id}`
		);

		// Set the appropriate headers for a PDF file download
		res.setHeader(
			"Content-Disposition",
			`attachment; filename=learning-outcome-${id}.pdf`
		);
		res.setHeader("Content-Type", "application/pdf");

		// Send the buffer as the response
		res.send(buffer);
	} catch (error) {
		console.error(`PDF generation error for learning outcome ${id}:`, error);
		req.flash(
			"error",
			`Error generating PDF: ${error.message}. Please try again.`
		);
		return res.redirect(`/learningoutcomes/${id}`);
	}
});

export default {
	index,
	renderNewForm,
	createOutcome,
	showOutcome,
	renderEditForm,
	updateOutcome,
	deleteOutcome,
	archiveOutcome,
	unarchiveOutcome,
	exportOutcomeAsPdf,
};
