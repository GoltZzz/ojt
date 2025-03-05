// document.addEventListener("DOMContentLoaded", function () {
// 	const sidebar = document.querySelector(".sidebar");
// 	const toggleBtn = document.querySelector(".toggle-sidebar");
// 	const mainContent = document.querySelector(".main-content");

// 	// Load sidebar state from localStorage
// 	const sidebarState = localStorage.getItem("sidebarState");
// 	if (sidebarState === "collapsed") {
// 		sidebar.classList.add("collapsed");
// 		mainContent.style.marginLeft = "70px";
// 	}

// 	toggleBtn.addEventListener("click", () => {
// 		sidebar.classList.toggle("collapsed");

// 		// Update margin of main content
// 		if (sidebar.classList.contains("collapsed")) {
// 			mainContent.style.marginLeft = "70px";
// 			localStorage.setItem("sidebarState", "collapsed");
// 		} else {
// 			mainContent.style.marginLeft = "250px";
// 			localStorage.setItem("sidebarState", "expanded");
// 		}
// 	});

// 	// Handle mobile view
// 	const mediaQuery = window.matchMedia("(max-width: 768px)");
// 	function handleMobileView(e) {
// 		if (e.matches) {
// 			mainContent.style.marginLeft = "0";
// 			sidebar.classList.remove("collapsed");
// 		} else {
// 			if (localStorage.getItem("sidebarState") === "collapsed") {
// 				sidebar.classList.add("collapsed");
// 				mainContent.style.marginLeft = "70px";
// 			} else {
// 				mainContent.style.marginLeft = "250px";
// 			}
// 		}
// 	}
// 	mediaQuery.addListener(handleMobileView);
// 	handleMobileView(mediaQuery);
// });
