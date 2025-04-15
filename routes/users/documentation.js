import express from "express";
import { isLoggedIn } from "../../middleware.js";
import docsController from "../../controllers/users/documentation.js";
import {
	validateDocumentation,
	handleValidationErrors,
} from "../../utils/sanitize.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, docsController.renderDocumentation)
	.post(
		isLoggedIn,
		validateDocumentation,
		handleValidationErrors,
		docsController.createDocumentation
	);

router.get("/new", isLoggedIn, docsController.renderNewForm);

export default router;
