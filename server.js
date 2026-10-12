import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.join(ROOT_DIR, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

if (process.env.NODE_ENV === 'production') {
  await import('./server/start-production.js');
} else {
  await import('./server/index.js');
}
