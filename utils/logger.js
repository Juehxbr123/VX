const now = () => new Date().toISOString();

const print = (level, msg, meta) => {
  if (meta) {
    console.log(`[${now()}] [${level}] ${msg}`, meta);
    return;
  }
  console.log(`[${now()}] [${level}] ${msg}`);
};

export const logger = {
  info: (msg, meta) => print('INFO', msg, meta),
  warn: (msg, meta) => print('WARN', msg, meta),
  error: (msg, meta) => print('ERROR', msg, meta),
  debug: (msg, meta) => print('DEBUG', msg, meta),
};
