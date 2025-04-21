// Notifications handling
document.addEventListener("DOMContentLoaded", function () {
	// Elements - Sidebar Desktop
	const notificationBtn = document.getElementById("notification-btn");
	const notificationBadge = document.getElementById("notification-badge");
	const notificationList = document.getElementById("notification-list");
	const markAllReadBtn = document.getElementById("mark-all-read");

	// Elements - Sidebar Mobile
	const mobileNotificationBtn = document.getElementById(
		"mobile-notification-btn"
	);
	const mobileNotificationBadge = document.getElementById(
		"mobile-notification-badge"
	);
	const mobileNotificationList = document.getElementById(
		"mobile-notification-list"
	);
	const mobileMarkAllReadBtn = document.getElementById("mobile-mark-all-read");

	// Elements - Header
	const headerNotificationBtn = document.getElementById(
		"header-notification-btn"
	);
	const headerNotificationBadge = document.getElementById(
		"header-notification-badge"
	);
	const headerNotificationList = document.getElementById(
		"header-notification-list"
	);
	const headerMarkAllReadBtn = document.getElementById("header-mark-all-read");

	// Elements - Profile Page
	const profileNotificationList = document.getElementById(
		"profile-notification-list"
	);
	const profileMarkAllReadBtn = document.getElementById(
		"profile-mark-all-read"
	);

	let notifications = [];

	// Fetch notifications
	function fetchNotifications() {
		fetch("/api/notifications")
			.then((response) => response.json())
			.then((data) => {
				console.log("Fetched notifications:", data);
				notifications = data;
				updateNotificationUI();
			})
			.catch((error) => console.error("Error fetching notifications:", error));
	}

	// Update notification UI
	function updateNotificationUI() {
		console.log(
			"Updating notification UI with",
			notifications.length,
			"notifications"
		);

		// Update badges
		if (notifications && notifications.length > 0) {
			const count = notifications.length;
			console.log("Setting badge count to", count);

			// Desktop badge
			if (notificationBadge) {
				notificationBadge.textContent = count;
				notificationBadge.style.display = "block";

				// Force tooltip refresh
				notificationBadge.removeAttribute("data-tooltip-initialized");
				notificationBadge.removeAttribute("data-tooltip-active");
			}

			// Mobile badge
			if (mobileNotificationBadge) {
				mobileNotificationBadge.textContent = count;
				mobileNotificationBadge.style.display = "block";

				// Force tooltip refresh
				mobileNotificationBadge.removeAttribute("data-tooltip-initialized");
				mobileNotificationBadge.removeAttribute("data-tooltip-active");
			}

			// Header badge
			if (headerNotificationBadge) {
				headerNotificationBadge.textContent = count;
				headerNotificationBadge.style.display = "block";

				// Force tooltip refresh
				headerNotificationBadge.removeAttribute("data-tooltip-initialized");
				headerNotificationBadge.removeAttribute("data-tooltip-active");

				// Trigger a custom event to notify the tooltip system
				const event = new CustomEvent("notification-count-updated", {
					detail: { count },
				});
				document.dispatchEvent(event);

				console.log(
					"Header badge updated:",
					headerNotificationBadge.textContent
				);
			} else {
				console.log("Header notification badge element not found");
			}
		} else {
			console.log("No notifications, hiding badges");

			// Hide badges when no notifications
			if (notificationBadge) {
				notificationBadge.style.display = "none";
			}

			if (mobileNotificationBadge) {
				mobileNotificationBadge.style.display = "none";
			}

			if (headerNotificationBadge) {
				headerNotificationBadge.style.display = "none";
			}
		}

		// Update notification lists
		updateNotificationList(notificationList);
		updateNotificationList(mobileNotificationList);
		updateNotificationList(headerNotificationList);
		updateNotificationList(profileNotificationList, true); // true for profile page (larger display)
	}

	// Update a specific notification list
	function updateNotificationList(listElement, isProfilePage = false) {
		if (!listElement) return;

		listElement.innerHTML = "";

		if (notifications.length === 0) {
			listElement.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash ${
											isProfilePage ? "fa-2x mb-3" : "mb-2"
										}"></i>
                    <p>${
											isProfilePage
												? "You have no new notifications"
												: "No new notifications"
										}</p>
                </div>
            `;
			return;
		}

		notifications.forEach((notification) => {
			const li = document.createElement("li");
			li.className = isProfilePage
				? "notification-item notification-item-large"
				: "notification-item";
			li.dataset.id = notification._id;

			// Set icon based on notification type
			let iconClass = "info";
			if (notification.type === "success") iconClass = "success";
			if (notification.type === "danger") iconClass = "danger";
			if (notification.type === "warning") iconClass = "warning";

			// Format time
			const time = new Date(notification.createdAt);
			const timeString = time.toLocaleString();
			const dateFormatted = time.toLocaleDateString();
			const timeFormatted = time.toLocaleTimeString();

			// Get report type name
			const reportTypeName = getReportTypeName(notification.reportType);

			// Different HTML for profile page vs dropdown
			if (isProfilePage) {
				li.innerHTML = `
                <div class="notification-icon ${iconClass}">
                    <i class="fas ${getIconForAction(notification.action)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header-row">
                        <span class="notification-report-type">${reportTypeName}</span>
                        <span class="notification-time">${dateFormatted} at ${timeFormatted}</span>
                    </div>
                    <p class="notification-message">${notification.message}</p>
                    <div class="notification-footer-row">
                        <span class="notification-action-type">${getActionLabel(
													notification.action
												)}</span>
                        <button class="btn btn-sm btn-link view-report-btn">View Report</button>
                    </div>
                </div>
            `;
			} else {
				li.innerHTML = `
                <div class="notification-icon ${iconClass}">
                    <i class="fas ${getIconForAction(notification.action)}"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-message">${notification.message}</p>
                    <span class="notification-time">${timeString}</span>
                </div>
            `;
			}

			// Add click event to mark as read
			li.addEventListener("click", () => {
				markAsRead(notification._id);

				// Redirect to the report
				const reportUrl = getReportUrl(
					notification.reportType,
					notification.reportId
				);
				if (reportUrl) {
					window.location.href = reportUrl;
				}
			});

			listElement.appendChild(li);
		});
	}

	// Mark notification as read
	function markAsRead(id) {
		fetch(`/api/notifications/${id}/read`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.success) {
					// Remove from local array
					notifications = notifications.filter((n) => n._id !== id);
					updateNotificationUI();
				}
			})
			.catch((error) =>
				console.error("Error marking notification as read:", error)
			);
	}

	// Mark all notifications as read
	function markAllAsRead() {
		fetch("/api/notifications/read-all", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.success) {
					notifications = [];
					updateNotificationUI();
				}
			})
			.catch((error) =>
				console.error("Error marking all notifications as read:", error)
			);
	}

	// Helper function to get icon for action
	function getIconForAction(action) {
		switch (action) {
			case "approved":
				return "fa-check-circle";
			case "rejected":
				return "fa-times-circle";
			case "archived":
				return "fa-archive";
			case "unarchived":
				return "fa-box-open";
			default:
				return "fa-bell";
		}
	}

	// Helper function to get action label
	function getActionLabel(action) {
		switch (action) {
			case "approved":
				return "Approved";
			case "rejected":
				return "Rejected";
			case "archived":
				return "Archived";
			case "unarchived":
				return "Unarchived";
			default:
				return "Notification";
		}
	}

	// Helper function to get report type name
	function getReportTypeName(reportType) {
		switch (reportType) {
			case "weeklyreport":
				return "Weekly Report";
			case "weeklyprogress":
				return "Weekly Progress Report";
			case "trainingschedule":
				return "Training Schedule";
			case "learningoutcome":
				return "Learning Outcome";
			case "dailyattendance":
				return "Daily Attendance";
			case "documentation":
				return "Documentation";
			case "timereport":
				return "Time Report";
			default:
				return "Report";
		}
	}

	// Helper function to get report URL
	function getReportUrl(reportType, reportId) {
		switch (reportType) {
			case "weeklyreport":
				return `/weeklyreport/${reportId}`;
			case "weeklyprogress":
				return `/weeklyprogress/${reportId}`;
			case "trainingschedule":
				return `/trainingschedule/${reportId}`;
			case "learningoutcome":
				return `/learningoutcomes/${reportId}`;
			case "dailyattendance":
				return `/dailyattendance/${reportId}`;
			case "documentation":
				return `/documentation/${reportId}`;
			case "timereport":
				return `/timereport/${reportId}`;
			default:
				return null;
		}
	}

	// Event listeners
	if (markAllReadBtn) {
		markAllReadBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			markAllAsRead();
		});
	}

	if (mobileMarkAllReadBtn) {
		mobileMarkAllReadBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			markAllAsRead();
		});
	}

	if (headerMarkAllReadBtn) {
		headerMarkAllReadBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			markAllAsRead();
		});
	}

	// Profile page mark all read button
	if (profileMarkAllReadBtn) {
		profileMarkAllReadBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			markAllAsRead();
		});
	}

	// Initial fetch
	fetchNotifications();

	// Fetch notifications every 30 seconds
	setInterval(fetchNotifications, 30000);
});
