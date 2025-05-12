import WeeklyReport from "../../models/weeklyReports.js";
import User from "../../models/users.js";
import Week from "../../models/week.js";
import dayjs from "dayjs";
import Settings from "../../models/settings.js";

// Helper to get all students
async function getAllStudents() {
	return User.find({ role: "user" });
}

// Helper to get or create the next week
async function createNextWeek() {
	const lastWeek = await Week.findOne().sort({ weekNumber: -1 });
	if (!lastWeek) return;

	const weekNumber = lastWeek.weekNumber + 1;

	// Calculate next Monday (start of next week)
	const weekStartDate = dayjs(lastWeek.weekEndDate)
		.add(3, "day") // From Friday to next Monday
		.startOf("day");

	// Calculate Friday (end of week)
	const weekEndDate = dayjs(weekStartDate)
		.add(4, "day") // Monday to Friday
		.endOf("day");

	// Only create if not already present
	const exists = await Week.findOne({ weekNumber });
	if (!exists) {
		const newWeek = await Week.create({
			weekNumber,
			weekStartDate: weekStartDate.toDate(),
			weekEndDate: weekEndDate.toDate(),
		});
		console.log(
			`Created Week ${weekNumber}: ${weekStartDate.format(
				"YYYY-MM-DD"
			)} to ${weekEndDate.format("YYYY-MM-DD")}`
		);
		return newWeek;
	}
	return exists;
}

// Helper to get or create the settings document
async function getSettings() {
	let settings = await Settings.findOne();
	if (!settings) {
		settings = await Settings.create({});
	}
	return settings;
}

// GET /admin/weekly-summary
export async function getWeeklySummary(req, res) {
	const students = await getAllStudents();
	const weeks = await Week.find().sort({ weekNumber: 1 });

	// Fetch all reports with proper population
	const reports = await WeeklyReport.find({
		$or: [
			{ weekNumber: { $in: weeks.map((w) => w.weekNumber) } },
			{ weekStartDate: { $in: weeks.map((w) => w.weekStartDate) } },
		],
	})
		.populate("author")
		.populate("weekId")
		.lean();

	const settings = await getSettings();
	const loopActive = settings.weeklyLoopActive;

	// Build submission status per week per student
	weeks.forEach((week) => {
		week.submissions = {};
		week.startLabel = week.weekStartDate
			? dayjs(week.weekStartDate).format("MMM D")
			: "-";
		week.endLabel = week.weekEndDate
			? dayjs(week.weekEndDate).format("MMM D")
			: "-";

		students.forEach((student) => {
			// Find matching report for this student and week using all available matching criteria
			const report = reports.find(
				(r) =>
					r.author &&
					r.author._id.toString() === student._id.toString() &&
					(r.weekNumber === week.weekNumber ||
						(r.weekId && r.weekId.toString() === week._id.toString()) ||
						(r.weekStartDate &&
							week.weekStartDate &&
							r.weekStartDate.getTime() === week.weekStartDate.getTime()))
			);

			week.submissions[student._id] = {
				submitted: !!report,
				submittedAt: report?.dateSubmitted,
				status: report?.status || "not submitted",
			};
		});
	});

	res.render("admin/weekly-summary", {
		weeks,
		students,
		loopActive,
	});
}

// POST /admin/weekly-summary/start
export async function startWeeklyLoop(req, res) {
	const settings = await getSettings();
	if (!settings.weeklyLoopActive) {
		const weekCount = await Week.countDocuments();
		if (weekCount === 0) {
			// No weeks exist, require startDate
			const startDate = req.body.startDate;
			if (!startDate) {
				req.flash("error", "Start date is required for the first week.");
				return res.redirect("/admin/weekly-summary");
			}

			// Ensure the start date is set to Monday at midnight
			const weekStart = dayjs(startDate).startOf("day");

			// If the selected date is not Monday (1), adjust to the next Monday
			if (weekStart.day() !== 1) {
				req.flash("error", "Please select a Monday as the start date.");
				return res.redirect("/admin/weekly-summary");
			}

			// End date is Friday (add 4 days to Monday)
			const weekEnd = weekStart
				.add(4, "day") // Monday + 4 days = Friday
				.endOf("day"); // End of Friday

			await Week.create({
				weekNumber: 1,
				weekStartDate: weekStart.toDate(),
				weekEndDate: weekEnd.toDate(),
			});
		}
		settings.weeklyLoopActive = true;
		await settings.save();
	}
	res.redirect("/admin/weekly-summary");
}

// POST /admin/weekly-summary/stop
export async function stopWeeklyLoop(req, res) {
	const settings = await getSettings();
	settings.weeklyLoopActive = false;
	await settings.save();
	res.redirect("/admin/weekly-summary");
}

// POST /admin/weekly-summary/restart
export async function restartWeeklyLoop(req, res) {
	const settings = await getSettings();
	const startDate = req.body.startDate;

	if (!startDate) {
		req.flash("error", "Start date is required for restarting the loop.");
		return res.redirect("/admin/weekly-summary");
	}

	// Ensure the start date is set to Monday at midnight
	const weekStart = dayjs(startDate).startOf("day");

	// If the selected date is not Monday (1), reject it
	if (weekStart.day() !== 1) {
		req.flash("error", "Please select a Monday as the start date.");
		return res.redirect("/admin/weekly-summary");
	}

	// Calculate first week end date (Friday)
	const weekEnd = weekStart
		.add(4, "day") // Monday + 4 days = Friday
		.endOf("day");

	try {
		// Delete all existing weeks and their associated reports
		await Week.deleteMany({});
		await WeeklyReport.deleteMany({});

		// Create the first week
		await Week.create({
			weekNumber: 1,
			weekStartDate: weekStart.toDate(),
			weekEndDate: weekEnd.toDate(),
		});

		// Activate the loop
		settings.weeklyLoopActive = true;
		await settings.save();

		req.flash(
			"success",
			"Weekly loop has been restarted with new dates. All previous weeks and reports have been cleared."
		);
	} catch (error) {
		req.flash("error", "Failed to restart weekly loop. Please try again.");
	}

	res.redirect("/admin/weekly-summary");
}

// Cron-like logic: create next week on Sunday if loopActive
export async function checkAndCreateNextWeek() {
	const settings = await getSettings();
	if (!settings.weeklyLoopActive) return;
	const now = dayjs();
	if (now.day() === 0) {
		// 0 is Sunday
		await createNextWeek();
	}
}

export async function isWeeklyLoopActive() {
	const settings = await getSettings();
	return settings.weeklyLoopActive;
}
