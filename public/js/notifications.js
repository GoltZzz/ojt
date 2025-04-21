// Notifications handling
document.addEventListener("DOMContentLoaded", function () {
	// Elements - Desktop
	const notificationBtn = document.getElementById("notification-btn");
	const notificationBadge = document.getElementById("notification-badge");
	const notificationList = document.getElementById("notification-list");
	const markAllReadBtn = document.getElementById("mark-all-read");

	// Elements - Mobile
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

	let notifications = [];

	// Fetch notifications
	function fetchNotifications() {
		fetch("/api/notifications")
			.then((response) => response.json())
			.then((data) => {
				notifications = data;
				updateNotificationUI();
			})
			.catch((error) => console.error("Error fetching notifications:", error));
	}

	// Update notification UI
	function updateNotificationUI() {
		// Update badges
		if (notifications.length > 0) {
			// Desktop badge
			if (notificationBadge) {
				notificationBadge.textContent = notifications.length;
				notificationBadge.style.display = "block";
			}

			// Mobile badge
			if (mobileNotificationBadge) {
				mobileNotificationBadge.textContent = notifications.length;
				mobileNotificationBadge.style.display = "block";
			}
		} else {
			// Hide badges when no notifications
			if (notificationBadge) {
				notificationBadge.style.display = "none";
			}

			if (mobileNotificationBadge) {
				mobileNotificationBadge.style.display = "none";
			}
		}

		// Update notification lists
		updateNotificationList(notificationList);
		updateNotificationList(mobileNotificationList);
	}

	// Update a specific notification list
	function updateNotificationList(listElement) {
		if (!listElement) return;

		listElement.innerHTML = "";

		if (notifications.length === 0) {
			listElement.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash mb-2"></i>
                    <p>No new notifications</p>
                </div>
            `;
			return;
		}

		notifications.forEach((notification) => {
			const li = document.createElement("li");
			li.className = "notification-item";
			li.dataset.id = notification._id;

			// Set icon based on notification type
			let iconClass = "info";
			if (notification.type === "success") iconClass = "success";
			if (notification.type === "danger") iconClass = "danger";
			if (notification.type === "warning") iconClass = "warning";

			// Format time
			const time = new Date(notification.createdAt);
			const timeString = time.toLocaleString();

			li.innerHTML = `
                <div class="notification-icon ${iconClass}">
                    <i class="fas ${getIconForAction(notification.action)}"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-message">${notification.message}</p>
                    <span class="notification-time">${timeString}</span>
                </div>
            `;

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

	// Initial fetch
	fetchNotifications();

	// Fetch notifications every 30 seconds
	setInterval(fetchNotifications, 30000);
});
