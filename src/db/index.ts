import {Pool} from "pg"
import config from "../config"
import { createSchema } from "./schema"


export const pool = new Pool({
    connectionString: config.db_url
})

export const initDb = async() =>{
    await createSchema();
    console.log("DATABASE CONNECTED SUCCESSFULLY");
    
}