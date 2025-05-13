import catchAsync from "../../utils/catchAsync.js";
import TimeReport from "../../models/timeReport.js";
import Week from "../../models/week.js";
import dayjs from "dayjs";
import excelService from "../../utils/excelService.js";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import ExpressError from "../../utils/ExpressError.js";
import {
	createCache,
	getFromCache,
	clearCache,
} from "../../utils/cacheManager.js";

// Constants
const CACHE_TTL = 3600; // 1 hour cache lifetime

/**
 * Display the list of time reports with filtering options
 */
const renderTimeReport = catchAsync(async (req, res) => {
	// Extract filter parameters from query
	const filters = {
		studentName: req.query.studentName,
		internshipSite: req.query.internshipSite,
		weekNumber: req.query.weekNumber,
		archived: req.query.archived,
		sortBy: req.query.sortBy || "date_desc",
		status: req.query.status,
	};

	// Cache key based on user and filters
	const cacheKey = `time-reports-${req.user._id}-${JSON.stringify(filters)}`;

	// Try to get from cache first
	const cachedData = await getFromCache(cacheKey);
	if (cachedData) {
		return res.render("timeReport/index", {
			timeReports: cachedData.timeReports,
			filters,
			fromCache: true,
		});
	}

	// Build the query
	const query = { author: req.user._id };

	// Add filters to query if provided
	if (filters.studentName) {
		query.studentName = { $regex: filters.studentName, $options: "i" };
	}

	if (filters.internshipSite) {
		query.internshipSite = { $regex: filters.internshipSite, $options: "i" };
	}

	if (filters.weekNumber) {
		// If using populated weekId, need to query differently
		// This depends on whether weekNumber is stored directly or via weekId reference
		query["weekId.weekNumber"] = parseInt(filters.weekNumber);
	}

	if (filters.archived === "true") {
		query.archived = true;
	} else if (filters.archived === "false") {
		query.archived = false;
	}

	if (filters.status) {
		query.status = filters.status;
	}

	// Determine sort order
	let sort = { date: -1 }; // Default: newest first

	if (filters.sortBy) {
		const [field, direction] = filters.sortBy.split("_");
		sort = { [field]: direction === "asc" ? 1 : -1 };
	}

	// Find all time reports and populate the weekId to get weekNumber
	const timeReports = await TimeReport.find(query)
		.populate("weekId")
		.populate({
			path: "versions.updatedBy",
			model: "User",
			select: "firstName lastName",
		})
		.sort(sort);

	// Transform the data to include weekNumber from the populated weekId
	const formattedTimeReports = timeReports.map((report) => {
		const reportObj = report.toObject({ virtuals: true });
		if (reportObj.weekId) {
			reportObj.weekNumber = reportObj.weekId.weekNumber;
		}

		// Add formatted dates for display
		reportObj.formattedDate = dayjs(reportObj.date).format("MMM D, YYYY");
		if (reportObj.weekStartDate && reportObj.weekEndDate) {
			reportObj.weekPeriod = `${dayjs(reportObj.weekStartDate).format(
				"MMM D"
			)} - ${dayjs(reportObj.weekEndDate).format("MMM D, YYYY")}`;
		}

		// Clean up preview paths if they exist
		if (
			reportObj.excelFile &&
			reportObj.excelFile.preview &&
			reportObj.excelFile.preview.path
		) {
			reportObj.previewPath = path.basename(reportObj.excelFile.preview.path);
		}

		return reportObj;
	});

	// Store in cache
	await createCache(cacheKey, { timeReports: formattedTimeReports }, CACHE_TTL);

	res.render("timeReport/index", {
		timeReports: formattedTimeReports,
		filters,
		fromCache: false,
	});
});

/**
 * Render the new time report form
 */
