import User from "../../models/users.js";
import { cloudinary } from "../../utils/cloudinary.js";
import multer from "multer";
import xlsx from "xlsx";
import bcrypt from "bcrypt";

// Multer setup for Excel uploads
const upload = multer({ dest: "uploads/" });

// Bulk register students via Excel upload
const bulkRegister = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}
		const workbook = xlsx.readFile(req.file.path);
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];
		const rows = xlsx.utils.sheet_to_json(sheet);

		const created = [];
		for (const row of rows) {
			const { studentIdNumber, studentName, internshipSite, course, password } =
				row;
			if (
				!studentIdNumber ||
				!studentName ||
				!internshipSite ||
				!course ||
				!password
			)
				continue;

			const [lastName, ...rest] = studentName.split(",");
			const [firstName, ...middleArr] = rest.join("").trim().split(" ");
			const middleName = middleArr.join(" ") || undefined;
			const username = studentIdNumber;
			const hash = await bcrypt.hash(password, 10);

			const user = new User({
				username,
				firstName: firstName || "",
				middleName: middleName || "",
				lastName: lastName ? lastName.trim() : "",
				role: "user",
			});
			user.setPassword
				? await user.setPassword(password)
				: (user.password = hash);
			await user.save();
			created.push(username);
		}
		return res
			.status(200)
			.json({ message: `Imported ${created.length} students`, users: created });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

const renderLogin = async (_, res) => {
	res.render("forms/login");
};

const login = async (req, res, next) => {
	try {
		let redirectUrl = req.session.returnTo || "/dashboard";

		if (req.user && req.user.role === "admin") {
			if (redirectUrl === "/dashboard") {
				redirectUrl = "/admin";
			}
		}

		delete req.session.returnTo;
		req.flash("success", "Logged in successfully!");
		console.log(`🔄 Redirecting to: ${redirectUrl}`);
		res.redirect(redirectUrl);
	} catch (error) {
		return next(error);
	}
};

const logout = async (req, res, next) => {
	req.logout(function (err) {
		if (err) return next(err);
		req.flash("success", "Logged out successfully!");
		res.redirect("/");
	});
};

export default {
	bulkRegister,
	renderLogin,
	login,
	logout,
};
