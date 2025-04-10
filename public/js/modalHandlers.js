// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Handle archive reason transfer
    const archiveReasonTextarea = document.getElementById('archiveReason');
    const archiveReasonInput = document.getElementById('archiveReasonInput');
    
    if (archiveReasonTextarea && archiveReasonInput) {
        const archiveForm = archiveReasonInput.closest('form');
        
        if (archiveForm) {
            // Remove any existing event listeners (to prevent duplicates)
            const newArchiveForm = archiveForm.cloneNode(true);
            archiveForm.parentNode.replaceChild(newArchiveForm, archiveForm);
            
            // Add the event listener to the new form
            newArchiveForm.addEventListener('submit', function() {
                const newTextarea = document.getElementById('archiveReason');
                const newInput = document.getElementById('archiveReasonInput');
                if (newTextarea && newInput) {
                    newInput.value = newTextarea.value;
                }
            });
        }
    }
    
    // Prevent default form submission for modal buttons that should just open modals
    const modalTriggerButtons = document.querySelectorAll('[data-bs-toggle="modal"]');
    modalTriggerButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // The modal will be shown automatically by Bootstrap
        });
    });
    
    // Initialize all Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
