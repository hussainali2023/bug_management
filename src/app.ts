import cookieParser from "cookie-parser";
import express, { type Application, type Request, type Response } from "express";
import globalErrorHandler from "./middleware/globalError";
import { authRoutes } from "./modules/auth/auth.routes";
import { issuesRoutes } from "./modules/issues/issues.routes";


const app: Application = express()

app.use(express.json())
app.use(cookieParser())

app.get("/", (req: Request, res:Response) =>{
    res.send("Hello World")
})

app.use("/api/auth", authRoutes)
app.use("/api/issues", issuesRoutes)

app.use(globalErrorHandler)


export default app;