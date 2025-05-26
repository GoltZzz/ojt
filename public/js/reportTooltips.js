/**
 * Initialize tooltips for report elements
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function(tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Add hover effect to rows with user's reports
    const userReportRows = document.querySelectorAll('.current-user-report');
    userReportRows.forEach(row => {
        const badge = row.querySelector('.your-report-badge');
        
        if (badge) {
            // Add pulse animation on hover
            row.addEventListener('mouseenter', function() {
                badge.classList.add('pulse-animation');
            });
            
            row.addEventListener('mouseleave', function() {
                badge.classList.remove('pulse-animation');
            });
        }
    });
});
