const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const configured = levels[process.env.LOG_LEVEL || "info"] ?? 2;

function write(level, message, fields = {}) {
  if (levels[level] > configured) return;
  // Não registrar credenciais, conteúdo da página ou mensagens privadas.
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...fields
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}
module.exports = {
  error: (message, fields) => write("error", message, fields),
  warn: (message, fields) => write("warn", message, fields),
  info: (message, fields) => write("info", message, fields),
  debug: (message, fields) => write("debug", message, fields)
};
