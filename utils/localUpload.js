import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(process.cwd(), "uploads/docx"));
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const base = path.basename(file.originalname, ext);
		cb(null, `${base}-${uuidv4().substring(0, 8)}${ext}`);
	},
});

const docxUpload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
	fileFilter: (req, file, cb) => {
		if (
			file.mimetype ===
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		) {
			cb(null, true);
		} else {
			cb(new Error("Only DOCX files are allowed."), false);
		}
	},
});

export { docxUpload };
