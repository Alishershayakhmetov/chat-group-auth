import dotenv from "dotenv";

// const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
// dotenv.config({ path: envFile });

dotenv.config();

export default {
	WEBAPP_URL: process.env.WEBAPP_URL,
	BASE_URL: process.env.BASE_URL,
	EMAIL_HOST: process.env.EMAIL_HOST,
	EMAIL_PORT: process.env.EMAIL_PORT,
	EMAIL_USER: process.env.EMAIL_USER,
	EMAIL_PASS: process.env.EMAIL_PASS,

	REDIS_URL: process.env.REDIS_URL,
	ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
	REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	GOOGLE_CALLBACKURL: process.env.GOOGLE_CALLBACKURL,

	COOKIE_DOMAIN: process.env.COOKIE_DOMAIN
}