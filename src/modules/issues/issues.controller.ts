import type { Request, Response, NextFunction } from "express";
import { issuesService } from "./issues.services";

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
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

const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await issuesService.getAll(req.query);

    res.status(200).json({
      success: true,
      message: "Issues retrived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idStr || "", 10);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID format",
      });
      return;
    }

    const result = await issuesService.getSingle(id);

    res.status(200).json({
      success: true,
      message: "Issue retrived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idStr || "", 10);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID format",
      });
      return;
    }

    const result = await issuesService.update(id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idStr || "", 10);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID format",
      });
      return;
    }

    await issuesService.remove(id);

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
