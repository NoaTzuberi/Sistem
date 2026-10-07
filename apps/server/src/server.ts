import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { failInterruptedRecommendations } from './features/aiRecommendations/aiRecommendation.service';

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
  } catch {
    console.error('Failed to connect to MongoDB. Server startup aborted.');
    process.exit(1);
  }

  const interrupted = await failInterruptedRecommendations();
  if (interrupted > 0) console.warn(`[aiRecommendations] ${interrupted} interrupted draft(s) marked failed.`);

  app.listen(config.port, () => {
    console.log(`Sistem server running on port ${config.port}`);
  });
}

startServer();
