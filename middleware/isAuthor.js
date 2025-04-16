import WeeklyReport from "../models/weeklyReports.js";
import ExpressError from "../utils/ExpressError.js";

// Middleware to check if the current user is the author of the report
const isAuthor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const report = await WeeklyReport.findById(id);
        
        if (!report) {
            req.flash("error", "Report not found");
            return res.redirect("/weeklyreport");
        }
        
        // Check if the current user is the author of the report
        if (!report.author || !report.author.equals(req.user._id)) {
            req.flash("error", "You don't have permission to modify this report");
            return res.redirect(`/weeklyreport/${id}`);
        }
        
        // If the report is already approved or rejected, don't allow edits
        if (report.status !== "pending") {
            req.flash("error", "You cannot modify a report that has been processed");
            return res.redirect(`/weeklyreport/${id}`);
        }
        
        next();
    } catch (error) {
        console.error("Error in isAuthor middleware:", error);
        next(new ExpressError("An error occurred while checking permissions", 500));
    }
};

export default isAuthor;
