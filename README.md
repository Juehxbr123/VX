# X (Twitter) -> Telegram Forwarder (без официального API X)

Production-ready Node.js бот, который:
- скрапит публичные аккаунты X (tweets/retweets/replies) без официального API,
- отправляет посты в Telegram-канал почти в real-time,
- работает только через прокси (и для X, и для Telegram API),
- поддерживает admin-команды `/add`, `/delete`, `/list`.

## 1) Быстрый старт (Windows CMD / Linux / macOS)

```bash
npm install
npm run start
```

## 2) Настройка

1. Скопируйте `.env.example` в `.env`
2. Заполните:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHANNEL_ID` (например `-100...`)
   - `ADMIN_IDS` (через запятую)
3. Добавьте бота админом в канал (иначе не сможет писать)

## 3) Как работает прокси

Прокси обязателен и используется **централизованно** через `utils/proxyAgent.js`:
- создается единый `HttpsProxyAgent`;
- этот агент пробрасывается в:
  - Twitter scraping service,
  - Telegram Bot API запросы.

Таким образом весь исходящий трафик идет через один proxy endpoint.

## 4) Команды администратора

Доступ только пользователям из `ADMIN_IDS`:

- `/add username` — добавить аккаунт в мониторинг
- `/delete username` — удалить аккаунт
- `/list` — показать список

Список хранится в `storage/accounts.json` и переживает рестарт.

## 5) Поведение и отказоустойчивость

- Polling каждые `POLL_INTERVAL_SECONDS` (можно 10–20 сек; по умолчанию 15).
- Аккаунты обрабатываются батчами (`BATCH_SIZE`) + небольшая пауза между батчами.
- Ошибки scraping/telegram/proxy не валят процесс:
  - retry с backoff,
  - при недоступности аккаунта цикл продолжается для остальных.
- Дедупликация по tweet ID через LRU (5000) + сохранение в `storage/dedup.json`.
- Если видео/GIF не отправился, бот шлет текст + ссылку на tweet.

## 6) Деплой на VPS

### Вариант через PM2

```bash
npm install -g pm2
npm install
pm2 start src/index.js --name x-tg-forwarder
pm2 save
pm2 startup
```

Логи:
```bash
pm2 logs x-tg-forwarder
```

## 7) Замечания по scraping

- Используется библиотека `agent-twitter-client` (без официального X API).
- X может временно блокировать или отдавать нестабильные ответы — бот не останавливается, а продолжает циклы и ретраи.

