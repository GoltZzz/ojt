document.addEventListener("DOMContentLoaded", function () {
	const filterForm = document.getElementById("filterForm");

	if (filterForm) {
		const urlParams = new URLSearchParams(window.location.search);

		urlParams.forEach((value, key) => {
			const field = filterForm.elements[key];
			if (field) {
				field.value = value;
			}
		});

		filterForm.addEventListener("submit", function (e) {
			e.preventDefault();

			const params = new URLSearchParams();

			Array.from(filterForm.elements).forEach((element) => {
				if (element.name && element.value) {
					params.append(element.name, element.value);
				}
			});

			window.location.href = window.location.pathname + "?" + params.toString();
		});

		filterForm.addEventListener("reset", function () {
			setTimeout(() => {
				window.location.href = window.location.pathname;
			}, 100);
		});
	}
});