const renderNewForm = async (req, res) => {
	// Format the user's full name
	let fullName = req.user.firstName;
	if (req.user.middleName && req.user.middleName.length > 0) {
		const middleInitial = req.user.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${req.user.lastName}`;

	const internshipSite = req.user.internshipSite || "";

	// Get the current active week (latest week in Week collection)
	const currentWeek = await Week.findOne().sort({ weekNumber: -1 });

	// Format week start and end as local date strings
	const weekStartLocal = currentWeek
		? dayjs(currentWeek.weekStartDate).format("YYYY-MM-DD")
		: "";
	const weekEndLocal = currentWeek
		? dayjs(currentWeek.weekEndDate).format("YYYY-MM-DD")
		: "";

	res.render("timeReport/new", {
		fullName,
		internshipSite,
		currentWeek,
		weekStartLocal,
		weekEndLocal,
	});
};

/**
 * Create a new time report
 */
const createTimeReport = catchAsync(async (req, res) => {
	const timeReport = new TimeReport(req.body);
	timeReport.author = req.user._id;
	timeReport.status = "submitted";
	await timeReport.save();

	// Clear cached data for this user
	await clearCache(`time-reports-${req.user._id}-*`);

	req.flash("success", "Successfully created new time report!");
	res.redirect(`/timereport/${timeReport._id}`);
});

/**
 * Handle Excel file upload, parse it, and create a time report
 */
const uploadXlsxAndShowExcel = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).send("No XLSX file uploaded.");
		}

		// Get the current active week
		const currentWeek = await Week.findOne().sort({ weekNumber: -1 });

		if (!currentWeek) {
			return res
				.status(400)
				.send("No active week found. Please contact an administrator.");
		}

		// Format the user's full name
		let fullName = req.user.firstName;
		if (req.user.middleName && req.user.middleName.length > 0) {
			const middleInitial = req.user.middleName.charAt(0).toUpperCase();
			fullName += ` ${middleInitial}.`;
		}
		fullName += ` ${req.user.lastName}`;

		// Get file stats and calculate hash for duplicate checking
		const filePath = req.file.path;
		const fileStats = await fs.stat(filePath);
		const fileBuffer = await fs.readFile(filePath);
		const hashSum = crypto.createHash("sha256");
		hashSum.update(fileBuffer);
		const fileHash = hashSum.digest("hex");

		// Check for duplicates
		const existingReport = await TimeReport.findByFileHash(fileHash);
		if (existingReport) {
			req.flash(
				"warning",
				"A report with this exact file has already been uploaded."
			);
			return res.redirect(`/timereport/${existingReport._id}`);
		}

		// Parse Excel file to extract metadata and preview
		let parseResult;
		let previewPath = null;

		try {
			// Extract data from Excel file
			parseResult = await excelService.parseExcelFile(filePath);

			// Generate preview image if Excel parsing succeeded
			previewPath = await excelService.generatePreviewImage(filePath);
		} catch (parseError) {
			console.error("Error parsing Excel file:", parseError);
			// Continue even if parsing fails, but log the error
		}

		// Create a new timeReport with enhanced metadata
		const timeReport = new TimeReport({
			author: req.user._id,
			date: new Date(),
			weekId: currentWeek._id,
			weekStartDate: currentWeek.weekStartDate,
			weekEndDate: currentWeek.weekEndDate,
			studentName: fullName,
			internshipSite: req.user.internshipSite || "",
			status: "submitted",
			excelFile: {
				filename: req.file.filename,
				originalName: req.file.originalname,
				path: filePath,
				uploadDate: new Date(),
				fileHash: fileHash,
				fileSize: fileStats.size,
				// Only include preview if it was successfully generated
				...(previewPath && {
					preview: {
						path: previewPath,
						generated: new Date(),
					},
				}),
				// Only include parsed data if parsing succeeded
				...(parseResult && {
					parsedData: {
						sheetCount: parseResult.summary.totalSheets,
						rowCount: parseResult.summary.totalRows,
						extractedHours: parseResult.summary.weekData.hoursWorked,
						hasErrorsOrWarnings: false,
						cached: true,
						cachedDate: new Date(),
					},
				}),
			},
		});

		// If we have extracted week data, update the time report
		if (parseResult && parseResult.summary.weekData) {
			// Store extracted hours as summary data
			timeReport.summary = {
				totalHours: parseResult.summary.weekData.hoursWorked || 0,
				daysWorked: 0, // Would need more parsing to determine this
			};
		}

		// Save the timeReport with enhanced Excel file information
		await timeReport.save();

		// Clear cached data for this user
		await clearCache(`time-reports-${req.user._id}-*`);

		// Redirect to show route with the uploaded filename
		res.redirect(`/timereport/show/${encodeURIComponent(req.file.filename)}`);
	} catch (error) {
		console.error("Error uploading XLSX:", error);
		res.status(500).send("Failed to upload XLSX: " + error.message);
	}
};

/**
 * Display the Excel file viewer
 */
const showExcel = async (req, res) => {
	const { filename } = req.params;
	if (!filename) {
		return res.status(400).send("No file specified.");
	}

	try {
		// Find the timeReport by Excel filename
		const timeReport = await TimeReport.findOne({
			"excelFile.filename": filename,
		})
			.populate({
				path: "annotations.author",
				model: "User",
				select: "firstName lastName",
			})
			.populate({
				path: "versions.updatedBy",
				model: "User",
				select: "firstName lastName",
			});

		if (timeReport) {
			// Register this view for analytics
			await timeReport.registerView();
		}

		// Build URLs for Excel viewers
		// Ensure we have a fully qualified domain name for external viewers
		const host = req.get("host");
		const protocol = req.protocol;

		// Create absolute URL with proper encoding
		const fileUrl = `${protocol}://${host}/uploads/excel/${encodeURIComponent(
			filename
		)}`;

		// For Microsoft Office Web Viewer
		// Use strict encoding to ensure URLs are properly formatted
		const msViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
			fileUrl
		)}`;

		// Alternative Microsoft URL format (sometimes works better)
		const msViewerAltUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
			fileUrl
		)}`;

		// For Google Docs Viewer
		const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
			fileUrl
		)}&embedded=true`;

		// Direct file access (for download links)
		const directFileUrl = `/uploads/excel/${encodeURIComponent(filename)}`;

		// Check for parsed data and preview image
		let parsedData = null;
		let previewUrl = null;

		if (timeReport && timeReport.excelFile && timeReport.excelFile.parsedData) {
			parsedData = timeReport.excelFile.parsedData;
		}

		if (
			timeReport &&
			timeReport.excelFile &&
			timeReport.excelFile.preview &&
			timeReport.excelFile.preview.path
		) {
			previewUrl = `/uploads/excel/previews/${path.basename(
				timeReport.excelFile.preview.path
			)}`;
		}

		// Render the showExcel template with all necessary data
		res.render("timeReport/showExcel", {
			filename,
			timeReport: timeReport || null,
			fileUrl,
			msViewerUrl,
			msViewerAltUrl,
			googleViewerUrl,
			directFileUrl,
			parsedData,
			previewUrl,
			annotations: timeReport ? timeReport.annotations : [],
			versions: timeReport ? timeReport.versions : [],
		});
	} catch (error) {
		console.error("Error showing Excel file:", error);
		res.status(500).send("Error displaying Excel file: " + error.message);
	}
};

