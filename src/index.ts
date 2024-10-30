import 'dotenv/config';
import express, { Request, Response } from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import './config/passport';
import authRouter from './controllers/authController.js';
import { jwtMiddleware } from './middlewares/authMiddleware.js';
import { User } from './interfaces/interface.js';
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.APP_PORT!;

app.use(
  cors({
    origin: process.env.BASE_WEBAPP_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(cookieParser())
app.use('/api', authRouter);

app.get('/dashboard', jwtMiddleware, (req: Request, res: Response) => {
  const user = req.user as User;
  res.send(`Welcome to your dashboard, user ID: ${user.id}`);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

