import User from "../../models/users.js";
import catchAsync from "../../utils/catchAsync.js";

// Render the user profile page
const renderProfile = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/dashboard");
    }
    res.render("profile/index", { user });
});

// Update the user profile
const updateProfile = catchAsync(async (req, res) => {
    const { firstName, middleName, lastName } = req.body;
    
    // Find the user and update their profile
    const user = await User.findById(req.user._id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/profile");
    }
    
    // Update user fields
    user.firstName = firstName;
    user.middleName = middleName;
    user.lastName = lastName;
    
    await user.save();
    
    req.flash("success", "Profile updated successfully");
    res.redirect("/profile");
});

// Render the change password page
const renderChangePassword = catchAsync(async (req, res) => {
    res.render("profile/change-password");
});

// Update the user's password
const updatePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
        req.flash("error", "New passwords do not match");
        return res.redirect("/profile/change-password");
    }
    
    // Validate password requirements
    const isLengthValid = newPassword.length >= 8 && newPassword.length <= 16;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNoSpecialChars = !/[^a-zA-Z0-9]/.test(newPassword);
    
    if (!isLengthValid || !hasUppercase || !hasNoSpecialChars) {
        let errorMessage = "Password does not meet the requirements: ";
        if (!isLengthValid) {
            errorMessage += "must be between 8-16 characters. ";
        }
        if (!hasUppercase) {
            errorMessage += "must contain at least one uppercase letter. ";
        }
        if (!hasNoSpecialChars) {
            errorMessage += "must not contain special characters. ";
        }
        
        req.flash("error", errorMessage);
        return res.redirect("/profile/change-password");
    }
    
    // Change the password using passport-local-mongoose's method
    const user = await User.findById(req.user._id);
    await user.changePassword(currentPassword, newPassword);
    
    req.flash("success", "Password changed successfully");
    res.redirect("/profile");
});

export default {
    renderProfile,
    updateProfile,
    renderChangePassword,
    updatePassword
};
