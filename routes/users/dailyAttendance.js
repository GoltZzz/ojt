import express from "express";
import { isLoggedIn } from "../../middleware.js";
import isAuthor from "../../middleware/isAuthor.js";
import * as dailyAttendance from "../../controllers/users/dailyAttendance.js";
import {
    handleValidationErrors,
} from "../../utils/sanitize.js";

const router = express.Router();

router
    .route("/")
    .get(isLoggedIn, dailyAttendance.index)
    .post(
        isLoggedIn,
        handleValidationErrors,
        dailyAttendance.createAttendance
    );

router.get("/new", isLoggedIn, dailyAttendance.renderNewForm);

router
    .route("/:id")
    .get(isLoggedIn, dailyAttendance.showAttendance)
    .delete(isLoggedIn, isAuthor, dailyAttendance.deleteAttendance);

router
    .route("/:id/edit")
    .get(isLoggedIn, isAuthor, dailyAttendance.renderEditForm);
router
    .route("/:id/update")
    .post(
        isLoggedIn,
        isAuthor,
        handleValidationErrors,
        dailyAttendance.updateAttendance
    );
export default router;
