import catchAsync from "../../utils/catchAsync.js";
import TimeReport from "../../models/timeReport.js";
import { convertXlsxToPdf } from "../../utils/pdfGenerators/xlsxToPdfConverter.js";
import Week from "../../models/week.js";
import dayjs from "dayjs";

const renderTimeReport = catchAsync(async (req, res) => {
	// Extract filter parameters from query
	const filters = {
		studentName: req.query.studentName,
		internshipSite: req.query.internshipSite,
		weekNumber: req.query.weekNumber,
		archived: req.query.archived,
		sortBy: req.query.sortBy || "date_desc",
	};

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

	// Determine sort order
	let sort = { date: -1 }; // Default: newest first

	if (filters.sortBy) {
		const [field, direction] = filters.sortBy.split("_");
		sort = { [field]: direction === "asc" ? 1 : -1 };
	}

	// Find all time reports and populate the weekId to get weekNumber
	const timeReports = await TimeReport.find(query)
		.populate("weekId")
		.sort(sort);

	// Transform the data to include weekNumber from the populated weekId
	const formattedTimeReports = timeReports.map((report) => {
		const reportObj = report.toObject();
		if (reportObj.weekId) {
			reportObj.weekNumber = reportObj.weekId.weekNumber;
		}
		return reportObj;
	});

	res.render("timeReport/index", {
		timeReports: formattedTimeReports,
		filters,
	});
});

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

const createTimeReport = catchAsync(async (req, res) => {
	const timeReport = new TimeReport(req.body);
	timeReport.author = req.user._id;
	await timeReport.save();
	req.flash("success", "Successfully created new time report!");
	res.redirect(`/timereport/${timeReport._id}`);
});

const uploadXlsxAndShowExcel = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).send("No XLSX file uploaded.");
		}

		// Get the current active week (latest week in Week collection)
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

		// Create a new timeReport with week information and Excel file details
		const timeReport = new TimeReport({
			author: req.user._id,
			date: new Date(),
			weekId: currentWeek._id,
			weekStartDate: currentWeek.weekStartDate,
			weekEndDate: currentWeek.weekEndDate,
			studentName: fullName,
			internshipSite: req.user.internshipSite || "",
			excelFile: {
				filename: req.file.filename,
				originalName: req.file.originalname,
				path: req.file.path,
				uploadDate: new Date(),
			},
		});

		// Save the timeReport with Excel file information
		await timeReport.save();

		// Redirect to show route with the uploaded filename
		res.redirect(`/timereport/show/${encodeURIComponent(req.file.filename)}`);
	} catch (error) {
		console.error("Error uploading XLSX:", error);
		res.status(500).send("Failed to upload XLSX: " + error.message);
	}
};

const showExcel = async (req, res) => {
	const { filename } = req.params;
	if (!filename) {
		return res.status(400).send("No file specified.");
	}

	try {
		// Find the timeReport by Excel filename
		const timeReport = await TimeReport.findOne({
			"excelFile.filename": filename,
		});

		// Render the showExcel template with filename and timeReport data
		res.render("timeReport/showExcel", {
			filename,
			timeReport: timeReport || null,
		});
	} catch (error) {
		console.error("Error showing Excel file:", error);
		res.status(500).send("Error displaying Excel file: " + error.message);
	}
};

const showTimeReport = async (req, res) => {
	try {
		const { id } = req.params;
		const timeReport = await TimeReport.findById(id);

		if (!timeReport) {
			req.flash("error", "Cannot find that time report!");
			return res.redirect("/timereport");
		}

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

export default {
	renderTimeReport,
	renderNewForm,
	createTimeReport,
	uploadXlsxAndShowExcel,
	showExcel,
	showTimeReport,
};
