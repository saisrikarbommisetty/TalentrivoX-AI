import { createServer } from './server';
import { env } from './config/env';

const app = createServer();

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AvengerCoders AI Recruitment API Running`);
  console.log(`📡 URL: http://localhost:${env.PORT}`);
  console.log(`🩺 Health: http://localhost:${env.PORT}/api/v1/health`);
  console.log(`🤖 AI Provider: ${env.AI_PROVIDER} (${env.GEMINI_MODEL})`);
  console.log(`=======================================================`);
});

export default server;
