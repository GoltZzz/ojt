/**
 * Dashboard Clock and Date Display
 * Updates the current time and date in the dashboard header
 */
document.addEventListener('DOMContentLoaded', function() {
    // Update the date and time
    function updateDateTime() {
        const now = new Date();
        
        // Format date: Monday, January 1, 2023
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const formattedDate = now.toLocaleDateString(undefined, dateOptions);
        
        // Format time: 12:00 PM
        const timeOptions = { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        };
        const formattedTime = now.toLocaleTimeString(undefined, timeOptions);
        
        // Update the elements
        const dateElement = document.getElementById('current-date');
        const timeElement = document.getElementById('current-time');
        
        if (dateElement) dateElement.textContent = formattedDate;
        if (timeElement) timeElement.textContent = formattedTime;
    }
    
    // Initial update
    updateDateTime();
    
    // Update every second
    setInterval(updateDateTime, 1000);
});
