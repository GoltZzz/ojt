// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
	// Get the form element
	const form = document.querySelector(".validated-form");

	// Only proceed if the form exists on this page
	if (!form) return;

	const validationRules = {
		studentName: { required: true },
		internshipSite: { required: true },
		weekStartDate: { required: true, date: true },
		weekEndDate: { required: true, date: true },
		supervisorName: { required: true },
		"dailyRecords[][timeIn][morning]": { required: true },
		"dailyRecords[][timeOut][afternoon]": { required: true },
	};

	const validationMessages = {
		studentName: "Please enter your name!",
		internshipSite: "Where is your internship site?",
		weekStartDate: "Tip: It starts on Monday",
		weekEndDate: "Tip: It ends on Friday",
		supervisorName: "Please enter your supervisor's name",
		"dailyRecords[][timeIn][morning]": "Enter morning time in",
		"dailyRecords[][timeOut][afternoon]": "Enter afternoon time out",
	};

	// Add event listener to the form
	form.addEventListener("submit", (event) => {
		const isValid = validateForm(form, validationRules, validationMessages);
		if (!isValid) {
			event.preventDefault();
		}
		// Removed form.submit() to prevent double submission
	});
});

function validateForm(form, rules, messages) {
	// Clear previous error messages
	clearErrors(form);

	const elements = form.elements;
	let isValid = true;

	for (const element of elements) {
		// Skip elements without a name attribute
		if (!element.name) continue;

		const name = element.name;
		const rule = rules[name];

		if (rule) {
			const value = element.value;
			if (rule.required && !value) {
				isValid = false;
				setError(element, messages[name] || `${name} is required`);
			} else if (rule.date && value && !isValidDate(value)) {
				isValid = false;
				setError(element, messages[name] || `${name} must be a valid date`);
			}
		}
	}

	return isValid;
}

// Function to clear all error messages
function clearErrors(form) {
	// Remove all error messages
	const errorMessages = form.querySelectorAll(".text-danger");
	errorMessages.forEach((element) => element.remove());

	// Remove invalid class from all inputs
	const invalidInputs = form.querySelectorAll(".is-invalid");
	invalidInputs.forEach((element) => element.classList.remove("is-invalid"));
}

function setError(element, message) {
	// Only proceed if the element exists and has a parent
	if (!element || !element.parentNode) return;

	// Create error message element
	const errorElement = document.createElement("div");
	errorElement.textContent = message || "Invalid input";
	errorElement.className = "text-danger mt-1";

	// Add the error message after the input
	element.parentNode.appendChild(errorElement);

	// Mark the input as invalid
	element.classList.add("is-invalid");

	// Scroll to the first error
	if (!window.firstErrorElement) {
		window.firstErrorElement = element;
		element.scrollIntoView({ behavior: "smooth", block: "center" });
		// Reset the first error element after a short delay
		setTimeout(() => {
			window.firstErrorElement = null;
		}, 1000);
	}
}

function isValidDate(value) {
	const date = new Date(value);
	return !isNaN(date.getTime());
}
