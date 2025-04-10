document.addEventListener("DOMContentLoaded", function () {
	const flashMessages = document.querySelectorAll(".alert");

	flashMessages.forEach(function (alert) {
		const progressBar = document.createElement("div");
		progressBar.className = "alert-progress";
		alert.appendChild(progressBar);

		setTimeout(() => {
			progressBar.style.width = "0%";
		}, 10);

		const autoDismissTimeout = setTimeout(() => {
			dismissAlert(alert);
		}, 2000);

		alert.addEventListener("mouseenter", function () {
			clearTimeout(autoDismissTimeout);
			progressBar.style.animationPlayState = "paused";
		});
		alert.addEventListener("mouseleave", function () {
			progressBar.style.animationPlayState = "running";
			const remainingTime =
				(parseFloat(getComputedStyle(progressBar).width) /
					parseFloat(getComputedStyle(alert).width)) *
				2000;
			setTimeout(() => {
				dismissAlert(alert);
			}, remainingTime);
		});
	});

	function dismissAlert(alert) {
		alert.classList.add("hide");
		setTimeout(() => {
			alert.remove();
		}, 400);
	}
});
