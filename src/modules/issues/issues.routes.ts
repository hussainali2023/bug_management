import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";


const router = Router()

router.post("/", auth(USER_ROLE.contributer, USER_ROLE.maintainer), issuesController.createIssue)



export const issuesRoutes: Router =  router;