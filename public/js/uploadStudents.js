document.addEventListener("DOMContentLoaded", function () {
	const uploadForm = document.getElementById("uploadStudentsForm");
	if (!uploadForm) return;

	uploadForm.addEventListener("submit", async function (e) {
		e.preventDefault();

		const fileInput = document.getElementById("excelFile");
		const file = fileInput.files[0];

		if (!file) {
			showModalActionNotification("Please select a file to upload", "danger");
			return;
		}

		const formData = new FormData();
		formData.append("excel", file);

		try {
			const response = await fetch("/api/admin/upload-students", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (response.ok) {
				// Close the modal
				window.closeModal("uploadStudentsModal");

				// Create a detailed message
				const successCount = result.summary.successful;
				const failedCount = result.summary.failed;
				const totalCount = result.summary.total;

				let message = `Processed ${totalCount} students: ${successCount} successful`;

				if (failedCount > 0) {
					message += `, ${failedCount} failed\n\nErrors:`;
					// Add the first 3 errors to the notification
					result.failed.slice(0, 3).forEach((failure) => {
						message += `\nRow ${failure.row}: ${failure.reason}`;
					});
					if (result.failed.length > 3) {
						message += `\n...and ${result.failed.length - 3} more errors`;
					}

					// Log all errors to console for debugging
					console.log("Full upload results:", result);
				}

				showModalActionNotification(
					message,
					failedCount > 0 ? "warning" : "success"
				);

				// Reload the page after a delay to show new users
				setTimeout(() => {
					window.location.reload();
				}, 2500); // Increased delay to give users time to read the message
			} else {
				throw new Error(result.error || "Failed to upload students");
			}
		} catch (error) {
			showModalActionNotification(error.message, "danger");
		}
	});
});
