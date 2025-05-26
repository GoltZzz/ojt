// Validation utility for Weekly Progress Reports

/**
 * Validates a Weekly Progress Report
 * @param {Object} reportData - The report data to validate
 * @returns {Object} - Object with isValid flag and errors array
 */
export const validateWeeklyProgressReport = (reportData) => {
    const errors = [];
    
    // Required fields validation
    const requiredFields = [
        { field: 'studentName', label: 'Student Name' },
        { field: 'internshipSite', label: 'Internship Site' },
        { field: 'weekNumber', label: 'Week Number' },
        { field: 'weekStartDate', label: 'Week Start Date' },
        { field: 'weekEndDate', label: 'Week End Date' },
        { field: 'dutiesPerformed', label: 'Duties Performed' },
        { field: 'newTrainings', label: 'New Trainings' },
        { field: 'goalsForNextWeek', label: 'Goals for Next Week' },
        { field: 'supervisorName', label: 'Supervisor Name' },
        { field: 'supervisorRole', label: 'Supervisor Role' }
    ];
    
    requiredFields.forEach(({ field, label }) => {
        if (!reportData[field] || reportData[field].trim() === '') {
            errors.push(`${label} is required`);
        }
    });
    
    // Week number validation
    if (reportData.weekNumber) {
        const weekNum = parseInt(reportData.weekNumber);
        if (isNaN(weekNum) || weekNum < 1) {
            errors.push('Week Number must be a positive number');
        }
    }
    
    // Date validation
    if (reportData.weekStartDate && reportData.weekEndDate) {
        const startDate = new Date(reportData.weekStartDate);
        const endDate = new Date(reportData.weekEndDate);
        
        if (isNaN(startDate.getTime())) {
            errors.push('Week Start Date is invalid');
        }
        
        if (isNaN(endDate.getTime())) {
            errors.push('Week End Date is invalid');
        }
        
        if (startDate > endDate) {
            errors.push('Week End Date cannot be before Week Start Date');
        }
        
        // Check if date range is more than 7 days
        const dayDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (dayDifference > 7) {
            errors.push('Date range should not exceed 7 days for a weekly report');
        }
    }
    
    // Accomplishments validation
    if (reportData.accomplishments) {
        let accomplishments = reportData.accomplishments;
        
        // Handle single accomplishment case
        if (!Array.isArray(accomplishments)) {
            accomplishments = [accomplishments];
        }
        
        // Check if at least one accomplishment is provided
        if (accomplishments.length === 0) {
            errors.push('At least one accomplishment is required');
        } else {
            // Validate each accomplishment
            accomplishments.forEach((accomplishment, index) => {
                if (!accomplishment.proposedActivity || accomplishment.proposedActivity.trim() === '') {
                    errors.push(`Proposed Activity for accomplishment #${index + 1} is required`);
                }
                
                if (!accomplishment.accomplishmentDetails || accomplishment.accomplishmentDetails.trim() === '') {
                    errors.push(`Accomplishment Details for accomplishment #${index + 1} is required`);
                }
            });
        }
    }
    
    // Text length validations
    const textLengthValidations = [
        { field: 'dutiesPerformed', label: 'Duties Performed', minLength: 10, maxLength: 2000 },
        { field: 'newTrainings', label: 'New Trainings', minLength: 10, maxLength: 2000 },
        { field: 'goalsForNextWeek', label: 'Goals for Next Week', minLength: 10, maxLength: 1000 }
    ];
    
    textLengthValidations.forEach(({ field, label, minLength, maxLength }) => {
        if (reportData[field]) {
            const text = reportData[field].trim();
            if (text.length < minLength) {
                errors.push(`${label} must be at least ${minLength} characters`);
            }
            if (text.length > maxLength) {
                errors.push(`${label} must not exceed ${maxLength} characters`);
            }
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Sanitizes input data for Weekly Progress Report
 * @param {Object} reportData - The report data to sanitize
 * @returns {Object} - Sanitized report data
 */
export const sanitizeWeeklyProgressReport = (reportData) => {
    const sanitized = { ...reportData };
    
    // Sanitize text fields
    const textFields = [
        'studentName', 'internshipSite', 'dutiesPerformed', 
        'newTrainings', 'problemsEncountered', 'problemSolutions', 
        'goalsForNextWeek', 'supervisorName', 'supervisorRole'
    ];
    
    textFields.forEach(field => {
        if (sanitized[field]) {
            // Basic sanitization: trim and escape HTML
            sanitized[field] = sanitized[field].trim()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
    });
    
    // Sanitize accomplishments
    if (sanitized.accomplishments) {
        let accomplishments = sanitized.accomplishments;
        
        // Handle single accomplishment case
        if (!Array.isArray(accomplishments)) {
            accomplishments = [accomplishments];
        }
        
        sanitized.accomplishments = accomplishments.map(accomplishment => {
            return {
                proposedActivity: accomplishment.proposedActivity ? 
                    accomplishment.proposedActivity.trim()
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;') : '',
                accomplishmentDetails: accomplishment.accomplishmentDetails ? 
                    accomplishment.accomplishmentDetails.trim()
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;') : ''
            };
        });
    }
    
    // Ensure weekNumber is a number
    if (sanitized.weekNumber) {
        sanitized.weekNumber = parseInt(sanitized.weekNumber);
    }
    
    return sanitized;
};

export default {
    validateWeeklyProgressReport,
    sanitizeWeeklyProgressReport
};
