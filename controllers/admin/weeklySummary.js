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
				canSubmit: !report && dayjs().day() === 6,
				submitDisabled: !!report || dayjs().day() !== 6,
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
			// Set to local midnight to avoid timezone issues
			const weekStart = dayjs(startDate)
				.hour(0)
				.minute(0)
				.second(0)
				.millisecond(0);
			const weekEnd = weekStart.add(4, "day");
			await Week.create({
				weekNumber: 1,
				weekStartDate: weekStart.toDate(),
				weekEndDate: weekEnd.toDate(),
			});
		}
		// If weeks already exist, just activate the loop
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

// POST /admin/weekly-summary/submit
export async function submitWeeklyReportForStudent(req, res) {
	const { studentId, weekNumber } = req.body;
	const settings = await getSettings();
	if (!settings.weeklyLoopActive) return res.redirect("/admin/weekly-summary");

	// Find the week
	const week = await Week.findOne({ weekNumber });
	if (!week) return res.redirect("/admin/weekly-summary");

	// Find the student to get their name and internship site
	const student = await User.findById(studentId);
	if (!student) return res.redirect("/admin/weekly-summary");

	// Format student name
	let fullName = student.firstName;
	if (student.middleName && student.middleName.length > 0) {
		const middleInitial = student.middleName.charAt(0).toUpperCase();
		fullName += ` ${middleInitial}.`;
	}
	fullName += ` ${student.lastName}`;

	// Prevent resubmission
	const existing = await WeeklyReport.findOne({
		author: studentId,
		weekNumber: week.weekNumber,
	});
	if (existing) return res.redirect("/admin/weekly-summary");

	// Only allow on Saturday
	const now = dayjs();
	if (now.day() !== 6) {
		return res.redirect("/admin/weekly-summary");
	}

	// Create the report with all required fields
	await WeeklyReport.create({
		author: studentId,
		studentName: fullName,
		internshipSite: student.internshipSite || "",
		weekId: week._id,
		weekNumber: week.weekNumber,
		weekStartDate: week.weekStartDate,
		weekEndDate: week.weekEndDate,
		status: "pending",
		dateSubmitted: now.toDate(),
	});

	req.flash("success", "Report submitted successfully");
	res.redirect("/admin/weekly-summary");
}

// Cron-like logic: create next week on Saturday if loopActive
export async function checkAndCreateNextWeek() {
	const settings = await getSettings();
	if (!settings.weeklyLoopActive) return;
	const now = dayjs();
	if (now.day() === 6) {
		await createNextWeek();
	}
}

export async function isWeeklyLoopActive() {
	const settings = await getSettings();
	return settings.weeklyLoopActive;
}
