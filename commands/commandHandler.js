export class CommandHandler {
  constructor({ bot, adminIds, accountStore, onChange, logger }) {
    this.bot = bot;
    this.adminIds = new Set(adminIds);
    this.accountStore = accountStore;
    this.onChange = onChange;
    this.logger = logger;
  }

  init() {
    this.bot.onText(/^\/add\s+@?(\w{1,30})$/i, async (msg, match) => {
      await this.handleAdmin(msg, async () => {
        const username = match[1].toLowerCase();
        if (this.accountStore.has(username)) return this.bot.sendMessage(msg.chat.id, `@${username} уже отслеживается`);
        this.accountStore.add(username);
        await this.onChange();
        await this.bot.sendMessage(msg.chat.id, `Добавлен: @${username}`);
      });
    });

    this.bot.onText(/^\/delete\s+@?(\w{1,30})$/i, async (msg, match) => {
      await this.handleAdmin(msg, async () => {
        const username = match[1].toLowerCase();
        if (!this.accountStore.has(username)) return this.bot.sendMessage(msg.chat.id, `@${username} не найден`);
        this.accountStore.delete(username);
        await this.onChange();
        await this.bot.sendMessage(msg.chat.id, `Удален: @${username}`);
      });
    });

    this.bot.onText(/^\/list$/i, async (msg) => {
      await this.handleAdmin(msg, async () => {
        const list = this.accountStore.list();
        await this.bot.sendMessage(msg.chat.id, list.length ? list.map((u) => `@${u}`).join('\n') : 'Список пуст');
      });
    });
  }

  async handleAdmin(msg, handler) {
    const userId = msg.from?.id;
    if (!this.adminIds.has(userId)) {
      await this.bot.sendMessage(msg.chat.id, 'Нет доступа');
      return;
    }

    try {
      await handler();
    } catch (err) {
      this.logger.error(`Command failed: ${err.message}`);
      await this.bot.sendMessage(msg.chat.id, 'Ошибка выполнения команды');
    }
  }
}
