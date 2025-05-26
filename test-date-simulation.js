import mongoose from "mongoose";
import Week from "./models/week.js";
import Settings from "./models/settings.js";
import dayjs from "dayjs";

// Simulate the createNextWeek function
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

// Simulate checkAndCreateNextWeek for next Sunday
async function simulateNextSundayCheck() {
	try {
		await mongoose.connect("mongodb://127.0.0.1:27017/ojt");

		// Simulate next Sunday's date
		const simulatedDate = dayjs("2025-06-01"); // Next Sunday
		console.log(
			`🗓️  Simulating date: ${simulatedDate.format("YYYY-MM-DD dddd")}`
		);
		console.log(`Day of week: ${simulatedDate.day()} (0=Sunday)`);

		// Check if weekly loop is active
		const settings = await Settings.findOne();
		if (!settings?.weeklyLoopActive) {
			console.log("❌ Weekly loop is not active, skipping week creation");
			return;
		}

		console.log("✅ Weekly loop is active");

		// Show current weeks before simulation
		console.log("\n📋 Current weeks before simulation:");
		const weeksBefore = await Week.find().sort({ weekNumber: 1 });
		weeksBefore.forEach((week) => {
			console.log(
				`   Week ${week.weekNumber}: ${dayjs(week.weekStartDate).format(
					"YYYY-MM-DD"
				)} to ${dayjs(week.weekEndDate).format("YYYY-MM-DD")}`
			);
		});

		// Simulate Sunday check
		if (simulatedDate.day() === 0) {
			// 0 is Sunday
			console.log(
				"\n🔍 It's Sunday, checking if next week needs to be created..."
			);

			// Check if we need to create a week for the upcoming Monday
			const nextMonday = simulatedDate.add(1, "day").startOf("day"); // Monday after simulated Sunday
			console.log(
				`   Next Monday would be: ${nextMonday.format("YYYY-MM-DD")}`
			);

			// Check if a week already exists for next Monday
			const existingWeek = await Week.findOne({
				weekStartDate: {
					$gte: nextMonday.toDate(),
					$lt: nextMonday.add(1, "day").toDate(),
				},
			});

			if (existingWeek) {
				console.log(
					`   ⚠️  Week ${
						existingWeek.weekNumber
					} already exists for ${nextMonday.format(
						"YYYY-MM-DD"
					)}, no action needed`
				);
				return;
			}

			console.log(
				`   ✨ No week exists for ${nextMonday.format(
					"YYYY-MM-DD"
				)}, creating new week...`
			);

			// Create the next week
			const newWeek = await createNextWeek();
			if (newWeek) {
				console.log(
					`   🎉 Successfully created Week ${newWeek.weekNumber}: ${dayjs(
						newWeek.weekStartDate
					).format("YYYY-MM-DD")} to ${dayjs(newWeek.weekEndDate).format(
						"YYYY-MM-DD"
					)}`
				);
			} else {
				console.log(
					"   ❌ Week was not created, it may already exist or there was an issue"
				);
			}
		}

		// Show weeks after simulation
		console.log("\n📋 Weeks after simulation:");
		const weeksAfter = await Week.find().sort({ weekNumber: 1 });
		weeksAfter.forEach((week) => {
			const isNew = !weeksBefore.find((w) => w.weekNumber === week.weekNumber);
			console.log(
				`   Week ${week.weekNumber}: ${dayjs(week.weekStartDate).format(
					"YYYY-MM-DD"
				)} to ${dayjs(week.weekEndDate).format("YYYY-MM-DD")} ${
					isNew ? "🆕 NEW!" : ""
				}`
			);
		});

		console.log("\n✅ Simulation complete!");
	} catch (error) {
		console.error("❌ Error during simulation:", error);
	} finally {
		await mongoose.disconnect();
	}
}

simulateNextSundayCheck();
