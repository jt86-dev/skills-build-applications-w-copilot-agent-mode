import { app } from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT || 8000);
const codespaceName = process.env.CODESPACE_NAME;
const baseUrl = codespaceName
  ? `https://${codespaceName}-${port}.app.github.dev`
  : `http://localhost:${port}`;

try {
  await connectDatabase();
  app.listen(port, '0.0.0.0', () => {
    console.log(`OctoFit API available at ${baseUrl}`);
  });
} catch (error) {
  console.error('Unable to start OctoFit API:', error);
  process.exitCode = 1;
}