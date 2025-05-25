import catchAsync from "../../utils/catchAsync.js";
import TimeReport from "../../models/timeReport.js";
import Notification from "../../models/notification.js";
import { clearCache } from "../../utils/cacheManager.js";
import fs from "fs";
import path from "path";

/**
 * Archive a time report (admin only)
 */
const archiveTimeReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`⏳ Running archive for time report ID: ${id}`);
	console.log("Request body:", req.body);

	const timeReport = await TimeReport.findById(id);

	if (!timeReport) {
		console.log(`❌ Time report not found with ID: ${id}`);
		req.flash("error", "Time report not found");
		return res.redirect("/admin/archived-reports");
	}

	if (req.user.role !== "admin") {
		console.log(`❌ User ${req.user._id} is not an admin`);
		req.flash("error", "You don't have permission to archive time reports");
		return res.redirect(`/timereport/${id}`);
	}

	console.log(
		`📝 Found time report: ${timeReport._id}, current archived status: ${timeReport.archived}`
	);
	timeReport.archived = true;

	if (req.body.archivedReason) {
		console.log(`📝 Setting archive reason: ${req.body.archivedReason}`);
		timeReport.archivedReason = req.body.archivedReason;
	} else {
		console.log("📝 No archive reason provided, using default");
		timeReport.archivedReason = "Manually archived by admin";
	}

	await timeReport.save();
	console.log(
		`✅ Time report archived successfully: ${timeReport._id} with reason: ${timeReport.archivedReason}`
	);

	// Create notification for the report author
	if (timeReport.author) {
		const notification = new Notification({
			recipient: timeReport.author,
			message: `Your Time Report has been archived by an administrator${
				req.body.archivedReason
					? " with reason: " + req.body.archivedReason
					: ""
			}.`,
			type: "info",
			reportType: "timereport",
			reportId: timeReport._id,
			action: "archived",
		});

		await notification.save();
	}

	// Clear cached data for the report author
	await clearCache(`time-reports-${timeReport.author}-*`);

	req.flash("success", "Time report has been archived successfully");
	return res.redirect("/admin/archived-reports");
});

/**
 * Unarchive a time report (admin only)
 */
const unarchiveTimeReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`⏳ Running unarchive for time report ID: ${id}`);

	const timeReport = await TimeReport.findById(id).populate("author");

	if (!timeReport) {
		console.log(`❌ Time report not found with ID: ${id}`);
		req.flash("error", "Time report not found");
		return res.redirect("/admin/archived-reports");
	}

	if (req.user.role !== "admin") {
		console.log(`❌ User ${req.user._id} is not an admin`);
		req.flash("error", "You don't have permission to unarchive time reports");
		return res.redirect("/admin/archived-reports");
	}

	console.log(
		`📝 Found time report: ${timeReport._id}, current archived status: ${timeReport.archived}`
	);
	timeReport.archived = false;
	timeReport.archivedReason = "";
	await timeReport.save();
	console.log(`✅ Time report unarchived successfully: ${timeReport._id}`);

	// Create notification for the report author
	if (timeReport.author) {
		const notification = new Notification({
			recipient: timeReport.author._id,
			message: `Your Time Report has been unarchived by an administrator.`,
			type: "info",
			reportType: "timereport",
			reportId: timeReport._id,
			action: "unarchived",
		});

		await notification.save();
	}

	// Clear cached data for the report author
	await clearCache(`time-reports-${timeReport.author._id}-*`);

	req.flash("success", "Time report has been unarchived successfully");
	return res.redirect("/admin/archived-reports");
});

/**
 * Delete a time report (admin only - requires archiving first)
 */
const deleteTimeReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	console.log(`⏳ Running delete for time report ID: ${id}`);

	const timeReport = await TimeReport.findById(id).populate("author");

	if (!timeReport) {
		console.log(`❌ Time report not found with ID: ${id}`);
		req.flash("error", "Time report not found");
		return res.redirect("/admin/archived-reports");
	}

	if (req.user.role !== "admin") {
		console.log(`❌ User ${req.user._id} is not an admin`);
		req.flash("error", "You don't have permission to delete time reports");
		return res.redirect(`/timereport/${id}`);
	}

	// Check if the time report is archived first
	if (!timeReport.archived) {
		console.log(`❌ Time report ${id} is not archived - cannot delete`);
		req.flash(
			"error",
			"Time report must be archived before it can be deleted. Please archive it first."
		);
		return res.redirect(`/timereport/${id}`);
	}

	console.log(
		`📝 Found archived time report: ${timeReport._id}, proceeding with deletion`
	);

	// Clean up files
	const filesToDelete = [];

	// Add Excel file to deletion list
	if (timeReport.excelFile && timeReport.excelFile.path) {
		filesToDelete.push(timeReport.excelFile.path);
	}

	// Add PDF file to deletion list
	if (timeReport.pdfFile && timeReport.pdfFile.path) {
		filesToDelete.push(timeReport.pdfFile.path);
	}

	// Add preview file to deletion list
	if (
		timeReport.excelFile &&
		timeReport.excelFile.preview &&
		timeReport.excelFile.preview.path
	) {
		filesToDelete.push(timeReport.excelFile.preview.path);
	}

	// Delete the time report from database
	await TimeReport.findByIdAndDelete(id);
	console.log(`✅ Time report deleted from database: ${timeReport._id}`);

	// Delete associated files
	for (const filePath of filesToDelete) {
		try {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
				console.log(`✅ Deleted file: ${filePath}`);
			}
		} catch (error) {
			console.error(`❌ Error deleting file ${filePath}:`, error);
		}
	}

	// Create notification for the report author
	if (timeReport.author) {
		const notification = new Notification({
			recipient: timeReport.author._id,
			message: `Your archived Time Report has been permanently deleted by an administrator.`,
			type: "warning",
			reportType: "timereport",
			reportId: timeReport._id,
			action: "deleted",
		});

		await notification.save();
	}

	// Clear cached data for the report author
	await clearCache(`time-reports-${timeReport.author._id}-*`);

	req.flash("success", "Archived time report has been permanently deleted");
	return res.redirect("/admin/archived-reports");
});

export default {
	archiveTimeReport,
	unarchiveTimeReport,
	deleteTimeReport,
};