/**
 * Display the time report details
 */
const showTimeReport = async (req, res) => {
	try {
		const { id } = req.params;
		const timeReport = await TimeReport.findById(id)
			.populate({
				path: "annotations.author",
				model: "User",
				select: "firstName lastName",
			})
			.populate({
				path: "versions.updatedBy",
				model: "User",
				select: "firstName lastName",
			});

		if (!timeReport) {
			req.flash("error", "Cannot find that time report!");
			return res.redirect("/timereport");
		}

		// Register this view for analytics
		await timeReport.registerView();

		// If the timeReport has an Excel file attached
		if (timeReport.excelFile && timeReport.excelFile.filename) {
			// Redirect to the Excel viewer page
			return res.redirect(
				`/timereport/show/${encodeURIComponent(timeReport.excelFile.filename)}`
			);
		}

		// For legacy time reports without Excel files, show a simple view
		res.render("timeReport/show", { timeReport });
	} catch (error) {
		console.error("Error finding time report:", error);
		req.flash("error", "Error loading time report");
		res.redirect("/timereport");
	}
};

/**
 * Delete a time report
 */
const deleteTimeReport = async (req, res) => {
	try {
		const { id } = req.params;
		const timeReport = await TimeReport.findById(id);

		if (!timeReport) {
			req.flash("error", "Cannot find that time report!");
			return res.redirect("/timereport");
		}

		// Check if user is the author of the time report
		if (timeReport.author.toString() !== req.user._id.toString()) {
			req.flash(
				"error",
				"You do not have permission to delete this time report!"
			);
			return res.redirect("/timereport");
		}

		// Save the excel file information for cleanup
		const excelFile = timeReport.excelFile;
		const versions = timeReport.versions || [];

		// Delete the time report from the database
		await TimeReport.findByIdAndDelete(id);

		// Clean up files
		try {
			// Delete the main file
			if (excelFile && excelFile.filename) {
				const filePath = path.join(
					process.cwd(),
					"public/uploads/excel",
					excelFile.filename
				);
				await fs
					.unlink(filePath)
					.catch((e) => console.warn(`Could not delete file ${filePath}:`, e));

				// Delete preview if it exists
				if (excelFile.preview && excelFile.preview.path) {
					await fs
						.unlink(excelFile.preview.path)
						.catch((e) =>
							console.warn(
								`Could not delete preview ${excelFile.preview.path}:`,
								e
							)
						);
				}
			}

			// Clean up version files from archive
			for (const version of versions) {
				if (version.excelFile && version.excelFile.path) {
					await fs
						.unlink(version.excelFile.path)
						.catch((e) =>
							console.warn(
								`Could not delete version file ${version.excelFile.path}:`,
								e
							)
						);
				}
			}
		} catch (cleanupError) {
			console.warn("Error cleaning up files:", cleanupError);
			// Continue even if file cleanup fails
		}

		// Clear cached data for this user
		await clearCache(`time-reports-${req.user._id}-*`);

		req.flash("success", "Time report successfully deleted!");
		res.redirect("/timereport");
	} catch (error) {
		console.error("Error deleting time report:", error);
		req.flash("error", "Error deleting time report");
		res.redirect("/timereport");
	}
};

