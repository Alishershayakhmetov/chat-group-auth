import 'dotenv/config';
import express, { Request, Response } from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : undefined;

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DB_NAME,
  password: process.env.PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  // ssl:Boolean(process.env.DB_SSL)
});

app.use(express.json());

app.get('/test-db', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

app.post('/add-user', async (req: Request, res: Response): Promise<void> => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error inserting user');
  }
});

app.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching users');
  }
});

app.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting user');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
