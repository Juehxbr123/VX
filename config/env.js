import dotenv from 'dotenv';

dotenv.config();

const parseAdminIds = (value = '') => value
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean)
  .map((v) => Number(v))
  .filter((v) => Number.isInteger(v));

const must = (name) => {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
};

export const env = {
  telegram: {
    token: must('TELEGRAM_BOT_TOKEN'),
    channelId: must('TELEGRAM_CHANNEL_ID'),
    adminIds: parseAdminIds(process.env.ADMIN_IDS || ''),
  },
  polling: {
    intervalMs: Math.max(5, Number(process.env.POLL_INTERVAL_SECONDS || 15)) * 1000,
    batchSize: Math.max(1, Number(process.env.BATCH_SIZE || 5)),
    maxTweetsPerAccount: Math.max(1, Number(process.env.MAX_TWEETS_PER_ACCOUNT || 5)),
  },
  proxy: {
    host: must('PROXY_HOST'),
    port: Number(must('PROXY_PORT')),
    username: must('PROXY_USERNAME'),
    password: must('PROXY_PASSWORD'),
  },
  httpTimeoutMs: Number(process.env.HTTP_TIMEOUT_MS || 20000),
  debug: (process.env.DEBUG || 'false').toLowerCase() === 'true',
};
