import catchAsync from "../../utils/catchAsync.js";
import Documentation from "../../models/documentation.js";

const renderDocumentation = (req, res) => {
	res.render("documentation/index");
};

const renderNewForm = (req, res) => {
	res.render("documentation/new");
};

const createDocumentation = catchAsync(async (req, res) => {
	const documentation = new Documentation(req.body);
	documentation.author = req.user._id;
	await documentation.save();
	req.flash("success", "Successfully created new documentation!");
	res.redirect(`/documentation/${documentation._id}`);
});

export default {
	renderDocumentation,
	renderNewForm,
	createDocumentation,
};
