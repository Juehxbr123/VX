export class MemoryStore {
  constructor(initial = new Set()) {
    this.usernames = initial;
  }

  list() {
    return Array.from(this.usernames).sort();
  }

  has(username) {
    return this.usernames.has(username);
  }

  add(username) {
    this.usernames.add(username);
  }

  delete(username) {
    this.usernames.delete(username);
  }
}
