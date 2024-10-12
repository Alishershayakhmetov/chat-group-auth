import 'dotenv/config';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Error handling
redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect().then(() => {
  console.log('Connected to Redis');
}).catch((err) => console.error('Redis Connection Error', err));

export default redisClient;
