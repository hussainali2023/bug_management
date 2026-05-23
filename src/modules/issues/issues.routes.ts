import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";
import { issuesController } from "./issues.controller";

const router = Router();

router.post(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.createIssue
);


router.get("/", issuesController.getAllIssues);


router.get("/:id", issuesController.getSingleIssue);

router.patch(
  "/:id",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.updateIssue
);


router.delete(
  "/:id",
  auth(USER_ROLE.maintainer),
  issuesController.deleteIssue
);

export const issuesRoutes :Router = router;
