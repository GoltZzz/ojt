/**
 * Report Modals JavaScript
 * Handles character counting and other functionality for report approval/rejection modals
 */

document.addEventListener("DOMContentLoaded", function () {
	// For single modals (in show.ejs)
	const approveTextarea = document.getElementById("approveComments");
	const approveCounter = document.getElementById("approveCharCounter");

	const rejectTextarea = document.getElementById("rejectComments");
	const rejectCounter = document.getElementById("rejectCharCounter");

	// Setup character counters if elements exist
	if (approveTextarea && approveCounter) {
		setupCharCounter(approveTextarea, approveCounter);
	}

	if (rejectTextarea && rejectCounter) {
		setupCharCounter(rejectTextarea, rejectCounter);
	}

	// For multiple modals (in pending-reports.ejs)
	// Find all textareas that start with approveComments or rejectComments
	document
		.querySelectorAll(
			'textarea[id^="approveComments"], textarea[id^="rejectComments"]'
		)
		.forEach((textarea) => {
			const id = textarea.id;
			const reportId = id
				.replace("approveComments", "")
				.replace("rejectComments", "");

			// Find the corresponding counter
			let counterId = "";
			if (id.startsWith("approveComments")) {
				counterId = "approveCharCounter" + reportId;
			} else if (id.startsWith("rejectComments")) {
				counterId = "rejectCharCounter" + reportId;
			}

			const counter = document.getElementById(counterId);
			if (counter) {
				setupCharCounter(textarea, counter);
			}
		});

	// Function to setup character counter
	function setupCharCounter(textarea, counter) {
		const maxLength = textarea.getAttribute("maxlength") || 500;

		// Initial count
		updateCharCounter(textarea, counter, maxLength);

		// Update on input
		textarea.addEventListener("input", function () {
			updateCharCounter(textarea, counter, maxLength);
		});
	}

	// Function to update character counter
	function updateCharCounter(textarea, counter, maxLength) {
		const currentLength = textarea.value.length;
		counter.textContent = `${currentLength}/${maxLength} characters`;

		// Add warning classes based on length
		if (currentLength > maxLength * 0.8) {
			counter.classList.add("warning");
		} else {
			counter.classList.remove("warning");
		}

		if (currentLength > maxLength * 0.95) {
			counter.classList.add("danger");
		} else {
			counter.classList.remove("danger");
		}
	}

	// Form validation for reject form
	const rejectForm = document.getElementById("rejectForm");
	if (rejectForm) {
		rejectForm.addEventListener("submit", function (e) {
			const reasonField = document.getElementById("rejectComments");
			if (!reasonField.value.trim()) {
				e.preventDefault();
				reasonField.classList.add("is-invalid");

				// Add error message if it doesn't exist
				let errorMsg = reasonField.nextElementSibling.nextElementSibling;
				if (!errorMsg || !errorMsg.classList.contains("invalid-feedback")) {
					errorMsg = document.createElement("div");
					errorMsg.classList.add("invalid-feedback");
					errorMsg.textContent = "Please provide a reason for rejection";
					reasonField.parentNode.insertBefore(
						errorMsg,
						reasonField.nextElementSibling.nextElementSibling
					);
				}

				// Show error message
				errorMsg.style.display = "block";
			}
		});
	}
});
