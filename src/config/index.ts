import dotenv from "dotenv"; 


dotenv.config()


const config = {
    db_url: process.env.DB_URL,
    port: process.env.PORT,
    jwt_secret: process.env.JWT_SECRET
}

export default config;