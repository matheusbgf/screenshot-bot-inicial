const fs = require("node:fs/promises");
const { config, validate } = require("./config");
const logger = require("./utils/logger");
const { startScheduler, stopScheduler } = require("./scheduler");

async function main() {
  validate();

  await fs.mkdir(config.screenshotDir, {
    recursive: true,
    mode: 0o700
  });

  let shuttingDown = false;

  const shutdown = signal => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("Encerramento solicitado", { signal });
    stopScheduler();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  await startScheduler();
}

main().catch(error => {
  logger.error("Falha fatal na inicialização", {
    error: error.message
  });
  process.exitCode = 1;
});
