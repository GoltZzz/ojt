/**
 * PDF Generator
 *
 * This file is maintained for backward compatibility.
 * It re-exports the PDF generator functions from the pdfGenerators folder.
 *
 * For new code, import directly from utils/pdfGenerators/index.js instead.
 */

import {
    generateWeeklyReportPdf,
    generateWeeklyProgressReportPdf
} from './pdfGenerators/index.js';

// Re-export the PDF generator functions
export {
    generateWeeklyReportPdf,
    generateWeeklyProgressReportPdf
};

// Default export for convenience
export default {
    generateWeeklyReportPdf,
    generateWeeklyProgressReportPdf
};
