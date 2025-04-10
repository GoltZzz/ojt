// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the filter form
    const filterForm = document.getElementById('filterForm');
    
    if (filterForm) {
        // Set initial values from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        // Populate form fields with URL parameters
        urlParams.forEach((value, key) => {
            const field = filterForm.elements[key];
            if (field) {
                field.value = value;
            }
        });
        
        // Add event listener for form submission
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Create a new URLSearchParams object
            const params = new URLSearchParams();
            
            // Add form values to params, but only if they have a value
            Array.from(filterForm.elements).forEach(element => {
                if (element.name && element.value) {
                    params.append(element.name, element.value);
                }
            });
            
            // Redirect to the same page with the new query parameters
            window.location.href = window.location.pathname + '?' + params.toString();
        });
        
        // Add event listener for reset button
        filterForm.addEventListener('reset', function() {
            // Wait a moment for the form to reset
            setTimeout(() => {
                // Redirect to the page without query parameters
                window.location.href = window.location.pathname;
            }, 100);
        });
    }
});
