import { LRUCache } from 'lru-cache';

export class DeduplicationService {
  constructor(fileStore, max = 5000) {
    this.fileStore = fileStore;
    this.cache = new LRUCache({ max });
  }

  async init() {
    const saved = await this.fileStore.read();
    if (Array.isArray(saved)) {
      for (const key of saved) this.cache.set(key, true);
    }
  }

  has(id) {
    return this.cache.has(id);
  }

  remember(id) {
    this.cache.set(id, true);
  }

  async persist() {
    await this.fileStore.write(Array.from(this.cache.keys()));
  }
}
