import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
  } catch {
    console.error('Failed to connect to MongoDB. Server startup aborted.');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Sistem server running on port ${config.port}`);
  });
}

startServer();
