/**
 * PDF Generators Index
 *
 * This file exports all PDF generator functions from the pdfGenerators folder.
 * It serves as a central point for importing PDF generation functionality.
 */

import { generateWeeklyReportPdf } from "./weeklyReportPdfGenerator.js";
import { generateWeeklyProgressReportPdf } from "./weeklyProgressReportPdfGenerator.js";
import { generateTrainingSchedulePdf } from "./trainingSchedulePdfGenerator.js";
import { generateLearningOutcomePdf } from "./learningOutcomePdfGenerator.js";

// Export all PDF generator functions
export {
	generateWeeklyReportPdf,
	generateWeeklyProgressReportPdf,
	generateTrainingSchedulePdf,
	generateLearningOutcomePdf,
};

// Default export for convenience
export default {
	generateWeeklyReportPdf,
	generateWeeklyProgressReportPdf,
	generateTrainingSchedulePdf,
	generateLearningOutcomePdf,
};

export * from "./docxToPdfConverter.js";
export * from "./xlsxToPdfConverter.js";
