import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { loadEnv } from './config/env';

// v4 §11.1：fail-fast 校验
const env = loadEnv();

const PORT = parseInt(env.PORT, 10);

// eslint-disable-next-line no-console
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT} (NODE_ENV=${env.NODE_ENV})`);
});
