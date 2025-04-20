import 'dotenv/config';
import express, { Request, Response } from 'express';
import './config/passport.js';
import {authRouter, authRouterProtected} from './controllers/authController.js';
import { jwtMiddleware } from './middlewares/authMiddleware.js';
import { User } from './interfaces/interface.js';
import cors from 'cors';
import cookieParser from "cookie-parser";
import config from "./config/index.js";

const app = express();
const port = config.APP_PORT;

app.use(
  cors({
    origin: config.WEBAPP_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser())
app.use('/api/protected', jwtMiddleware, authRouterProtected);
app.use("/api", authRouter);

app.get('/dashboard', jwtMiddleware, (req: Request, res: Response) => {
  const user = req.user as User;
  res.send(`Welcome to your dashboard, user ID: ${user.id}`);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});