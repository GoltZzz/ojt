import mongoose from "mongoose";
import dotenv from "dotenv";
import { checkAndCreateNextWeek } from "./controllers/admin/weeklySummary.js";
import dayjs from "dayjs";
import Week from "./models/week.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
	.connect("mongodb://127.0.0.1:27017/ojt")
	.then(() => {
		console.log("MongoDB Connected");
		runTest();
	})
	.catch((err) => {
		console.error("MongoDB Connection Error:", err);
		process.exit(1);
	});

// Patch Date.prototype.getDay to always return 0 (Sunday)
const originalGetDay = Date.prototype.getDay;
Date.prototype.getDay = function () {
	console.log("Date.getDay patched to return Sunday (0)");
	return 0; // 0 represents Sunday
};

// Patch dayjs day method if it's used in the codebase
const originalDayjsDay = dayjs.prototype.day;
if (dayjs.prototype.day) {
	dayjs.prototype.day = function () {
		console.log("dayjs.day patched to return Sunday (0)");
		return 0;
	};
}

async function runTest() {
	try {
		// Display current date according to system
		console.log(`\nCurrent system date: ${new Date().toLocaleDateString()}`);
		console.log(
			`Current day of week: ${new Date().getDay()} (0=Sunday, 1=Monday, ...)`
		);

		// Display current weeks
		console.log("\n=== Current Weeks ===");
		const currentWeeks = await Week.find().sort({ weekNumber: 1 });
		currentWeeks.forEach((week) => {
			console.log(
				`Week ${week.weekNumber}: ${new Date(
					week.weekStartDate
				).toLocaleDateString()} to ${new Date(
					week.weekEndDate
				).toLocaleDateString()}`
			);
		});

		// Mock the date to be Sunday regardless of system date
		console.log("\n=== SIMULATING SUNDAY ===");
		console.log(
			"This will force the system to think it's Sunday, no matter what your system date is"
		);

		// Save original date implementation
		const originalDate = global.Date;

		console.log("Calling checkAndCreateNextWeek() function directly...");
		await checkAndCreateNextWeek();

		// Restore original implementations
		Date.prototype.getDay = originalGetDay;
		if (dayjs.prototype.day) {
			dayjs.prototype.day = originalDayjsDay;
		}

		// Check for new weeks
		console.log("\n=== Updated Weeks ===");
		const updatedWeeks = await Week.find().sort({ weekNumber: 1 });
		updatedWeeks.forEach((week) => {
			console.log(
				`Week ${week.weekNumber}: ${new Date(
					week.weekStartDate
				).toLocaleDateString()} to ${new Date(
					week.weekEndDate
				).toLocaleDateString()}`
			);
		});

		if (updatedWeeks.length > currentWeeks.length) {
			const newWeek = updatedWeeks[updatedWeeks.length - 1];
			console.log("\n✅ SUCCESS: Week was incremented!");
			console.log(`New week: Week ${newWeek.weekNumber}`);
		} else {
			console.log("\n❌ No new week was created. This could be because:");
			console.log("  - The weekly loop is not active");
			console.log("  - A week for the next period already exists");
			console.log("  - There was an issue with the week creation logic");
			console.log(
				"\nTry running your admin weekly summary page and check if the weekly loop is active."
			);
		}
	} catch (error) {
		console.error("Test error:", error);
	} finally {
		// Close MongoDB connection
		await mongoose.connection.close();
		console.log("\nMongoDB connection closed");
		process.exit(0);
	}
}
