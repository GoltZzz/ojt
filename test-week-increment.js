import mongoose from "mongoose";
import dotenv from "dotenv";
import { forceCreateNextWeek } from "./controllers/admin/weeklySummary.js";
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

		// 2. Get the last week
		const lastWeek = currentWeeks[currentWeeks.length - 1];
		console.log(
			`\nLast week is Week ${lastWeek.weekNumber}: ${new Date(
				lastWeek.weekStartDate
			).toLocaleDateString()} to ${new Date(
				lastWeek.weekEndDate
			).toLocaleDateString()}`
		);

		// 3. Manually create the next week
		console.log("\n=== Creating Next Week ===");
		const success = await forceCreateNextWeek();

		if (success) {
			// 4. Display updated weeks
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

			// 5. Verify the new week
			const newWeek = updatedWeeks[updatedWeeks.length - 1];
			if (newWeek.weekNumber > lastWeek.weekNumber) {
				console.log("\n✅ SUCCESS: Week was incremented correctly!");
				console.log(`Last week: Week ${lastWeek.weekNumber}`);
				console.log(`New week: Week ${newWeek.weekNumber}`);

				// Validate that the dates are correct
				const expectedStartDate = new Date(lastWeek.weekEndDate);
				expectedStartDate.setDate(expectedStartDate.getDate() + 3); // Friday + 3 days = Monday

				const startDateMatches =
					Math.abs(
						new Date(newWeek.weekStartDate).getTime() -
							new Date(expectedStartDate.setHours(0, 0, 0, 0)).getTime()
					) < 86400000; // Within 24 hours

				if (startDateMatches) {
					console.log("✅ Start date is correct");
				} else {
					console.log("❌ Start date doesn't match expected value");
					console.log(
						`Expected: ${new Date(expectedStartDate).toLocaleDateString()}`
					);
					console.log(
						`Actual: ${new Date(newWeek.weekStartDate).toLocaleDateString()}`
					);
				}
			} else {
				console.log("\n❌ ERROR: Week was not incremented properly");
			}
		} else {
			console.log(
				"\n❌ Failed to create next week. Check if weekly loop is active."
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
