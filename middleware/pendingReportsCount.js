import WeeklyReport from "../models/weeklyReports.js";

// Middleware to count pending reports for admin users
const pendingReportsCount = async (req, res, next) => {
    try {
        // Only count pending reports for admin users
        if (req.user && req.user.role === 'admin') {
            // Count pending reports that are not archived
            const count = await WeeklyReport.countDocuments({
                status: 'pending',
                archived: false
            });
            
            // Add the count to res.locals so it's available in all templates
            res.locals.pendingReportsCount = count;
        } else {
            // Set to 0 for non-admin users
            res.locals.pendingReportsCount = 0;
        }
        next();
    } catch (error) {
        console.error('Error counting pending reports:', error);
        // Don't fail the request if counting fails
        res.locals.pendingReportsCount = 0;
        next();
    }
};

export default pendingReportsCount;
