import mongoose from "mongoose";
import { Schema } from "mongoose";

// Define file metadata schema
const FileMetadataSchema = new Schema({
	filename: String,
	originalName: String,
	path: String,
	uploadDate: {
		type: Date,
		default: Date.now,
	},
	fileHash: String,
	fileSize: Number,
	preview: {
		path: String,
		generated: Date,
	},
	parsedData: {
		sheetCount: Number,
		rowCount: Number,
		extractedHours: Number,
		hasErrorsOrWarnings: Boolean,
		cached: Boolean,
		cachedDate: Date,
	},
});

// Define annotation schema
const AnnotationSchema = new Schema({
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
	content: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: Date,
	location: {
		sheet: String,
		cell: String,
		range: String,
	},
	resolved: {
		type: Boolean,
		default: false,
	},
	type: {
		type: String,
		enum: ["comment", "correction", "question", "approval", "rejection"],
		default: "comment",
	},
});

// Define version schema for change tracking
const VersionSchema = new Schema({
	versionNumber: {
		type: Number,
		required: true,
	},
	excelFile: FileMetadataSchema,
	uploadDate: {
		type: Date,
		default: Date.now,
	},
	updatedBy: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
	changeReason: String,
	changeDescription: String,
});

const timeReportSchema = new Schema({
	author: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	date: {
		type: Date,
		required: true,
	},
	weekId: {
		type: Schema.Types.ObjectId,
		ref: "Week",
		required: true,
	},
	weekStartDate: {
		type: Date,
		required: true,
	},
	weekEndDate: {
		type: Date,
		required: true,
	},
	studentName: {
		type: String,
		required: true,
	},
	internshipSite: {
		type: String,
		required: true,
	},
	hoursWorked: {
		type: Number,
		min: 0,
		required: false,
	},
	description: {
		type: String,
		required: false,
	},
	dateSubmitted: {
		type: Date,
		default: Date.now,
	},
	status: {
		type: String,
		enum: ["approved"],
		default: "approved",
	},
	archived: {
		type: Boolean,
		default: false,
	},
	archivedReason: {
		type: String,
		default: "",
	},
	excelFile: FileMetadataSchema,
	versions: [VersionSchema],
	annotations: [AnnotationSchema],
	summary: {
		totalHours: Number,
		daysWorked: Number,
		activitiesSummary: String,
	},
	lastViewed: Date,
	viewCount: {
		type: Number,
		default: 0,
	},
});

// Add text indexes for search functionality
timeReportSchema.index({ studentName: "text", internshipSite: "text" });

// Add specialized indexes for efficient querying
timeReportSchema.index({ author: 1, date: -1 });
timeReportSchema.index({ weekId: 1 });
timeReportSchema.index({ "excelFile.fileHash": 1 });
timeReportSchema.index({ status: 1 });

// Virtual for latest version number
timeReportSchema.virtual("currentVersion").get(function () {
	if (!this.versions || this.versions.length === 0) return 1;
	return this.versions.length;
});

// Add analytics tracking on view
timeReportSchema.methods.registerView = async function () {
	this.viewCount += 1;
	this.lastViewed = new Date();
	await this.save();
};

// Method to add annotation
timeReportSchema.methods.addAnnotation = async function (annotation) {
	if (!this.annotations) {
		this.annotations = [];
	}

	this.annotations.push(annotation);
	await this.save();
	return this;
};

// Method to check for duplicates by file hash
timeReportSchema.statics.findByFileHash = async function (fileHash) {
	return this.findOne({ "excelFile.fileHash": fileHash });
};

const TimeReport = mongoose.model("TimeReport", timeReportSchema);

export default TimeReport;
