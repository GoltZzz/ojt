/**
 * Custom Modal Implementation
 * Replaces Bootstrap modals with custom implementation
 */

class CustomModal {
  constructor(id, options = {}) {
    this.id = id;
    this.element = document.getElementById(id);
    this.isOpen = false;
    this.options = {
      keyboard: options.keyboard !== false,
      backdrop: options.backdrop !== false,
      focus: options.focus !== false,
      ...options
    };
    
    // Store references to modal elements
    this.modalDialog = this.element.querySelector('.custom-modal-dialog');
    this.closeButtons = this.element.querySelectorAll('.custom-modal-close, [data-dismiss="custom-modal"]');
    
    // Bind methods
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  /**
   * Initialize event listeners for the modal
   */
  initEventListeners() {
    // Close button click handlers
    this.closeButtons.forEach(button => {
      button.addEventListener('click', this.hide);
    });
    
    // Backdrop click handler
    this.element.addEventListener('click', this.handleBackdropClick);
    
    // Prevent clicks inside dialog from closing modal
    if (this.modalDialog) {
      this.modalDialog.addEventListener('click', e => {
        e.stopPropagation();
      });
    }
  }
  
  /**
   * Show the modal
   */
  show() {
    if (this.isOpen) return;
    
    // Create backdrop if it doesn't exist
    if (this.options.backdrop !== false) {
      this.createBackdrop();
    }
    
    // Show the modal
    this.element.classList.add('show');
    
    // Add body class to prevent scrolling
    document.body.classList.add('custom-modal-open');
    document.body.style.overflow = 'hidden';
    
    // Add keyboard event listener
    if (this.options.keyboard) {
      document.addEventListener('keydown', this.handleKeyDown);
    }
    
    // Focus the first focusable element
    if (this.options.focus) {
      this.setInitialFocus();
    }
    
    // Set open state
    this.isOpen = true;
    
    // Trigger custom event
    this.element.dispatchEvent(new CustomEvent('shown.custom.modal'));
    
    // Clear any existing flash messages
    this.clearExistingFlashMessages();
  }
  
  /**
   * Hide the modal
   */
  hide() {
    if (!this.isOpen) return;
    
    // Hide the modal
    this.element.classList.remove('show');
    
    // Remove backdrop
    this.removeBackdrop();
    
    // Remove body class
    document.body.classList.remove('custom-modal-open');
    document.body.style.overflow = '';
    
    // Remove keyboard event listener
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Set closed state
    this.isOpen = false;
    
    // Trigger custom event
    this.element.dispatchEvent(new CustomEvent('hidden.custom.modal'));
  }
  
  /**
   * Create backdrop element
   */
  createBackdrop() {
    // Remove any existing backdrop
    this.removeBackdrop();
    
    // Create new backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'custom-modal-backdrop';
    document.body.appendChild(this.backdrop);
    
    // Force reflow to enable transition
    this.backdrop.offsetHeight;
    
    // Show backdrop
    this.backdrop.classList.add('show');
  }
  
  /**
   * Remove backdrop element
   */
  removeBackdrop() {
    if (this.backdrop) {
      this.backdrop.classList.remove('show');
      
      // Remove after transition
      setTimeout(() => {
        if (this.backdrop && this.backdrop.parentNode) {
          this.backdrop.parentNode.removeChild(this.backdrop);
          this.backdrop = null;
        }
      }, 300);
    }
  }
  
  /**
   * Handle backdrop click
   * @param {Event} event - Click event
   */
  handleBackdropClick(event) {
    if (this.options.backdrop === 'static') return;
    
    // Only close if clicking directly on the modal container (not the dialog)
    if (event.target === this.element) {
      this.hide();
    }
  }
  
  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    if (event.key === 'Escape' && this.options.keyboard) {
      this.hide();
    }
  }
  
  /**
   * Set focus to the first focusable element in the modal
   */
  setInitialFocus() {
    setTimeout(() => {
      const focusableElements = this.element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }, 300);
  }
  
  /**
   * Clear existing flash messages
   */
  clearExistingFlashMessages() {
    const existingFlashMessages = document.querySelectorAll('.alert');
    existingFlashMessages.forEach(alert => {
      alert.classList.add('hide');
      setTimeout(() => {
        alert.remove();
      }, 400);
    });
  }
  
