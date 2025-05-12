import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import ejsMate from "ejs-mate";
import session from "express-session";
import methodOverride from "method-override";
import passport from "passport";
import LocalStrategy from "passport-local";
import User from "./models/users.js";
import flash from "connect-flash";
import ExpressError from "./utils/ExpressError.js";
import { sanitizeBody } from "./utils/sanitize.js";
import { body, validationResult } from "express-validator";
import pendingReportsCount from "./middleware/pendingReportsCount.js";
import cron from "node-cron";
import { checkAndCreateNextWeek } from "./controllers/admin/weeklySummary.js";
import multer from "multer";

const app = express();

//for user routes
import userRoutes from "./routes/users.js";
// for dashboard routes
import dashboardRoutes from "./routes/users/dashboard.js";
//for weeklyReports routes
import weeklyReportRoutes from "./routes/users/weeklyReports.js";
// for admin routes
import adminRoutes from "./routes/admin/admin.js";
// for admin API routes
import adminApiRoutes from "./routes/admin/api.js";
// for admin report monitoring routes
import reportMonitoringRoutes from "./routes/admin/reportMonitoring.js";
// for time report routes
import timeReportRoutes from "./routes/users/timeReport.js";
// for profile routes
import profileRoutes from "./routes/users/profile.js";
// for notifications routes
import notificationRoutes from "./routes/notifications.js";

// for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// for mongoose
mongoose
	.connect("mongodb://127.0.0.1:27017/ojt")
	.then(() => {
		console.log("MONGO Connection Open!!!");
	})
	.catch((err) => {
		console.log("OH NO MONGO CONNECTION ERROR!!!");
		console.log(err);
	});

// for ejs template
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/pdfs", express.static(path.join(__dirname, "uploads/pdfs")));
app.use(
	"/uploads/excel",
	express.static(path.join(process.cwd(), "public/uploads/excel"))
);

// Apply sanitization middleware to all routes
app.use(sanitizeBody);

// for session & cookie
const sessionConfig = {
	name: "session",
	secret: "thisshouldbeabettersecret!",
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		// secure: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
};
app.use(session(sessionConfig));

//for passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// for flash messages
app.use(flash());
app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	res.locals.info = req.flash("info");
	res.locals.currentPath = req.path.split("/").filter((segment) => segment);
	next();
});

// Add pending reports count middleware
app.use(pendingReportsCount);

// for weeklyReports routes
app.use("/weeklyreport", weeklyReportRoutes);
// for dashboard routes
app.use("/dashboard", dashboardRoutes);
// for admin routes
app.use("/admin", adminRoutes);
// for admin API routes
app.use("/api/admin", adminApiRoutes);
// for admin report monitoring routes
app.use("/admin/reports", reportMonitoringRoutes);
// for time report routes
app.use("/timereport", timeReportRoutes);
// for profile routes
app.use("/profile", profileRoutes);
// for notifications routes
app.use("/api/notifications", notificationRoutes);

app.use("/", userRoutes);
// for homepage
app.get("/", async (req, res) => {
	const userCount = await User.countDocuments({});
	res.render("home", { hasUsers: userCount > 0 });
});

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/excel");
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname);
	},
});
const fileFilter = (req, file, cb) => {
	if (
		file.mimetype ===
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
		cb(null, true);
	} else {
		cb(new Error("Only .xlsx files are allowed!"), false);
	}
};
const upload = multer({ storage, fileFilter });

app.get("/excel/upload", (req, res) => {
	res.render("excel_upload");
});

app.post("/excel/upload", upload.single("excelFile"), (req, res) => {
	if (!req.file) {
		return res.status(400).send("No file uploaded or invalid file type.");
	}
	res.redirect(`/excel/show/${encodeURIComponent(req.file.filename)}`);
});

app.get("/excel/show/:filename", (req, res) => {
	const filename = req.params.filename;
	const fileUrl = `${req.protocol}://${req.get(
		"host"
	)}/uploads/excel/${encodeURIComponent(filename)}`;
	res.render("excel_show", { fileUrl, filename });
});

app.all("*", (req, res, next) => {
	next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = "Oh No, Something Went Wrong!";
	res.status(statusCode).render("error", { err });
});

// Schedule job: every Sunday at 00:01
cron.schedule("1 0 * * 0", async () => {
	await checkAndCreateNextWeek();
	console.log("Checked and created next week (if needed)");
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
