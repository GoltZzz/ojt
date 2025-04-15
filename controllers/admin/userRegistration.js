import User from "../../models/users.js";
import catchAsync from "../../utils/catchAsync.js";

const renderRegisterForm = (req, res) => {
    res.render("admin/register-user");
};

const registerUser = catchAsync(async (req, res) => {
    try {
        const { username, password, firstName, middleName, lastName, role } = req.body;
        
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.flash("error", "Username already exists. Please choose another username.");
            return res.redirect("/admin/register-user");
        }
        
        // Create new user
        const newUser = new User({
            username,
            firstName,
            middleName,
            lastName,
            role: role || "user" // Default to "user" if role is not specified
        });
        
        // Register user with passport-local-mongoose
        const registeredUser = await User.register(newUser, password);
        
        req.flash("success", `User ${username} has been successfully registered`);
        return res.redirect("/admin/users");
    } catch (error) {
        req.flash("error", `Registration failed: ${error.message}`);
        return res.redirect("/admin/register-user");
    }
});

export default {
    renderRegisterForm,
    registerUser
};
