import fs from 'fs/promises';
import path from 'path';

export class FileStore {
  constructor(filePath, initialValue) {
    this.filePath = filePath;
    this.initialValue = initialValue;
  }

  async ensure() {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      // Important: no recursion through this.write() from ensure().
      await fs.writeFile(this.filePath, JSON.stringify(this.initialValue, null, 2), 'utf-8');
    }
  }

  async read() {
    await this.ensure();
    const raw = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(raw);
  }

  async write(value) {
    await this.ensure();
    await fs.writeFile(this.filePath, JSON.stringify(value, null, 2), 'utf-8');
  }
}
