import { pool } from "../../db";

const create = async (payload: any, reporterId: number) => {
  const { title, description, type } = payload;

  if (!title || !description || !type) {
    const err: any = new Error("Title, description, and type must be provided");
    err.statusCode = 400;
    throw err;
  }

  if (title.length > 150) {
    const err: any = new Error("Title must not exceed 150 characters");
    err.statusCode = 400;
    throw err;
  }

  if (description.length < 20) {
    const err: any = new Error("Description must be at least 20 characters");
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

const getAll = async (filters: any) => {
  const { sort, type, status } = filters;

  let queryText = "SELECT * FROM issues";
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (type) {
    if (type !== "bug" && type !== "feature_request") {
      const err: any = new Error("Invalid type parameter");
      err.statusCode = 400;
      throw err;
    }
    queryParams.push(type);
    whereClauses.push(`type = $${queryParams.length}`);
  }

  if (status) {
    if (status !== "open" && status !== "in_progress" && status !== "resolved") {
      const err: any = new Error("Invalid status parameter");
      err.statusCode = 400;
      throw err;
    }
    queryParams.push(status);
    whereClauses.push(`status = $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    queryText += " WHERE " + whereClauses.join(" AND ");
  }

  // Sorting
  const finalSort = sort || "newest";
  if (finalSort !== "newest" && finalSort !== "oldest") {
    const err: any = new Error("Sort parameter must be either newest or oldest");
    err.statusCode = 400;
    throw err;
  }

  if (finalSort === "oldest") {
    queryText += " ORDER BY created_at ASC";
  } else {
    queryText += " ORDER BY created_at DESC";
  }

  const result = await pool.query(queryText, queryParams);
  const issues = result.rows;

  if (issues.length === 0) {
    return [];
  }

  // Fetch reporter details in a separate batch query (Absolutely no JOINs!)
  const reporterIds = Array.from(new Set(issues.map((i) => i.reporter_id)));
  const usersResult = await pool.query(
    "SELECT id, name, role FROM users WHERE id = ANY($1::int[])",
    [reporterIds]
  );

  const userMap = new Map();
  usersResult.rows.forEach((u) => userMap.set(u.id, u));

  return issues.map((issue) => {
    const reporter = userMap.get(issue.reporter_id) || null;
    const { reporter_id, ...issueData } = issue;
    return {
      ...issueData,
      reporter,
    };
  });
};

const getSingle = async (id: number) => {
  const issueResult = await pool.query(
    "SELECT * FROM issues WHERE id = $1",
    [id]
  );

  if (issueResult.rows.length === 0) {
    const err: any = new Error("Issue not found");
    err.statusCode = 404;
    throw err;
  }

  const issue = issueResult.rows[0];

  // Fetch reporter details in separate query (no SQL JOINs!)
  const userResult = await pool.query(
    "SELECT id, name, role FROM users WHERE id = $1",
    [issue.reporter_id]
  );

  const reporter = userResult.rows[0] || null;
  const { reporter_id, ...issueData } = issue;

  return {
    ...issueData,
    reporter,
  };
};

const update = async (id: number, payload: any, reqUser: any) => {
  // Retrieve current issue
  const issueResult = await pool.query(
    "SELECT * FROM issues WHERE id = $1",
    [id]
  );

  if (issueResult.rows.length === 0) {
    const err: any = new Error("Issue not found");
    err.statusCode = 404;
    throw err;
  }

  const issue = issueResult.rows[0];

  // Role and status verification
  const isMaintainer = reqUser.role === "maintainer";
  const isReporter = issue.reporter_id === reqUser.id;

  if (!isMaintainer && !isReporter) {
    const err: any = new Error("Forbidden: Insufficient permissions to update this issue");
    err.statusCode = 403;
    throw err;
  }

  if (!isMaintainer) {
    // Requester is a contributor updating their own issue
    if (issue.status !== "open") {
      const err: any = new Error("Conflict: Contributor can only update issue when status is open");
      err.statusCode = 409;
      throw err;
    }

    if (payload.status !== undefined && payload.status !== issue.status) {
      const err: any = new Error("Forbidden: Contributor cannot change issue status");
      err.statusCode = 403;
      throw err;
    }
  }

  // Field validations if provided
  const { title, description, type, status } = payload;

  if (title !== undefined) {
    if (title.length === 0) {
      const err: any = new Error("Title must not be empty");
      err.statusCode = 400;
      throw err;
    }
    if (title.length > 150) {
      const err: any = new Error("Title must not exceed 150 characters");
      err.statusCode = 400;
      throw err;
    }
  }

  if (description !== undefined) {
    if (description.length < 20) {
      const err: any = new Error("Description must be at least 20 characters");
      err.statusCode = 400;
      throw err;
    }
  }

  if (type !== undefined && type !== "bug" && type !== "feature_request") {
    const err: any = new Error("Type must be either bug or feature_request");
    err.statusCode = 400;
    throw err;
  }

  if (status !== undefined && status !== "open" && status !== "in_progress" && status !== "resolved") {
    const err: any = new Error("Status must be one of: open, in_progress, resolved");
    err.statusCode = 400;
    throw err;
  }

  // Execute update using COALESCE
  const updateResult = await pool.query(
    `UPDATE issues
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         type = COALESCE($3, type),
         status = COALESCE($4, status),
         updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [
      title !== undefined ? title : null,
      description !== undefined ? description : null,
      type !== undefined ? type : null,
      status !== undefined ? status : null,
      id,
    ]
  );

  return updateResult.rows[0];
};

const remove = async (id: number) => {
  const issueResult = await pool.query(
    "SELECT id FROM issues WHERE id = $1",
    [id]
  );

  if (issueResult.rows.length === 0) {
    const err: any = new Error("Issue not found");
    err.statusCode = 404;
    throw err;
  }

  await pool.query(
    "DELETE FROM issues WHERE id = $1",
    [id]
  );
};

export const issuesService = {
  create,
  getAll,
  getSingle,
  update,
  remove,
};
