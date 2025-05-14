import mongoose from "mongoose";
import dotenv from "dotenv";
import { checkAndCreateNextWeek } from "./controllers/admin/weeklySummary.js";
import Week from "./models/week.js";
import Settings from "./models/settings.js";

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

async function runTest() {
	try {
		// 1. Display current weeks
		console.log("\n=== Current Weeks ===");
		const currentWeeks = await Week.find().sort({ weekNumber: 1 });

		if (currentWeeks.length === 0) {
			console.log(
				"No weeks found in the database. Please start the weekly loop first."
			);
			process.exit(0);
		}

		currentWeeks.forEach((week) => {
			console.log(
				`Week ${week.weekNumber}: ${new Date(
					week.weekStartDate
				).toLocaleDateString()} to ${new Date(
					week.weekEndDate
				).toLocaleDateString()}`
			);
		});

		// 2. Check loop status
		const settings = await Settings.findOne();
		console.log(
			`\nWeekly Loop Active: ${settings?.weeklyLoopActive ? "YES" : "NO"}`
		);

		if (!settings?.weeklyLoopActive) {
			console.log("Weekly loop is not active. Activating it for the test...");
			if (!settings) {
				await Settings.create({ weeklyLoopActive: true });
			} else {
				settings.weeklyLoopActive = true;
				await settings.save();
			}
			console.log("Weekly loop activated for testing");
		}

		// 3. Patch dayjs.day() to return 0 (Sunday)
		console.log("\n=== Simulating Sunday ===");
		console.log("Patching dayjs.day() to return 0 (Sunday)");

		// Save the original implementation
		const originalImplementation = Date.prototype.getDay;

		// Override Date.prototype.getDay to always return 0 (Sunday)
		Date.prototype.getDay = function () {
			return 0; // 0 = Sunday
		};

		// 4. Trigger the cron job function
		console.log("Triggering checkAndCreateNextWeek() function...");
		await checkAndCreateNextWeek();

		// 5. Restore original Date implementation
		Date.prototype.getDay = originalImplementation;

		// 6. Check if a new week was created
		const updatedWeeks = await Week.find().sort({ weekNumber: 1 });

		if (updatedWeeks.length > currentWeeks.length) {
			const newWeek = updatedWeeks[updatedWeeks.length - 1];
			console.log("\n✅ SUCCESS: Cron job created a new week!");
			console.log(
				`New week: Week ${newWeek.weekNumber}: ${new Date(
					newWeek.weekStartDate
				).toLocaleDateString()} to ${new Date(
					newWeek.weekEndDate
				).toLocaleDateString()}`
			);
		} else {
			console.log("\n❌ ERROR: Cron job did not create a new week");
			console.log(
				"This could be because a week for this period already exists."
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
