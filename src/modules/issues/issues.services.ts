import { pool } from "../../db";
import type { IIssues } from "./issues.interface";

const create = async (payload: IIssues, reporterId: number) => {
  const { title, description, type } = payload;

  if (!title || !description || !type) {
    const err: any = new Error("Title, description, and type must be provided");
    err.statusCode = 400;
    throw err;
  }


  if (type !== "bug" && type !== "feature_request") {
    const err: any = new Error("Type must be either bug or feature_request");
    err.statusCode = 400;
    throw err;
  }

  // Verify reporter exists (validate reporter_id in application logic as required)
  const reporterCheck = await pool.query(
    "SELECT id FROM users WHERE id = $1",
    [reporterId]
  );
  if (reporterCheck.rows.length === 0) {
    const err: any = new Error("Reporter user does not exist");
    err.statusCode = 400;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporterId]
  );

  return result.rows[0];
};


export const issuesService = {
    create,
}