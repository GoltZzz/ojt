document.addEventListener("DOMContentLoaded", function () {
	// Add accomplishment button functionality
	let accomplishmentCount = window.initialAccomplishmentCount || 1;
	const addAccomplishmentBtn = document.getElementById("addAccomplishment");
	const accomplishmentsContainer = document.getElementById(
		"accomplishmentsContainer"
	);

	if (addAccomplishmentBtn && accomplishmentsContainer) {
		addAccomplishmentBtn.addEventListener("click", function () {
			const newAccomplishment = document.createElement("div");
			newAccomplishment.className =
				"accomplishment-item mb-3 p-3 border rounded";
			newAccomplishment.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">Additional Accomplishment</h6>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-accomplishment">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
                <div class="mb-3">
                    <label for="accomplishments[${accomplishmentCount}][proposedActivity]" class="form-label">PROPOSED ACTIVITY</label>
                    <textarea class="form-control" id="accomplishments[${accomplishmentCount}][proposedActivity]" name="accomplishments[${accomplishmentCount}][proposedActivity]" rows="2" required></textarea>
                    <div class="invalid-feedback">Please provide a proposed activity.</div>
                </div>
                <div class="mb-3">
                    <label for="accomplishments[${accomplishmentCount}][accomplishmentDetails]" class="form-label">ACCOMPLISHMENTS</label>
                    <textarea class="form-control" id="accomplishments[${accomplishmentCount}][accomplishmentDetails]" name="accomplishments[${accomplishmentCount}][accomplishmentDetails]" rows="3" required></textarea>
                    <div class="invalid-feedback">Please provide accomplishment details.</div>
                </div>
            `;

			accomplishmentsContainer.appendChild(newAccomplishment);
			accomplishmentCount++;

			// Add event listener to the remove button
			const removeButtons = document.querySelectorAll(".remove-accomplishment");
			removeButtons.forEach((button) => {
				button.addEventListener("click", function () {
					this.closest(".accomplishment-item").remove();
				});
			});
		});
	}

	// Date validation - ensure end date is after start date
	const weekStartDate = document.getElementById("weekStartDate");
	const weekEndDate = document.getElementById("weekEndDate");

	if (weekStartDate && weekEndDate) {
		weekStartDate.addEventListener("change", function () {
			weekEndDate.min = this.value;

			// Calculate max date (7 days after start date)
			if (this.value) {
				const startDate = new Date(this.value);
				const maxDate = new Date(startDate);
				maxDate.setDate(startDate.getDate() + 7);

				// Format the date as YYYY-MM-DD for the input
				const maxDateStr = maxDate.toISOString().split("T")[0];
				weekEndDate.max = maxDateStr;
			}
		});

		weekEndDate.addEventListener("change", function () {
			if (weekStartDate.value && this.value) {
				const startDate = new Date(weekStartDate.value);
				const endDate = new Date(this.value);

				// Check if end date is before start date
				if (endDate < startDate) {
					alert("End date cannot be before start date");
					this.value = "";
					return;
				}

				// Check if date range exceeds 7 days
				const dayDifference = Math.ceil(
					(endDate - startDate) / (1000 * 60 * 60 * 24)
				);
				if (dayDifference > 7) {
					alert("Date range should not exceed 7 days for a weekly report");

					// Set to max allowed date (7 days after start date)
					const maxDate = new Date(startDate);
					maxDate.setDate(startDate.getDate() + 7);
					this.value = maxDate.toISOString().split("T")[0];
				}
			}
		});
	}

	// Text length validation
	const textareaValidation = [
		{ id: "dutiesPerformed", minLength: 10, maxLength: 2000 },
		{ id: "newTrainings", minLength: 10, maxLength: 2000 },
		{ id: "goalsForNextWeek", minLength: 10, maxLength: 1000 },
	];

	textareaValidation.forEach(({ id, minLength, maxLength }) => {
		const textarea = document.getElementById(id);
		if (textarea) {
			// Add character counter
			const counterDiv = document.createElement("div");
			counterDiv.className = "text-muted small mt-1 text-end";
			counterDiv.id = `${id}-counter`;
			counterDiv.textContent = `0/${maxLength} characters`;
			textarea.parentNode.insertBefore(counterDiv, textarea.nextSibling);

			textarea.addEventListener("input", function () {
				const length = this.value.trim().length;

				// Update character counter
				const counter = document.getElementById(`${id}-counter`);
				if (counter) {
					counter.textContent = `${length}/${maxLength} characters`;

					// Change color based on length
					if (length < minLength) {
						counter.style.color = "#dc3545"; // Bootstrap danger color
					} else if (length > maxLength * 0.9) {
						counter.style.color = "#ffc107"; // Bootstrap warning color
					} else {
						counter.style.color = "#6c757d"; // Bootstrap muted color
					}
				}

				// Set validation message
				if (length < minLength) {
					this.setCustomValidity(
						`Please enter at least ${minLength} characters (currently ${length})`
					);
				} else if (length > maxLength) {
					this.setCustomValidity(
						`Please enter no more than ${maxLength} characters (currently ${length})`
					);
				} else {
					this.setCustomValidity("");
				}

				this.reportValidity();
			});
		}
	});

	// Form validation
	const form = document.querySelector(".validated-form");
	if (form) {
		form.addEventListener("submit", function (event) {
			if (!form.checkValidity()) {
				event.preventDefault();
				event.stopPropagation();
			}

			form.classList.add("was-validated");
		});
	}
});
