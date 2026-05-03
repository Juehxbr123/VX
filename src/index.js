import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ProxyAgentFactory } from '../utils/proxyAgent.js';
import { FileStore } from '../storage/fileStore.js';
import { MemoryStore } from '../storage/memoryStore.js';
import { DeduplicationService } from '../utils/deduplication.js';
import { TwitterScraperService } from '../services/twitterScraperService.js';
import { TelegramService } from '../services/telegramService.js';
import { PollingManager } from '../services/pollingManager.js';
import { CommandHandler } from '../commands/commandHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const accountsPath = path.join(root, 'storage', 'accounts.json');
const dedupPath = path.join(root, 'storage', 'dedup.json');

async function bootstrap() {
  logger.info('Starting X -> Telegram forwarder');

  const proxyAgentFactory = new ProxyAgentFactory(env.proxy);
  logger.info('Proxy initialized for ALL outbound requests');

  const accountsStoreFile = new FileStore(accountsPath, []);
  const dedupFileStore = new FileStore(dedupPath, []);

  const accounts = await accountsStoreFile.read();
  const accountStore = new MemoryStore(new Set(accounts.map((u) => String(u).toLowerCase())));

  const dedup = new DeduplicationService(dedupFileStore, 5000);
  await dedup.init();

  const twitterScraperService = new TwitterScraperService({
    proxyAgentFactory,
    timeoutMs: env.httpTimeoutMs,
    logger,
    maxTweetsPerAccount: env.polling.maxTweetsPerAccount,
  });

  const telegramService = new TelegramService({
    token: env.telegram.token,
    channelId: env.telegram.channelId,
    proxyAgentFactory,
    logger,
  });

  const saveAccounts = async () => {
    await accountsStoreFile.write(accountStore.list());
  };

  const commandHandler = new CommandHandler({
    bot: telegramService.getBot(),
    adminIds: env.telegram.adminIds,
    accountStore,
    onChange: saveAccounts,
    logger,
  });
  commandHandler.init();

  const pollingManager = new PollingManager({
    accountStore,
    scraperService: twitterScraperService,
    telegramService,
    dedup,
    intervalMs: env.polling.intervalMs,
    batchSize: env.polling.batchSize,
    logger,
  });

  pollingManager.start();
  logger.info('Service started successfully');
}

bootstrap().catch((err) => {
  logger.error(`Startup failed: ${err.message}`);
  process.exit(1);
});
