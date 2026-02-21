import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function boot() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`DDAS API listening on http://localhost:${env.port}`);
  });
}

boot().catch((err) => {
  console.error('Failed to start DDAS backend:', err.message);
  process.exit(1);
});
