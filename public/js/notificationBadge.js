/**
 * Notification Badge JavaScript
 * Adds tooltip functionality to notification badges
 */

document.addEventListener("DOMContentLoaded", function () {
	// Function to initialize tooltips for notification badges
	function initializeTooltips() {
		// Initialize tooltips for notification badges
		const notificationBadges = document.querySelectorAll(".notification-badge");

		notificationBadges.forEach((badge) => {
			// Skip badges that already have tooltips
			if (badge.hasAttribute("data-tooltip-initialized")) {
				return;
			}

			const count = badge.textContent.trim();
			let tooltipText = "";

			// For admin pending reports badges
			if (badge.closest('a[href*="pending-reports"]')) {
				if (count === "1") {
					tooltipText = "1 report needs your approval";
				} else {
					tooltipText = `${count} reports need your approval`;
				}
			}
			// For user notification badges
			else if (
				badge.id === "header-notification-badge" ||
				badge.id === "notification-badge" ||
				badge.id === "mobile-notification-badge"
			) {
				if (count === "1") {
					tooltipText = "1 notification";
				} else {
					tooltipText = `${count} notifications`;
				}
			}
			// Default case
			else {
				if (count === "1") {
					tooltipText = "1 item needs your attention";
				} else {
					tooltipText = `${count} items need your attention`;
				}
			}

			// Add tooltip attributes
			badge.setAttribute("data-bs-toggle", "tooltip");
			badge.setAttribute("data-bs-placement", "right");
			badge.setAttribute("title", tooltipText);
			badge.setAttribute("data-tooltip-initialized", "true");

			// Add hover effect
			badge.addEventListener("mouseenter", function () {
				this.style.transform = "scale(1.2)";
			});

			badge.addEventListener("mouseleave", function () {
				this.style.transform = "scale(1)";
			});
		});

		// Initialize tooltips for admin indicators
		const adminIndicators = document.querySelectorAll(".admin-indicator");

		adminIndicators.forEach((indicator) => {
			// Add tooltip attributes
			indicator.setAttribute("data-bs-toggle", "tooltip");
			indicator.setAttribute("data-bs-placement", "right");
			indicator.setAttribute("title", "Pending reports need your attention");
		});

		// Initialize Bootstrap tooltips
		if (typeof bootstrap !== "undefined") {
			const tooltipTriggerList = [].slice.call(
				document.querySelectorAll(
					'[data-bs-toggle="tooltip"]:not([data-tooltip-active="true"])'
				)
			);
			tooltipTriggerList.forEach(function (tooltipTriggerEl) {
				tooltipTriggerEl.setAttribute("data-tooltip-active", "true");
				new bootstrap.Tooltip(tooltipTriggerEl);
			});
		}
	}

	// Initialize tooltips on page load
	initializeTooltips();

	// Re-initialize tooltips when notification counts change
	// This handles dynamically added notification badges
	const observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			if (mutation.type === "childList" || mutation.type === "attributes") {
				initializeTooltips();
			}
		});
	});

	// Observe the entire document for changes to notification badges
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["style", "class"],
	});

	// Listen for custom notification count update events
	document.addEventListener("notification-count-updated", function (e) {
		console.log("Notification count updated event received:", e.detail.count);
		setTimeout(initializeTooltips, 100); // Small delay to ensure DOM is updated
	});
});
