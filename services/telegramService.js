import TelegramBot from 'node-telegram-bot-api';

export class TelegramService {
  constructor({ token, channelId, proxyAgentFactory, logger }) {
    this.logger = logger;
    this.channelId = channelId;
    this.bot = new TelegramBot(token, {
      polling: true,
      request: {
        agent: proxyAgentFactory.getAgent(),
      },
    });
  }

  getBot() {
    return this.bot;
  }

  async sendTweet(tweet) {
    const text = this.formatMessage(tweet);
    const options = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: 'Open Tweet', url: tweet.tweetUrl }]],
      },
    };

    try {
      if (tweet.media.length === 0) {
        await this.retry(() => this.bot.sendMessage(this.channelId, text, options));
        return;
      }

      const photos = tweet.media.filter((m) => m.type === 'photo').map((m) => m.url);
      const videos = tweet.media.filter((m) => m.type !== 'photo').map((m) => m.url);

      if (photos.length > 1) {
        const media = photos.slice(0, 10).map((url, idx) => ({
          type: 'photo',
          media: url,
          ...(idx === 0 ? { caption: text, parse_mode: 'HTML' } : {}),
        }));
        await this.retry(() => this.bot.sendMediaGroup(this.channelId, media));
        await this.retry(() => this.bot.sendMessage(this.channelId, `🔗 ${tweet.tweetUrl}`, options));
        return;
      }

      if (photos.length === 1) {
        await this.retry(() => this.bot.sendPhoto(this.channelId, photos[0], { caption: text, parse_mode: 'HTML', reply_markup: options.reply_markup }));
        return;
      }

      if (videos.length > 0) {
        try {
          await this.retry(() => this.bot.sendVideo(this.channelId, videos[0], { caption: text, parse_mode: 'HTML', reply_markup: options.reply_markup }));
        } catch {
          await this.retry(() => this.bot.sendMessage(this.channelId, `${text}\n\nВидео недоступно через прокси.\n${tweet.tweetUrl}`, options));
        }
      }
    } catch (err) {
      this.logger.error(`Telegram send failed for tweet ${tweet.id}: ${err.message}`);
    }
  }

  formatMessage(tweet) {
    const safe = (v) => String(v || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const typeTag = tweet.isRetweet ? ' [Retweet]' : tweet.isReply ? ' [Reply]' : '';
    return `<b>${safe(tweet.fullName)}</b> (@${safe(tweet.username)})${typeTag}\n\n${safe(tweet.text)}\n\n${tweet.tweetUrl}`;
  }

  async retry(fn) {
    const delays = [1000, 2000, 4000];
    for (let i = 0; i <= delays.length; i += 1) {
      try {
        return await fn();
      } catch (err) {
        if (i === delays.length) throw err;
        await new Promise((r) => setTimeout(r, delays[i]));
      }
    }
  }
}
