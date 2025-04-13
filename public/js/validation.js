document.addEventListener("DOMContentLoaded", function () {
	const form = document.querySelector(".validated-form");

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

	form.addEventListener("submit", (event) => {
		const isValid = validateForm(form, validationRules, validationMessages);
		if (!isValid) {
			event.preventDefault();
		}
	});
});

function validateForm(form, rules, messages) {
	clearErrors(form);

	const elements = form.elements;
	let isValid = true;

	for (const element of elements) {
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

function clearErrors(form) {
	const errorMessages = form.querySelectorAll(".text-danger");
	errorMessages.forEach((element) => element.remove());

	const invalidInputs = form.querySelectorAll(".is-invalid");
	invalidInputs.forEach((element) => element.classList.remove("is-invalid"));
}

function setError(element, message) {
	if (!element || !element.parentNode) return;

	const errorElement = document.createElement("div");
	errorElement.textContent = message || "Invalid input";
	errorElement.className = "text-danger mt-1";

	element.parentNode.appendChild(errorElement);

	element.classList.add("is-invalid");

	if (!window.firstErrorElement) {
		window.firstErrorElement = element;
		element.scrollIntoView({ behavior: "smooth", block: "center" });

		setTimeout(() => {
			window.firstErrorElement = null;
		}, 1000);
	}
}

function isValidDate(value) {
	const date = new Date(value);
	return !isNaN(date.getTime());
}
