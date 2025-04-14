// Global variable to track if a modal is currently open
let isModalOpen = false;

// Function to handle flash messages
function handleFlashMessages() {
	const flashMessages = document.querySelectorAll(".alert");
	const dismissDelay = 4000; // Increased from 2000ms to 4000ms

	// Position flash messages with proper spacing
	let topOffset = 30; // Starting position from top

	flashMessages.forEach(function (alert, index) {
		// Add progress bar
		const progressBar = document.createElement("div");
		progressBar.className = "alert-progress";
		alert.appendChild(progressBar);

		// Position the alert with proper spacing
		if (index > 0) {
			const previousAlert = flashMessages[index - 1];
			topOffset += previousAlert.offsetHeight + 15; // 15px gap between alerts
		}
		alert.style.top = `${topOffset}px`;

		// If a modal is open, don't show the notification immediately
		if (isModalOpen) {
			alert.style.display = "none";
			return;
		}

		// Start the progress bar animation
		setTimeout(() => {
			progressBar.style.width = "0%";
		}, 10);

		// Set auto-dismiss timeout
		let autoDismissTimeout = setTimeout(() => {
			dismissAlert(alert);
		}, dismissDelay);

		// Pause on hover
		alert.addEventListener("mouseenter", function () {
			clearTimeout(autoDismissTimeout);
			progressBar.style.transition = "none";
		});

		// Resume on mouse leave
		alert.addEventListener("mouseleave", function () {
			const remainingWidth = parseFloat(getComputedStyle(progressBar).width);
			const totalWidth = parseFloat(getComputedStyle(alert).width);
			const remainingTime = (remainingWidth / totalWidth) * dismissDelay;

			progressBar.style.transition = `width ${remainingTime}ms linear`;
			progressBar.style.width = "0%";

			autoDismissTimeout = setTimeout(() => {
				dismissAlert(alert);
			}, remainingTime);
		});
	});
}

// Function to dismiss an alert
function dismissAlert(alert) {
	alert.classList.add("hide");
	setTimeout(() => {
		alert.remove();
		// Reposition remaining alerts
		repositionAlerts();
	}, 400);
}

// Function to reposition alerts after one is dismissed
function repositionAlerts() {
	const flashMessages = document.querySelectorAll(".alert");
	let topOffset = 30;

	flashMessages.forEach(function (alert) {
		alert.style.top = `${topOffset}px`;
		topOffset += alert.offsetHeight + 15;
	});
}

// Function to show notifications after modal is closed
function showPendingNotifications() {
	const hiddenAlerts = document.querySelectorAll(
		".alert[style*='display: none']"
	);
	let topOffset = 30;
	const visibleAlerts = document.querySelectorAll(
		".alert:not([style*='display: none'])"
	);

	// Calculate the current top offset based on visible alerts
	visibleAlerts.forEach((alert) => {
		topOffset += alert.offsetHeight + 15;
	});

	// Show hidden alerts with a staggered animation
	hiddenAlerts.forEach((alert, index) => {
		setTimeout(() => {
			alert.style.display = "flex";
			alert.style.top = `${topOffset}px`;
			topOffset += alert.offsetHeight + 15;

			// Start progress bar and auto-dismiss
			const progressBar = alert.querySelector(".alert-progress");
			if (progressBar) {
				progressBar.style.width = "0%";
				setTimeout(() => {
					dismissAlert(alert);
				}, 4000);
			}
		}, index * 300); // Stagger the appearance by 300ms
	});
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	// Initial handling of flash messages
	handleFlashMessages();

	// Listen for modal events
	document.body.addEventListener("shown.bs.modal", function () {
		isModalOpen = true;
	});

	document.body.addEventListener("hidden.bs.modal", function () {
		isModalOpen = false;
		// Show any pending notifications after modal is closed
		setTimeout(showPendingNotifications, 300);
	});
});
