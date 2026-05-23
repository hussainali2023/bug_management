import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";


// --------------------- sign up the user ---------------------- 
const signupUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.signup(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// -----------------login user -------------------- 

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  signupUser,
  loginUser,
};
