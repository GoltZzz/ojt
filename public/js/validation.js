const form = document.querySelector(".validated-form");

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
	} else {
		form.submit();
	}
});

function validateForm(form, rules, messages) {
	const elements = form.elements;
	let isValid = true;

	for (const element of elements) {
		const name = element.name;
		const rule = rules[name];
		if (rule) {
			const value = element.value;
			if (rule.required && !value) {
				isValid = false;
				setError(element, messages[name]);
			} else if (rule.date && !isValidDate(value)) {
				isValid = false;
				setError(element, messages[name]);
			}
		}
	}

	return isValid;
}

function setError(element, message) {
	const errorElement = document.createElement("div");
	errorElement.textContent = message;
	errorElement.className = "text-danger";
	element.parentNode.appendChild(errorElement);
	element.classList.add("is-invalid");
}

function isValidDate(value) {
	const date = new Date(value);
	return !isNaN(date.getTime());
}
