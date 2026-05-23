import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";
import { pool } from "../../db";
import type { IAuth } from "./auth.interface";

const signup = async (payload: IAuth) => {
  const { name, email, password, role } = payload;

// -------check any thing missing or not --------------------

  if (!name || !email || !password) {
    const err:any = new Error("Name, email, and password must be provided");
    err.statusCode = 400;
    throw err;
  }

  // ----------check role ------------------------

  const finalRole = role || "contributor";
  if (finalRole !== "contributor" && finalRole !== "maintainer") {
    const err:any = new Error("Role must be either contributor or maintainer");
    err.statusCode = 400;
    throw err;
  }

// ------------------Check email -------------------

  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  if (existingUser.rows.length > 0) {
    const err: any = new Error("Email is already in use");
    err.statusCode = 400;
    throw err;
  }

  // -----------------now hash the password---------------------

  const hashedPassword = await bcrypt.hash(password, 10);

  
  // ----------now push to db -----------------------

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, finalRole]
  );

  return result.rows[0];
};

const login = async (payload: {email:string, password:string}) => {
  const { email, password } = payload;

  if (!email || !password) {
    const err: any = new Error("Email and password must be provided");
    err.statusCode = 400;
    throw err;
  }

  // ------------ find the user exists or not ------------------------
  const userData = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  if (userData.rows.length === 0) {
    const err: any = new Error("Invalid email or password");
    err.statusCode = 400;
    throw err;
  }

  const user = userData.rows[0];

// if get the user then check the password ----------------------

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err: any = new Error("Invalid email or password");
    err.statusCode = 400;
    throw err;
  }


// then generate the token 

  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
  };

  const token = jwt.sign(jwtPayload, config.jwt_secret as string, {
    expiresIn: "1d",
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

export const authService = {
  signup,
  login,
};
