import WeeklyReport from "../../models/weeklyReports.js";
import User from "../../models/users.js";
import dayjs from "dayjs";

let loopActive = false;
let startDate = null;

// Helper to get all students
async function getAllStudents() {
	return User.find({ role: "user" });
}

// Helper to generate week ranges
function generateWeeks(start, count = 20) {
	const weeks = [];
	let current = dayjs(start);
	for (let i = 0; i < count; i++) {
		const weekStart = current.startOf("week").add(1, "day"); // Monday
		const weekEnd = weekStart.add(4, "day"); // Friday
		weeks.push({
			weekNumber: i + 1,
			start: weekStart.toDate(),
			end: weekEnd.toDate(),
			startLabel: weekStart.format("MMM D"),
			endLabel: weekEnd.format("MMM D"),
		});
		current = current.add(1, "week");
	}
	return weeks;
}

// GET /admin/weekly-summary
export async function getWeeklySummary(req, res) {
	if (!loopActive || !startDate) {
		return res.render("admin/weekly-summary", {
			weeks: [],
			students: [],
			startDate: null,
			loopActive: false,
		});
	}
	const students = await getAllStudents();
	const weeks = generateWeeks(startDate);
	// Fetch all reports for all students for all weeks
	const reports = await WeeklyReport.find({
		weekStartDate: { $gte: weeks[0].start, $lte: weeks[weeks.length - 1].end },
	});
	// Build submission status per week per student
	weeks.forEach((week) => {
		week.submissions = {};
		students.forEach((student) => {
			const report = reports.find(
				(r) =>
					r.author.toString() === student._id.toString() &&
					dayjs(r.weekStartDate).isSame(week.start, "day")
			);
			const now = dayjs();
			const isSaturday =
				now.day() === 6 &&
				now.isAfter(dayjs(week.end)) &&
				now.isBefore(dayjs(week.end).add(1, "week"));
			week.submissions[student._id] = {
				submitted: !!report,
				canSubmit: isSaturday && !report,
				submitDisabled:
					!isSaturday ||
					!!report ||
					now.isAfter(dayjs(week.end).add(1, "week")),
			};
		});
	});
	res.render("admin/weekly-summary", {
		weeks,
		students,
		startDate,
		loopActive,
	});
}

// POST /admin/weekly-summary/start
export function startWeeklyLoop(req, res) {
	startDate = req.body.startDate;
	loopActive = true;
	res.redirect("/admin/weekly-summary");
}

// POST /admin/weekly-summary/stop
export function stopWeeklyLoop(req, res) {
	loopActive = false;
	startDate = null;
	res.redirect("/admin/weekly-summary");
}

// POST /admin/weekly-summary/submit
export async function submitWeeklyReportForStudent(req, res) {
	const { studentId, weekNumber } = req.body;
	if (!loopActive || !startDate) return res.redirect("/admin/weekly-summary");
	const weeks = generateWeeks(startDate);
	const week = weeks.find((w) => w.weekNumber == weekNumber);
	if (!week) return res.redirect("/admin/weekly-summary");
	// Prevent resubmission
	const existing = await WeeklyReport.findOne({
		author: studentId,
		weekStartDate: week.start,
	});
	if (existing) return res.redirect("/admin/weekly-summary");
	// Only allow on Saturday
	const now = dayjs();
	if (
		!(
			now.day() === 6 &&
			now.isAfter(dayjs(week.end)) &&
			now.isBefore(dayjs(week.end).add(1, "week"))
		)
	) {
		return res.redirect("/admin/weekly-summary");
	}
	// Create a placeholder report (or redirect to actual submission form)
	await WeeklyReport.create({
		author: studentId,
		studentName: "Auto Submission",
		internshipSite: "",
		weekNumber: week.weekNumber,
		weekStartDate: week.start,
		weekEndDate: week.end,
		status: "pending",
	});
	res.redirect("/admin/weekly-summary");
}
