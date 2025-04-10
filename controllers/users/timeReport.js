import catchAsync from "../../utils/catchAsync.js";
import TimeReport from "../../models/timeReport.js";

const renderTimeReport = (req, res) => {
	res.render("timeReport/index");
};

const renderNewForm = (req, res) => {
	res.render("timeReport/new");
};

const createTimeReport = catchAsync(async (req, res) => {
	const timeReport = new TimeReport(req.body);
	timeReport.author = req.user._id;
	await timeReport.save();
	req.flash("success", "Successfully created new time report!");
	res.redirect(`/timereport/${timeReport._id}`);
});

export default {
	renderTimeReport,
	renderNewForm,
	createTimeReport,
};
