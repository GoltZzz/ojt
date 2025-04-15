import { body, validationResult } from 'express-validator';
import ExpressError from './ExpressError.js';

// Function to escape regex special characters
export const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Middleware to sanitize request body
export const sanitizeBody = (req, res, next) => {
  // Sanitize each field in the request body
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      // Trim whitespace and sanitize against XSS
      req.body[key] = req.body[key].trim();
    }
  }
  next();
};

// Create validation chains for common fields
export const validateUser = [
  body('username').trim().escape(),
  body('firstName').trim().escape(),
  body('middleName').trim().escape(),
  body('lastName').trim().escape(),
  body('password').trim()
];

export const validateWeeklyReport = [
  body('studentName').trim().escape(),
  body('internshipSite').trim().escape(),
  body('supervisorName').trim().escape(),
  body('weekStartDate').trim().escape(),
  body('weekEndDate').trim().escape(),
  body('dailyRecords.*.timeIn.morning').trim().escape(),
  body('dailyRecords.*.timeOut.afternoon').trim().escape(),
  body('dailyRecords.*.accomplishments').trim().escape()
];

export const validateDocumentation = [
  body('title').trim().escape(),
  body('content').trim().escape()
];

export const validateTimeReport = [
  body('date').trim().escape(),
  body('hours').trim().escape(),
  body('description').trim().escape(),
  body('project').trim().escape()
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    req.flash('error', errorMessages.join(', '));
    return res.redirect('back');
  }
  next();
};
