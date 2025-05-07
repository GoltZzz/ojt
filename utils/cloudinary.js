import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage engine for Multer
const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "ojt-profiles",
		allowed_formats: ["jpg", "jpeg", "png"],
		transformation: [{ width: 500, height: 500, crop: "limit" }],
	},
});

// Create multer upload middleware
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 2 * 1024 * 1024, // 2MB limit
	},
	fileFilter: (req, file, cb) => {
		// Accept only jpg, jpeg, png
		if (
			file.mimetype === "image/jpeg" ||
			file.mimetype === "image/png" ||
			file.mimetype === "image/jpg"
		) {
			cb(null, true);
		} else {
			cb(
				new Error(
					"Unsupported file format. Only jpg, jpeg, and png are allowed."
				),
				false
			);
		}
	},
});

// Storage for weekly report files (images, docx, excel)
const weeklyReportStorage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: async (req, file) => {
		const isDocx =
			file.mimetype ===
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document";

		// Get user's first name for the filename
		const firstName = req.user ? req.user.firstName.toUpperCase() : "UNKNOWN";
		const currentDate = new Date().toISOString().split("T")[0];

		// Create custom filename
		let filename = isDocx
			? `WeeklyReport-${firstName}-${currentDate}`
			: `ReportPhoto-${firstName}-${currentDate}`;

		return {
			folder: "ojt-weekly-reports",
			resource_type: isDocx ? "raw" : "image",
			format: isDocx ? "docx" : undefined,
			filename_override: filename,
			use_filename: true,
			unique_filename: true,
			type: "upload",
			access_mode: "authenticated",
		};
	},
});

const weeklyReportUpload = multer({
	storage: weeklyReportStorage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		const imageTypes = ["image/jpeg", "image/png", "image/jpg"];
		const docxTypes = [
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		];
		if (
			imageTypes.includes(file.mimetype) ||
			docxTypes.includes(file.mimetype)
		) {
			cb(null, true);
		} else {
			cb(
				new Error(
					"Unsupported file format. Only images (JPG, PNG) and DOCX are allowed."
				),
				false
			);
		}
	},
});

export { cloudinary, upload, weeklyReportUpload };