/**
 * Add an annotation to a time report
 */
const addAnnotation = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { content, type, location } = req.body;

	// Validate required fields
	if (!content) {
		throw new ExpressError("Annotation content is required", 400);
	}

	const timeReport = await TimeReport.findById(id);

	if (!timeReport) {
		throw new ExpressError("Time report not found", 404);
	}

	// Create new annotation
	const annotation = {
		author: req.user._id,
		content,
		type: type || "comment",
		location: location || {},
		createdAt: new Date(),
	};

	// Add annotation to time report
	await timeReport.addAnnotation(annotation);

	// If this is an approval or rejection, update report status
	if (type === "approval") {
		timeReport.status = "approved";
		await timeReport.save();
	} else if (type === "rejection") {
		timeReport.status = "rejected";
		await timeReport.save();
	}

	// Send notification with the new annotation
	req.flash("success", "Annotation added successfully");
	res.redirect(`/timereport/${id}`);
});

/**
 * Create a new version of a time report
 */
const createNewVersion = catchAsync(async (req, res) => {
	if (!req.file) {
		throw new ExpressError("No file uploaded", 400);
	}

	const { id } = req.params;
	const { changeReason } = req.body;

	// Create a new version using the Excel service
	const updatedReport = await excelService.createNewVersion(
		id,
		req.file.path,
		req.user
	);

	// Add change reason if provided
	if (
		changeReason &&
		updatedReport.versions &&
		updatedReport.versions.length > 0
	) {
		const latestVersion =
			updatedReport.versions[updatedReport.versions.length - 1];
		latestVersion.changeReason = changeReason;
		await updatedReport.save();
	}

	// Update report status to "revised"
	updatedReport.status = "revised";
	await updatedReport.save();

	// Clear cached data for this user
	await clearCache(`time-reports-${req.user._id}-*`);

	req.flash("success", "New version uploaded successfully");
	res.redirect(`/timereport/${id}`);
});

export default {
	renderTimeReport,
	renderNewForm,
	createTimeReport,
	uploadXlsxAndShowExcel,
	showExcel,
	showTimeReport,
	deleteTimeReport,
	addAnnotation,
	createNewVersion,
};
