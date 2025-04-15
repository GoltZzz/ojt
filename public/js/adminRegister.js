// Form validation script
(function () {
	"use strict";

	// Fetch all the forms we want to apply custom Bootstrap validation styles to
	const forms = document.querySelectorAll(".needs-validation");

	// Loop over them and prevent submission
	Array.from(forms).forEach((form) => {
		form.addEventListener(
			"submit",
			(event) => {
				if (!form.checkValidity()) {
					event.preventDefault();
					event.stopPropagation();
				}

				form.classList.add("was-validated");
			},
			false
		);
	});

	// Role selector functionality
	const userRole = document.getElementById("userRole");
	const adminRole = document.getElementById("adminRole");
	const roleInput = document.getElementById("roleInput");

	userRole.addEventListener("click", function () {
		userRole.classList.add("selected");
		adminRole.classList.remove("selected");
		roleInput.value = "user";
	});

	adminRole.addEventListener("click", function () {
		adminRole.classList.add("selected");
		userRole.classList.remove("selected");
		roleInput.value = "admin";
	});

	// Role info card toggle functionality
	const roleInfoBtn = document.getElementById("roleInfoBtn");
	const roleInfoCard = document.getElementById("roleInfoCard");
	const closeRoleInfo = document.getElementById("closeRoleInfo");
	let roleInfoVisible = false;

	// Function to toggle role info card
	function toggleRoleInfo() {
		roleInfoVisible = !roleInfoVisible;
		roleInfoCard.style.display = roleInfoVisible ? "block" : "none";

		// Add active state to the button
		if (roleInfoVisible) {
			roleInfoBtn.classList.add("active");
			roleInfoBtn.classList.remove("btn-outline-info");
			roleInfoBtn.classList.add("btn-info");
			roleInfoBtn.style.color = "white";
		} else {
			roleInfoBtn.classList.remove("active");
			roleInfoBtn.classList.remove("btn-info");
			roleInfoBtn.classList.add("btn-outline-info");
			roleInfoBtn.style.color = "";
		}
	}

	// Add click event to the button
	roleInfoBtn.addEventListener("click", toggleRoleInfo);

	// Add click event to the icon inside the button
	roleInfoBtn
		.querySelector(".fas.fa-info-circle")
		.addEventListener("click", function (e) {
			// Prevent the event from bubbling up to the button
			e.stopPropagation();
			toggleRoleInfo();
		});

	closeRoleInfo.addEventListener("click", function () {
		roleInfoVisible = false;
		roleInfoCard.style.display = "none";
		roleInfoBtn.classList.remove("active");
		roleInfoBtn.classList.remove("btn-info");
		roleInfoBtn.classList.add("btn-outline-info");
		roleInfoBtn.style.color = "";
	});

	// Close role info card when clicking outside
	document.addEventListener("click", function (event) {
		if (
			roleInfoVisible &&
			!roleInfoCard.contains(event.target) &&
			event.target !== roleInfoBtn
		) {
			roleInfoVisible = false;
			roleInfoCard.style.display = "none";
			roleInfoBtn.classList.remove("active");
			roleInfoBtn.classList.remove("btn-info");
			roleInfoBtn.classList.add("btn-outline-info");
			roleInfoBtn.style.color = "";
		}
	});

	// Password info card toggle functionality
	const passwordInfoBtn = document.getElementById("passwordInfoBtn");
	const passwordInfoCard = document.getElementById("passwordInfoCard");
	const closePasswordInfo = document.getElementById("closePasswordInfo");
	let passwordInfoVisible = false;

	// Function to toggle password info card
	function togglePasswordInfo() {
		passwordInfoVisible = !passwordInfoVisible;
		passwordInfoCard.style.display = passwordInfoVisible ? "block" : "none";

		// Add active state to the button
		if (passwordInfoVisible) {
			passwordInfoBtn.classList.add("active");
			passwordInfoBtn.classList.remove("btn-outline-info");
			passwordInfoBtn.classList.add("btn-info");
			passwordInfoBtn.style.color = "white";
		} else {
			passwordInfoBtn.classList.remove("active");
			passwordInfoBtn.classList.remove("btn-info");
			passwordInfoBtn.classList.add("btn-outline-info");
			passwordInfoBtn.style.color = "";
		}
	}

	// Add click event to the button
	passwordInfoBtn.addEventListener("click", togglePasswordInfo);

	// Add click event to the icon inside the button
	passwordInfoBtn
		.querySelector(".fas.fa-info-circle")
		.addEventListener("click", function (e) {
			// Prevent the event from bubbling up to the button
			e.stopPropagation();
			togglePasswordInfo();
		});

	closePasswordInfo.addEventListener("click", function () {
		passwordInfoVisible = false;
		passwordInfoCard.style.display = "none";
		passwordInfoBtn.classList.remove("active");
		passwordInfoBtn.classList.remove("btn-info");
		passwordInfoBtn.classList.add("btn-outline-info");
		passwordInfoBtn.style.color = "";
	});

	// Close password info card when clicking outside
	document.addEventListener("click", function (event) {
		if (
			passwordInfoVisible &&
			!passwordInfoCard.contains(event.target) &&
			event.target !== passwordInfoBtn
		) {
			passwordInfoVisible = false;
			passwordInfoCard.style.display = "none";
			passwordInfoBtn.classList.remove("active");
			passwordInfoBtn.classList.remove("btn-info");
			passwordInfoBtn.classList.add("btn-outline-info");
			passwordInfoBtn.style.color = "";
		}
	});

	// Password toggle visibility
	const togglePassword = document.getElementById("togglePassword");
	const passwordInput = document.getElementById("password");

	togglePassword.addEventListener("click", function () {
		const type =
			passwordInput.getAttribute("type") === "password" ? "text" : "password";
		passwordInput.setAttribute("type", type);

		// Toggle eye icon
		this.querySelector("i").classList.toggle("fa-eye");
		this.querySelector("i").classList.toggle("fa-eye-slash");
	});

	// Password validation
	const passwordValid = document.getElementById("passwordValid");
	const passwordInvalid = document.getElementById("passwordInvalid");
	const passwordCheckIndicator = document.getElementById(
		"passwordCheckIndicator"
	);
	const passwordError = document.getElementById("passwordError");
	const lengthCheck = document.getElementById("lengthCheck");
	const uppercaseCheck = document.getElementById("uppercaseCheck");
	const specialCharCheck = document.getElementById("specialCharCheck");
	let isPasswordValid = false;
	let passwordTimeout;

	// Show password info when clicking on validation icons
	passwordValid.addEventListener("click", function () {
		passwordInfoVisible = true;
		passwordInfoCard.style.display = "block";
		passwordInfoBtn.classList.add("active");
		passwordInfoBtn.classList.remove("btn-outline-info");
		passwordInfoBtn.classList.add("btn-info");
		passwordInfoBtn.style.color = "white";
	});

	passwordInvalid.addEventListener("click", function () {
		passwordInfoVisible = true;
		passwordInfoCard.style.display = "block";
		passwordInfoBtn.classList.add("active");
		passwordInfoBtn.classList.remove("btn-outline-info");
		passwordInfoBtn.classList.add("btn-info");
		passwordInfoBtn.style.color = "white";
	});

	passwordInput.addEventListener("input", function () {
		const password = this.value;

		// Clear any existing timeout
		clearTimeout(passwordTimeout);

		// Set a timeout to validate password after user stops typing
		passwordTimeout = setTimeout(function () {
			validatePassword(password);
		}, 300);
	});

	function validatePassword(password) {
		// Check length (8-16 characters)
		const isLengthValid = password.length >= 8 && password.length <= 16;

		// Check for at least one uppercase letter
		const hasUppercase = /[A-Z]/.test(password);

		// Check for no special characters
		const hasNoSpecialChars = !/[^a-zA-Z0-9]/.test(password);

		// Update the check indicators
		updateCheckIndicator(lengthCheck, isLengthValid);
		updateCheckIndicator(uppercaseCheck, hasUppercase);
		updateCheckIndicator(specialCharCheck, hasNoSpecialChars);

		// Overall password validity
		isPasswordValid = isLengthValid && hasUppercase && hasNoSpecialChars;

		// Show the appropriate indicator
		if (password.length > 0) {
			passwordCheckIndicator.style.display = "block";
			passwordValid.style.display = isPasswordValid ? "inline-block" : "none";
			passwordInvalid.style.display = isPasswordValid ? "none" : "inline-block";
			passwordError.style.display = isPasswordValid ? "none" : "block";
		} else {
			passwordCheckIndicator.style.display = "none";
			passwordError.style.display = "none";
		}
	}

	function updateCheckIndicator(element, isValid) {
		const icon = element.querySelector("i");
		if (isValid) {
			icon.classList.remove("fa-times-circle", "text-danger");
			icon.classList.add("fa-check-circle", "text-success");
		} else {
			icon.classList.remove("fa-check-circle", "text-success");
			icon.classList.add("fa-times-circle", "text-danger");
		}
	}

	// Username uniqueness validation
	const usernameInput = document.getElementById("username");
	const usernameCheckIndicator = document.getElementById(
		"usernameCheckIndicator"
	);
	const usernameSpinner = document.getElementById("usernameSpinner");
	const usernameAvailable = document.getElementById("usernameAvailable");
	const usernameUnavailable = document.getElementById("usernameUnavailable");
	const usernameError = document.getElementById("usernameError");
	let usernameTimeout;
	let isUsernameValid = true;

	// Username info card toggle functionality
	const usernameInfoBtn = document.getElementById("usernameInfoBtn");
	const usernameInfoCard = document.getElementById("usernameInfoCard");
	const closeUsernameInfo = document.getElementById("closeUsernameInfo");
	let usernameInfoVisible = false;

	// Function to toggle username info card
	function toggleUsernameInfo() {
		usernameInfoVisible = !usernameInfoVisible;
		usernameInfoCard.style.display = usernameInfoVisible ? "block" : "none";

		// Add active state to the button
		if (usernameInfoVisible) {
			usernameInfoBtn.classList.add("active");
			usernameInfoBtn.classList.remove("btn-outline-info");
			usernameInfoBtn.classList.add("btn-info");
			usernameInfoBtn.style.color = "white";
		} else {
			usernameInfoBtn.classList.remove("active");
			usernameInfoBtn.classList.remove("btn-info");
			usernameInfoBtn.classList.add("btn-outline-info");
			usernameInfoBtn.style.color = "";
		}
	}

	// Add click event to the button
	usernameInfoBtn.addEventListener("click", toggleUsernameInfo);

	// Add click event to the icon inside the button
	usernameInfoBtn
		.querySelector(".fas.fa-info-circle")
		.addEventListener("click", function (e) {
			// Prevent the event from bubbling up to the button
			e.stopPropagation();
			toggleUsernameInfo();
		});

	closeUsernameInfo.addEventListener("click", function () {
		usernameInfoVisible = false;
		usernameInfoCard.style.display = "none";
		usernameInfoBtn.classList.remove("active");
		usernameInfoBtn.classList.remove("btn-info");
		usernameInfoBtn.classList.add("btn-outline-info");
		usernameInfoBtn.style.color = "";
	});

	// Close username info card when clicking outside
	document.addEventListener("click", function (event) {
		if (
			usernameInfoVisible &&
			!usernameInfoCard.contains(event.target) &&
			event.target !== usernameInfoBtn
		) {
			usernameInfoVisible = false;
			usernameInfoCard.style.display = "none";
			usernameInfoBtn.classList.remove("active");
			usernameInfoBtn.classList.remove("btn-info");
			usernameInfoBtn.classList.add("btn-outline-info");
			usernameInfoBtn.style.color = "";
		}
	});

	// Add tooltip functionality to username validation icons
	usernameAvailable.addEventListener("click", function () {
		// Show the username info card when clicking on the available icon
		usernameInfoVisible = true;
		usernameInfoCard.style.display = "block";
		usernameInfoBtn.classList.add("active");
		usernameInfoBtn.classList.remove("btn-outline-info");
		usernameInfoBtn.classList.add("btn-info");
		usernameInfoBtn.style.color = "white";
	});

	usernameUnavailable.addEventListener("click", function () {
		// Show the username info card when clicking on the unavailable icon
		usernameInfoVisible = true;
		usernameInfoCard.style.display = "block";
		usernameInfoBtn.classList.add("active");
		usernameInfoBtn.classList.remove("btn-outline-info");
		usernameInfoBtn.classList.add("btn-info");
		usernameInfoBtn.style.color = "white";
	});

	usernameInput.addEventListener("input", function () {
		const username = this.value.trim();

		// Clear any existing timeout
		clearTimeout(usernameTimeout);

		// Reset validation state
		usernameAvailable.style.display = "none";
		usernameUnavailable.style.display = "none";
		usernameError.style.display = "none";

		if (username.length < 3) {
			usernameCheckIndicator.style.display = "none";
			return;
		}

		// Show spinner
		usernameCheckIndicator.style.display = "block";
		usernameSpinner.style.display = "inline-block";

		// Set a timeout to check username after user stops typing
		usernameTimeout = setTimeout(function () {
			checkUsername(username);
		}, 500);
	});

	async function checkUsername(username) {
		try {
			const response = await fetch(
				`/api/admin/check-username?username=${encodeURIComponent(username)}`
			);
			const data = await response.json();

			// Hide spinner
			usernameSpinner.style.display = "none";

			if (data.exists) {
				// Username exists
				usernameUnavailable.style.display = "inline-block";
				usernameError.style.display = "block";
				isUsernameValid = false;
			} else {
				// Username is available
				usernameAvailable.style.display = "inline-block";
				isUsernameValid = true;
			}
		} catch (error) {
			console.error("Error checking username:", error);
			usernameSpinner.style.display = "none";
		}
	}

	// Add form submission validation
	const form = document.querySelector("form");
	const originalSubmitHandler = form.onsubmit;

	form.addEventListener("submit", function (event) {
		let isFormValid = true;

		// Check username validity
		if (!isUsernameValid && usernameInput.value.trim().length > 0) {
			isFormValid = false;
			usernameError.style.display = "block";
		}

		// Check password validity
		if (!isPasswordValid && passwordInput.value.length > 0) {
			isFormValid = false;
			passwordError.style.display = "block";
		}

		if (!isFormValid) {
			event.preventDefault();
			event.stopPropagation();

			// Focus on the first invalid field
			if (!isUsernameValid && usernameInput.value.trim().length > 0) {
				usernameInput.focus();
			} else if (!isPasswordValid && passwordInput.value.length > 0) {
				passwordInput.focus();
			}
		}
	});
})();
