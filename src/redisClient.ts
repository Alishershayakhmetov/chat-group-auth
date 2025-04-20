import 'dotenv/config';
import { createClient } from 'redis';
import config from './config/index.js';

const redisClient = createClient({
  url: config.REDIS_URL,
});

// Error handling
redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect().then(() => {
  console.log('Connected to Redis');
}).catch((err) => console.error('Redis Connection Error', err));

export default redisClient;
