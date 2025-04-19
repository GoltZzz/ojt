/**
 * PDF Generators Index
 * 
 * This file exports all PDF generator functions from the pdfGenerators folder.
 * It serves as a central point for importing PDF generation functionality.
 */

import { generateWeeklyReportPdf } from './weeklyReportPdfGenerator.js';
import { generateWeeklyProgressReportPdf } from './weeklyProgressReportPdfGenerator.js';

// Export all PDF generator functions
export {
    generateWeeklyReportPdf,
    generateWeeklyProgressReportPdf
};

// Default export for convenience
export default {
    generateWeeklyReportPdf,
    generateWeeklyProgressReportPdf
};
