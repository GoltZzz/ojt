document.addEventListener("DOMContentLoaded", function () {
	// Handle archive reason textarea and hidden input
	function setupArchiveForm() {
		const archiveReasonTextarea = document.getElementById("archiveReason");
		const hiddenArchiveReason = document.getElementById("hiddenArchiveReason");
		const archiveForm = document.getElementById("archiveForm");

		if (archiveReasonTextarea && hiddenArchiveReason && archiveForm) {
			console.log("Setting up archive form handler");

			// Add submit event listener to transfer textarea value to hidden input
			archiveForm.addEventListener("submit", function (e) {
				console.log("Archive form submitted");
				hiddenArchiveReason.value = archiveReasonTextarea.value;
				console.log("Archive reason set to:", hiddenArchiveReason.value);
			});
		}
	}

	// Setup archive form
	setupArchiveForm();

	// Direct event handler for unarchive forms
	document.addEventListener("submit", function (e) {
		if (e.target.classList.contains("unarchive-form")) {
			console.log("Unarchive form submitted");
			// Don't prevent default - let the form submit normally

			// Find the closest modal and close it
			const modal = e.target.closest(".modal");
			if (modal) {
				const modalInstance = bootstrap.Modal.getInstance(modal);
				if (modalInstance) {
					modalInstance.hide();
				}
			}
		}
	});

	// Handle modal trigger buttons
	const modalTriggerButtons = document.querySelectorAll(
		'[data-bs-toggle="modal"]'
	);
	modalTriggerButtons.forEach((button) => {
		button.addEventListener("click", function (e) {
			e.preventDefault();

			// Get the target modal ID
			const modalId = button.getAttribute("data-bs-target");
			const modal = document.querySelector(modalId);

			if (modal) {
				// Ensure forms inside modals have proper handling
				const modalForms = modal.querySelectorAll("form:not(.unarchive-form)");
				modalForms.forEach((form) => {
					// Remove any existing submit event listeners
					const newForm = form.cloneNode(true);
					form.parentNode.replaceChild(newForm, form);

					// Add submit event listener
					newForm.addEventListener("submit", function (e) {
						// Get the form action to determine what type of action is being performed
						const formAction = newForm.getAttribute("action");
						let actionType = "";
						let customMessage = "";

						// Determine the action type based on the form action URL
						if (formAction) {
							if (formAction.includes("/archive")) {
								actionType = "archive";
								customMessage = "Report has been archived successfully";
							} else if (formAction.includes("/unarchive")) {
								actionType = "unarchive";
								customMessage = "Report has been unarchived successfully";
							} else if (formAction.includes("/delete")) {
								actionType = "delete";
								customMessage = "User has been deleted successfully";
							} else if (formAction.includes("/approve")) {
								const statusInput = newForm.querySelector(
									'input[name="status"]'
								);
								if (statusInput && statusInput.value === "approved") {
									actionType = "approve";
									customMessage = "Report has been approved successfully";
								} else {
									actionType = "reject";
									customMessage = "Report has been rejected";
								}
							} else if (formAction.includes("/toggle-role")) {
								actionType = "role";
								customMessage = "User role has been updated successfully";
							}
						}

						// Close the modal when form is submitted
						const modalInstance = bootstrap.Modal.getInstance(modal);
						if (modalInstance) {
							modalInstance.hide();

							// Show a custom notification after the modal is closed
							if (customMessage) {
								// Determine notification type based on action
								let notificationType = "success";
								if (actionType === "delete" || actionType === "reject") {
									notificationType = "danger";
								} else if (
									actionType === "archive" ||
									actionType === "unarchive"
								) {
									notificationType = "info";
								}

								// Show the notification after a short delay
								showModalActionNotification(customMessage, notificationType);
							}
						}
					});
				});
			}
		});
	});

	// Initialize tooltips
	const tooltipTriggerList = [].slice.call(
		document.querySelectorAll('[data-bs-toggle="tooltip"]')
	);
	tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl);
	});

	// Add event listeners for all modals
	const allModals = document.querySelectorAll(".modal");
	allModals.forEach((modal) => {
		// When modal is about to be shown
		modal.addEventListener("show.bs.modal", function () {
			// Clear any existing flash messages
			const existingFlashMessages = document.querySelectorAll(".alert");
			existingFlashMessages.forEach((alert) => {
				alert.classList.add("hide");
				setTimeout(() => {
					alert.remove();
				}, 400);
			});
		});
	});
});
