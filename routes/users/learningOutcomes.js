import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isAuthor from "../../middleware/isAuthor.js";
import * as learningOutcomes from "../../controllers/users/learningOutcomes.js";
import {
    handleValidationErrors,
} from "../../utils/sanitize.js";

const router = express.Router();

router
    .route("/")
    .get(isLoggedIn, learningOutcomes.index)
    .post(
        isLoggedIn,
        handleValidationErrors,
        learningOutcomes.createOutcome
    );

router.get("/new", isLoggedIn, learningOutcomes.renderNewForm);

router
    .route("/:id")
    .get(isLoggedIn, learningOutcomes.showOutcome)
    .delete(isLoggedIn, isAuthor, learningOutcomes.deleteOutcome);

router
    .route("/:id/edit")
    .get(isLoggedIn, isAuthor, learningOutcomes.renderEditForm);
router
    .route("/:id/update")
    .post(
        isLoggedIn,
        isAuthor,
        handleValidationErrors,
        learningOutcomes.updateOutcome
    );
export default router;
