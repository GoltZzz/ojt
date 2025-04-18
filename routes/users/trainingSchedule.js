import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isAuthor from "../../middleware/isAuthor.js";
import * as trainingSchedule from "../../controllers/users/trainingSchedule.js";
import {
    handleValidationErrors,
} from "../../utils/sanitize.js";

const router = express.Router();

router
    .route("/")
    .get(isLoggedIn, trainingSchedule.index)
    .post(
        isLoggedIn,
        handleValidationErrors,
        trainingSchedule.createSchedule
    );

router.get("/new", isLoggedIn, trainingSchedule.renderNewForm);

router
    .route("/:id")
    .get(isLoggedIn, trainingSchedule.showSchedule)
    .delete(isLoggedIn, isAuthor, trainingSchedule.deleteSchedule);

router
    .route("/:id/edit")
    .get(isLoggedIn, isAuthor, trainingSchedule.renderEditForm);
router
    .route("/:id/update")
    .post(
        isLoggedIn,
        isAuthor,
        handleValidationErrors,
        trainingSchedule.updateSchedule
    );
export default router;
