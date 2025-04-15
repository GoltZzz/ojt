/**
 * Custom Modal Implementation
 * A lightweight, customizable modal system to replace Bootstrap modals
 */

// Only define the class if it doesn't already exist
if (typeof window.CustomModal === "undefined") {
	class CustomModal {
		constructor(id, options = {}) {
			this.id = id;
			this.element = document.getElementById(id);
			this.isOpen = false;
			this.options = {
				onOpen: options.onOpen || (() => {}),
				onClose: options.onClose || (() => {}),
				closeOnOverlayClick:
					options.closeOnOverlayClick !== undefined
						? options.closeOnOverlayClick
						: true,
				keyboard: options.keyboard !== undefined ? options.keyboard : true,
			};

			// Initialize if element exists
			if (this.element) {
				this.initialize();
			}
		}

		initialize() {
			console.log("CustomModal: Initializing modal with ID: " + this.id);

			// Set up close button event
			const closeButton = this.element.querySelector(".custom-modal-close");
			if (closeButton) {
				closeButton.addEventListener("click", () => this.hide());
			}

			// Set up overlay click to close
			if (this.options.closeOnOverlayClick) {
				this.element.addEventListener("click", (e) => {
					if (e.target === this.element) {
						this.hide();
					}
				});
			}

			// Set up keyboard events
			if (this.options.keyboard) {
				document.addEventListener("keydown", (e) => {
					if (e.key === "Escape" && this.isOpen) {
						this.hide();
					}
				});
			}

			// Set up form submission handling
			const forms = this.element.querySelectorAll("form:not(.unarchive-form)");
			forms.forEach((form) => {
				form.addEventListener("submit", () => {
					// Get data attributes for custom messages
					const customMessage = form.getAttribute("data-custom-message");
					const actionType = form.getAttribute("data-action-type") || "success";

					// Handle archive form special case
					if (form.id === "archiveForm") {
						const archiveReasonTextarea =
							document.getElementById("archiveReason");
						const hiddenArchiveReason = document.getElementById(
							"hiddenArchiveReason"
						);

						if (archiveReasonTextarea && hiddenArchiveReason) {
							hiddenArchiveReason.value = archiveReasonTextarea.value;
							console.log("Archive reason set to:", hiddenArchiveReason.value);
						}
					}

					// Close the modal
					this.hide();

					// Show notification if needed
					if (customMessage) {
						// Determine notification type based on action
						let notificationType = "success";
						if (actionType === "delete" || actionType === "reject") {
							notificationType = "danger";
						} else if (actionType === "archive" || actionType === "unarchive") {
							notificationType = "info";
						}

						// Show the notification after a short delay
						setTimeout(() => {
							if (typeof showModalActionNotification === "function") {
								showModalActionNotification(customMessage, notificationType);
							}
						}, 300);
					}
				});
			});

			// Handle unarchive forms
			const unarchiveForms = this.element.querySelectorAll(".unarchive-form");
			unarchiveForms.forEach((form) => {
				form.addEventListener("submit", () => {
					console.log("Unarchive form submitted");
					this.hide();
				});
			});
		}

		show() {
			if (this.isOpen) return;

			console.log("Showing modal with ID: " + this.id);

			// Clear any existing flash messages
			const existingFlashMessages = document.querySelectorAll(
				".alert:not(.custom-modal .alert)"
			);
			existingFlashMessages.forEach((alert) => {
				alert.classList.add("hide");
				setTimeout(() => {
					alert.remove();
				}, 400);
			});

			// Show the modal
			this.element.classList.add("active");
			document.body.style.overflow = "hidden"; // Prevent background scrolling
			this.isOpen = true;
			console.log("Modal is now open: " + this.id);

			// Call onOpen callback
			this.options.onOpen();
		}

		hide() {
			if (!this.isOpen) return;

			this.element.classList.remove("active");
			document.body.style.overflow = ""; // Restore scrolling
			this.isOpen = false;

			// Call onClose callback
			this.options.onClose();
		}

		toggle() {
			if (this.isOpen) {
				this.hide();
			} else {
				this.show();
			}
		}
	}

	// Make CustomModal available globally
	window.CustomModal = CustomModal;

	// Modal Manager to handle all modals
	class ModalManager {
		constructor() {
			this.modals = {};
			this.activeModal = null;
		}

		initialize() {
			console.log("ModalManager: Initializing...");

			// Find all custom modal triggers
			const modalTriggers = document.querySelectorAll(
				"[data-custom-modal-target]"
			);
			console.log("Found " + modalTriggers.length + " modal triggers");

			modalTriggers.forEach((trigger) => {
				const targetId = trigger.getAttribute("data-custom-modal-target");

				// Create modal instance if it doesn't exist
				if (!this.modals[targetId]) {
					const modalElement = document.getElementById(targetId);
					if (modalElement) {
						this.modals[targetId] = new CustomModal(targetId);
					}
				}

				// Add click event to trigger
				trigger.addEventListener("click", (e) => {
					e.preventDefault();
					console.log("Modal trigger clicked for: " + targetId);
					this.open(targetId);
				});
			});

			// Initialize all modals that might not have triggers
			document.querySelectorAll(".custom-modal-overlay").forEach((modal) => {
				const modalId = modal.id;
				if (!this.modals[modalId]) {
					this.modals[modalId] = new CustomModal(modalId);
				}
			});
		}

		open(modalId) {
			console.log("Opening modal: " + modalId);

			// Close any active modal first
			if (this.activeModal) {
				this.activeModal.hide();
			}

			// Open the requested modal
			const modal = this.modals[modalId];
			if (modal) {
				modal.show();
				this.activeModal = modal;
			} else {
				console.error(`Modal with ID ${modalId} not found`);
			}
		}

		close(modalId) {
			const modal = modalId ? this.modals[modalId] : this.activeModal;
			if (modal) {
				modal.hide();
				if (this.activeModal === modal) {
					this.activeModal = null;
				}
			}
		}

		closeAll() {
			Object.values(this.modals).forEach((modal) => modal.hide());
			this.activeModal = null;
		}

		// Get a specific modal instance
		getModal(modalId) {
			return this.modals[modalId];
		}
	}

	// Create global modal manager instance
	if (typeof window.modalManager === "undefined") {
		window.modalManager = new ModalManager();

		// Global function to open a modal
		window.openModal = function (modalId) {
			window.modalManager.open(modalId);
		};

		// Global function to close a modal
		window.closeModal = function (modalId) {
			window.modalManager.close(modalId);
		};

		// Global function to close all modals
		window.closeAllModals = function () {
			window.modalManager.closeAll();
		};

		// Initialize modals when DOM is loaded
		document.addEventListener("DOMContentLoaded", function () {
			console.log("Initializing custom modals...");
			window.modalManager.initialize();
		});
	}
} // End of the if statement that checks if CustomModal is already defined
