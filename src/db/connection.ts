import mongoose from 'mongoose';
import { env } from '../config/env';
import { createLogger } from '../logger';

const logger = createLogger('db');

export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGO_URI);

  logger.info(
    { mongoHost: mongoose.connection.host, mongoName: mongoose.connection.name },
    'Database connected',
  );
}
