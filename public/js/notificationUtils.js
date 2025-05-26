/**
 * Utility functions for handling notifications in modals
 */

// Function to create a custom notification
function createCustomNotification(message, type = 'success') {
    // Create the alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', type === 'danger' ? 'assertive' : 'polite');
    
    // Create the icon based on type
    const svg = document.createElement('svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    
    const path = document.createElement('path');
    
    // Set the appropriate icon path based on notification type
    if (type === 'success') {
        path.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z');
    } else if (type === 'danger') {
        path.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z');
    } else if (type === 'info') {
        path.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z');
    } else if (type === 'warning') {
        path.setAttribute('d', 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z');
    }
    
    svg.appendChild(path);
    
    // Create the message container
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert-message';
    messageDiv.textContent = message;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'btn-close';
    closeButton.setAttribute('type', 'button');
    closeButton.onclick = function() {
        dismissAlert(alert);
    };
    
    // Assemble the alert
    alert.appendChild(svg);
    alert.appendChild(messageDiv);
    alert.appendChild(closeButton);
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'alert-progress';
    alert.appendChild(progressBar);
    
    // Add to document
    document.body.appendChild(alert);
    
    // Position the alert
    const existingAlerts = document.querySelectorAll('.alert:not([style*="display: none"])');
    let topOffset = 30;
    
    existingAlerts.forEach(existingAlert => {
        if (existingAlert !== alert) {
            topOffset += existingAlert.offsetHeight + 15;
        }
    });
    
    alert.style.top = `${topOffset}px`;
    
    // Start the progress bar animation
    setTimeout(() => {
        progressBar.style.width = '0%';
    }, 10);
    
    // Set auto-dismiss timeout
    const autoDismissTimeout = setTimeout(() => {
        dismissAlert(alert);
    }, 4000);
    
    // Pause on hover
    alert.addEventListener('mouseenter', function() {
        clearTimeout(autoDismissTimeout);
        progressBar.style.transition = 'none';
    });
    
    // Resume on mouse leave
    alert.addEventListener('mouseleave', function() {
        const remainingWidth = parseFloat(getComputedStyle(progressBar).width);
        const totalWidth = parseFloat(getComputedStyle(alert).width);
        const remainingTime = (remainingWidth / totalWidth) * 4000;
        
        progressBar.style.transition = `width ${remainingTime}ms linear`;
        progressBar.style.width = '0%';
        
        setTimeout(() => {
            dismissAlert(alert);
        }, remainingTime);
    });
    
    return alert;
}

// Function to show a notification after a modal action
function showModalActionNotification(message, type = 'success') {
    // Wait for modal to close before showing notification
    setTimeout(() => {
        createCustomNotification(message, type);
    }, 300);
}
