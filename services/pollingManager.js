export class PollingManager {
  constructor({ accountStore, scraperService, telegramService, dedup, intervalMs, batchSize, logger }) {
    this.accountStore = accountStore;
    this.scraperService = scraperService;
    this.telegramService = telegramService;
    this.dedup = dedup;
    this.intervalMs = intervalMs;
    this.batchSize = batchSize;
    this.logger = logger;
    this.timer = null;
  }

  start() {
    const tick = async () => {
      await this.runCycle();
      this.timer = setTimeout(tick, this.intervalMs);
    };
    tick().catch((err) => this.logger.error(`Polling loop fatal: ${err.message}`));
  }

  async runCycle() {
    const accounts = this.accountStore.list();
    if (accounts.length === 0) {
      this.logger.info('Polling cycle: no tracked accounts');
      return;
    }

    this.logger.info(`Polling cycle started. accounts=${accounts.length}`);

    for (let i = 0; i < accounts.length; i += this.batchSize) {
      const batch = accounts.slice(i, i + this.batchSize);
      await Promise.all(batch.map((username) => this.processAccount(username)));
      await new Promise((r) => setTimeout(r, 350));
    }

    await this.dedup.persist();
    this.logger.info('Polling cycle completed');
  }

  async processAccount(username) {
    const tweets = await this.scraperService.fetchUserTweets(username);
    const ordered = [...tweets].reverse();

    for (const tweet of ordered) {
      if (!tweet.id || this.dedup.has(tweet.id)) continue;
      this.dedup.remember(tweet.id);
      this.logger.info(`New tweet ${tweet.id} from @${username}`);
      await this.telegramService.sendTweet(tweet);
    }
  }
}
