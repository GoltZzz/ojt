import express from "express";
import { isLoggedIn, hasAccess } from "../../middleware.js";
import docsController from "../../controllers/users/documentation.js";

const router = express.Router();

router
	.route("/")
	.get(isLoggedIn, hasAccess(), docsController.renderDocumentation);

export default router;
