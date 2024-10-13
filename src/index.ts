import 'dotenv/config';
import express, { Request, Response } from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import './config/passport.ts';
import authRouter from './controllers/authController.js';
import { jwtMiddleware } from './middlewares/authMiddleware.js';
import { User } from './interfaces/interface.js';

const app = express();
const port = process.env.APP_PORT!;


const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  // ssl:Boolean(process.env.DB_SSL)
});

app.use(express.json());
app.use('/api', authRouter);

app.get('/test-db', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});


app.get('/test-user-req', jwtMiddleware, (req: Request, res: Response) => {
  const user = req.user as User;
  res.send(`Welcome to your dashboard, user ID: ${user.id}`);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
