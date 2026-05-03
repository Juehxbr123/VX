import axios from 'axios';
import { Scraper } from 'agent-twitter-client';

export class TwitterScraperService {
  constructor({ proxyAgentFactory, timeoutMs, logger, maxTweetsPerAccount }) {
    this.logger = logger;
    this.maxTweetsPerAccount = maxTweetsPerAccount;
    this.scraper = new Scraper();
    this.http = axios.create({
      httpAgent: proxyAgentFactory.getAgent(),
      httpsAgent: proxyAgentFactory.getAgent(),
      timeout: timeoutMs,
    });
  }

  async fetchUserTweets(username) {
    const retries = [1000, 2000, 4000];

    for (let i = 0; i <= retries.length; i += 1) {
      try {
        return await this.tryFetch(username);
      } catch (err) {
        const isLast = i === retries.length;
        this.logger.warn(`Fetch failed for @${username}, attempt ${i + 1}: ${err.message}`);
        if (isLast) return [];
        await new Promise((r) => setTimeout(r, retries[i]));
      }
    }
    return [];
  }

  async tryFetch(username) {
    // agent-twitter-client internals may change; keep adapter isolated.
    const query = `from:${username}`;
    const iterator = await this.scraper.searchTweets(query, this.maxTweetsPerAccount, 'Latest');
    const tweets = [];

    for await (const tweet of iterator) {
      tweets.push(this.normalizeTweet(tweet));
      if (tweets.length >= this.maxTweetsPerAccount) break;
    }

    return tweets;
  }

  normalizeTweet(tweet) {
    const id = String(tweet.id || tweet.rest_id || tweet.tweetId);
    const username = tweet.username || tweet.userName || tweet?.user?.screen_name || 'unknown';
    const fullName = tweet.name || tweet?.user?.name || username;
    const text = tweet.text || tweet.fullText || '';
    const mediaRaw = tweet.photos || tweet.videos || tweet.media || [];

    const media = Array.isArray(mediaRaw)
      ? mediaRaw.map((m) => ({
          type: m.type || (m.url?.includes('.mp4') ? 'video' : 'photo'),
          url: m.url || m.media_url_https || m.preview_url,
        })).filter((m) => m.url)
      : [];

    return {
      id,
      text,
      username,
      fullName,
      tweetUrl: `https://x.com/${username}/status/${id}`,
      media,
      isRetweet: Boolean(tweet.isRetweet),
      isReply: Boolean(tweet.isReply),
    };
  }
}
