document.addEventListener("DOMContentLoaded", function () {
	const archiveReasonTextarea = document.getElementById("archiveReason");
	const archiveReasonInput = document.getElementById("archiveReasonInput");

	if (archiveReasonTextarea && archiveReasonInput) {
		const archiveForm = archiveReasonInput.closest("form");

		if (archiveForm) {
			const newArchiveForm = archiveForm.cloneNode(true);
			archiveForm.parentNode.replaceChild(newArchiveForm, archiveForm);

			newArchiveForm.addEventListener("submit", function () {
				const newTextarea = document.getElementById("archiveReason");
				const newInput = document.getElementById("archiveReasonInput");
				if (newTextarea && newInput) {
					newInput.value = newTextarea.value;
				}
			});
		}
	}

	const modalTriggerButtons = document.querySelectorAll(
		'[data-bs-toggle="modal"]'
	);
	modalTriggerButtons.forEach((button) => {
		button.addEventListener("click", function (e) {
			e.preventDefault();
		});
	});

	const tooltipTriggerList = [].slice.call(
		document.querySelectorAll('[data-bs-toggle="tooltip"]')
	);
	tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl);
	});
});
