import type { Request, Response, NextFunction } from "express";
import { issuesService } from "./issues.services";

const createIssue = async (req: Request, res: Response, next: NextFunction)=> {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Requester user missing in token",
      });
      return;
    }

    const result = await issuesService.create(req.body, reporterId);

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const issuesController = {
    createIssue,
}