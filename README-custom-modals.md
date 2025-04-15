# Custom Modals Implementation

This document provides instructions on how to use the custom modals in the application.

## Overview

The custom modals implementation replaces Bootstrap modals with a custom solution that provides:

- Better styling and animations
- Improved user experience
- Consistent design across the application
- Better integration with the notification system

## How to Use Custom Modals

### 1. Modal Trigger Button

To create a button that opens a modal, use the following attributes:

```html
<button 
  type="button" 
  class="btn btn-sm btn-danger" 
  data-toggle="custom-modal" 
  data-target="#yourModalId">
  <i class="fas fa-trash"></i> Delete
</button>
```

### 2. Modal Structure

Here's the basic structure of a custom modal:

```html
<div class="custom-modal" id="yourModalId" tabindex="-1" role="dialog" aria-labelledby="yourModalLabel" aria-hidden="true">
  <div class="custom-modal-dialog">
    <!-- Modal Header -->
    <div class="custom-modal-header custom-modal-header-danger">
      <h5 class="custom-modal-title" id="yourModalLabel">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Modal Title
      </h5>
      <button type="button" class="custom-modal-close" data-dismiss="custom-modal" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <!-- Modal Body -->
    <div class="custom-modal-body">
      <div class="custom-modal-centered">
        <i class="fas fa-user-slash custom-modal-icon text-danger"></i>
        <h4>Main question or message</h4>
      </div>
      
      <!-- Content goes here -->
      <p>Additional information or content</p>
      
      <!-- Alert boxes if needed -->
      <div class="custom-modal-alert custom-modal-alert-info">
        <i class="fas fa-info-circle me-2"></i>
        <div>
          Information message
        </div>
      </div>
    </div>
    
    <!-- Modal Footer -->
    <div class="custom-modal-footer">
      <button type="button" class="custom-modal-btn custom-modal-btn-light" data-dismiss="custom-modal">
        <i class="fas fa-times me-1"></i> Cancel
      </button>
      <form action="/your-action-url" method="POST" class="d-inline">
        <button type="submit" class="custom-modal-btn custom-modal-btn-danger">
          <i class="fas fa-trash me-1"></i> Confirm Action
        </button>
      </form>
    </div>
  </div>
</div>
```

### 3. Modal Header Types

Use these classes for different modal types:

- `custom-modal-header-primary` - Blue header (for general actions)
- `custom-modal-header-success` - Green header (for approvals, unarchiving)
- `custom-modal-header-danger` - Red header (for deletions, rejections)
- `custom-modal-header-info` - Light blue header (for informational modals)
- `custom-modal-header-warning` - Orange header (for warnings)
- `custom-modal-header-secondary` - Gray header (for archiving)

### 4. Button Types

Use these classes for different button types:

- `custom-modal-btn-primary` - Blue button
- `custom-modal-btn-success` - Green button
- `custom-modal-btn-danger` - Red button
- `custom-modal-btn-info` - Light blue button
- `custom-modal-btn-warning` - Orange button
- `custom-modal-btn-secondary` - Gray button
- `custom-modal-btn-light` - Light gray button (for cancel actions)

### 5. Alert Types

Use these classes for different alert types:

- `custom-modal-alert-info` - Light blue alert
- `custom-modal-alert-warning` - Orange alert
- `custom-modal-alert-danger` - Red alert

## JavaScript Integration

The custom modals are automatically initialized when the page loads. If you need to programmatically open or close a modal, you can use the following methods:

```javascript
// Get a modal instance
const modalInstance = CustomModal.getInstance('yourModalId');

// Open a modal
modalInstance.show();

// Close a modal
modalInstance.hide();
```

## Form Handling

Forms inside modals are automatically handled. When a form is submitted, the modal will close and a notification will be shown based on the action type.

## Examples

See the `views/partials/customModalTemplate.ejs` file for examples of different modal types.

## Converting from Bootstrap Modals

1. Change the modal container class from `modal fade` to `custom-modal`
2. Change the dialog class from `modal-dialog` to `custom-modal-dialog`
3. Change the header class from `modal-header` to `custom-modal-header custom-modal-header-{type}`
4. Change the title class from `modal-title` to `custom-modal-title`
5. Change the close button from `btn-close` to `custom-modal-close`
6. Change the body class from `modal-body` to `custom-modal-body`
7. Change the footer class from `modal-footer` to `custom-modal-footer`
8. Change button classes from `btn btn-{type}` to `custom-modal-btn custom-modal-btn-{type}`
9. Change alert classes from `alert alert-{type}` to `custom-modal-alert custom-modal-alert-{type}`
10. Change trigger button attributes from `data-bs-toggle="modal" data-bs-target="#modalId"` to `data-toggle="custom-modal" data-target="#modalId"`
11. Change dismiss attributes from `data-bs-dismiss="modal"` to `data-dismiss="custom-modal"`
