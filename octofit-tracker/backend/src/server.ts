import { app } from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT || 8000);

try {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`OctoFit API listening on port ${port}`);
  });
} catch (error) {
  console.error('Unable to start OctoFit API:', error);
  process.exitCode = 1;
}