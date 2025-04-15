/**
 * Notification Badge JavaScript
 * Adds tooltip functionality to notification badges
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips for notification badges
    const notificationBadges = document.querySelectorAll('.notification-badge');
    
    notificationBadges.forEach(badge => {
        const count = badge.textContent.trim();
        let tooltipText = '';
        
        if (count === '1') {
            tooltipText = '1 report needs your attention';
        } else {
            tooltipText = `${count} reports need your attention`;
        }
        
        // Add tooltip attributes
        badge.setAttribute('data-bs-toggle', 'tooltip');
        badge.setAttribute('data-bs-placement', 'right');
        badge.setAttribute('title', tooltipText);
        
        // Add hover effect
        badge.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2)';
        });
        
        badge.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Initialize tooltips for admin indicators
    const adminIndicators = document.querySelectorAll('.admin-indicator');
    
    adminIndicators.forEach(indicator => {
        // Add tooltip attributes
        indicator.setAttribute('data-bs-toggle', 'tooltip');
        indicator.setAttribute('data-bs-placement', 'right');
        indicator.setAttribute('title', 'Pending reports need your attention');
    });
    
    // Initialize Bootstrap tooltips
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});
