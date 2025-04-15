/**
 * Client-side input sanitization utilities
 */

// Initialize DOMPurify when the script loads
let DOMPurify;
if (typeof window !== 'undefined') {
  DOMPurify = window.DOMPurify;
}

/**
 * Sanitizes a string to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  if (!DOMPurify) return input.trim();
  
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [] // No attributes allowed
  });
}

/**
 * Escapes regex special characters in a string
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegex(string) {
  if (typeof string !== 'string') return string;
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Adds sanitization to all input fields in a form
 * @param {HTMLFormElement} form - The form to add sanitization to
 */
function addSanitizationToForm(form) {
  if (!form) return;
  
  const inputs = form.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], input[type="password"], textarea');
  
  inputs.forEach(input => {
    // Add input event listener to sanitize as user types
    input.addEventListener('input', function() {
      // Don't sanitize password fields during typing
      if (input.type !== 'password') {
        const sanitizedValue = sanitizeInput(this.value);
        if (this.value !== sanitizedValue) {
          this.value = sanitizedValue;
        }
      }
    });
    
    // Add blur event listener to sanitize when field loses focus
    input.addEventListener('blur', function() {
      const sanitizedValue = sanitizeInput(this.value);
      if (this.value !== sanitizedValue) {
        this.value = sanitizedValue;
      }
    });
  });
  
  // Add submit event listener to sanitize all fields before submission
  form.addEventListener('submit', function(event) {
    inputs.forEach(input => {
      // Don't sanitize password fields on submit to avoid security issues
      if (input.type !== 'password') {
        input.value = sanitizeInput(input.value);
      }
    });
  }, { capture: true }); // Use capture to ensure this runs before other submit handlers
}

// Initialize sanitization on all forms when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add sanitization to all forms
  const forms = document.querySelectorAll('form');
  forms.forEach(addSanitizationToForm);
});
