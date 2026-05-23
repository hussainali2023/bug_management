import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import type { ROLES } from "../types";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token = req.headers.authorization;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Missing token",
        });
        return;
      }

    
      if (token.startsWith("Bearer ")) {
        token = token.slice(7);
      }

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, config.jwt_secret as string) as JwtPayload;
      } catch (err: any) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid or expired token",
          errors: err.message,
        });
        return;
      }

      const userData = await pool.query(
        "SELECT * FROM users WHERE id=$1",
        [decoded.id]
      );

      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      const user = userData.rows[0];

      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions",
        });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