  /**
   * Get the modal instance
   * @returns {CustomModal} The modal instance
   */
  static getInstance(id) {
    const element = document.getElementById(id);
    if (!element) return null;
    
    return element.customModal || null;
  }
}

/**
 * Initialize all custom modals on the page
 */
function initCustomModals() {
  const modals = document.querySelectorAll('.custom-modal');
  
  modals.forEach(modal => {
    const id = modal.id;
    if (!id) return;
    
    // Create modal instance
    const modalInstance = new CustomModal(id);
    
    // Store instance on the element
    modal.customModal = modalInstance;
  });
  
  // Handle modal triggers
  const modalTriggers = document.querySelectorAll('[data-toggle="custom-modal"]');
  
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = trigger.getAttribute('data-target');
      if (!targetId) return;
      
      const targetModal = document.querySelector(targetId);
      if (!targetModal) return;
      
      const modalInstance = CustomModal.getInstance(targetModal.id);
      if (modalInstance) {
        modalInstance.show();
      }
    });
  });
}

/**
 * Handle form submissions inside modals
 */
function handleModalForms() {
  document.addEventListener('submit', function(e) {
    const form = e.target;
    const modal = form.closest('.custom-modal');
    
    if (modal && !form.classList.contains('unarchive-form')) {
      // Get the form action to determine what type of action is being performed
      const formAction = form.getAttribute('action');
      let actionType = '';
      let customMessage = '';
      
      // Determine action type and message based on form action
      if (formAction.includes('/delete')) {
        actionType = 'delete';
        customMessage = 'User has been deleted successfully.';
      } else if (formAction.includes('/archive')) {
        actionType = 'archive';
        customMessage = 'Report has been archived successfully.';
      } else if (formAction.includes('/unarchive')) {
        actionType = 'unarchive';
        customMessage = 'Report has been unarchived successfully.';
      } else if (formAction.includes('/approve')) {
        const statusInput = form.querySelector('input[name="status"]');
        if (statusInput && statusInput.value === 'approved') {
          actionType = 'approve';
          customMessage = 'Report has been approved successfully.';
        } else if (statusInput && statusInput.value === 'rejected') {
          actionType = 'reject';
          customMessage = 'Report has been rejected successfully.';
        }
      } else if (formAction.includes('/role')) {
        actionType = 'role';
        customMessage = 'User role has been updated successfully.';
      }
      
      // Close the modal
      const modalInstance = CustomModal.getInstance(modal.id);
      if (modalInstance) {
        modalInstance.hide();
        
        // Show a custom notification after the modal is closed
        if (customMessage) {
          // Determine notification type based on action
          let notificationType = 'success';
          if (actionType === 'delete' || actionType === 'reject') {
            notificationType = 'danger';
          } else if (actionType === 'archive' || actionType === 'unarchive') {
            notificationType = 'info';
          }
          
          // Show the notification after a short delay
          setTimeout(() => {
            if (typeof showModalActionNotification === 'function') {
              showModalActionNotification(customMessage, notificationType);
            }
          }, 300);
        }
      }
    }
  });
  
  // Special handling for unarchive forms
  document.addEventListener('submit', function(e) {
    if (e.target.classList.contains('unarchive-form')) {
      console.log('Unarchive form submitted');
      
      // Find the closest modal and close it
      const modal = e.target.closest('.custom-modal');
      if (modal) {
        const modalInstance = CustomModal.getInstance(modal.id);
        if (modalInstance) {
          modalInstance.hide();
        }
      }
    }
  });
}

/**
 * Handle archive form setup
 */
function setupArchiveForm() {
  const archiveReasonTextarea = document.getElementById('archiveReason');
  const hiddenArchiveReason = document.getElementById('hiddenArchiveReason');
  const archiveForm = document.getElementById('archiveForm');
  
  if (archiveReasonTextarea && hiddenArchiveReason && archiveForm) {
    console.log('Setting up archive form handler');
    
    // Add submit event listener to transfer textarea value to hidden input
    archiveForm.addEventListener('submit', function(e) {
      console.log('Archive form submitted');
      hiddenArchiveReason.value = archiveReasonTextarea.value;
      console.log('Archive reason set to:', hiddenArchiveReason.value);
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initCustomModals();
  handleModalForms();
  setupArchiveForm();
});

// Export modal class for external use
window.CustomModal = CustomModal;
