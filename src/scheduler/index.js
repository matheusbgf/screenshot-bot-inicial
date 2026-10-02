
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const { config } = require("../config");
const logger = require("../utils/logger");
const { openSystem } = require("../browser/client");
const { capture } = require("../browser/capture");
const { sendScreenshot } = require("../whatsapp/sender");
const { withRetry, sleep } = require("../utils/retry");
const { readState, writeState } = require("../storage/state");

let running = false;
let stopping = false;

async function execute() {
  if (running) {
    logger.warn(
      "Execução ignorada: a execução anterior ainda está ativa"
    );
    return;
  }

  running = true;

  const runId =
    `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

  const startedAt = Date.now();
  let imagePath;

  logger.info("Execução iniciada", { runId });

  try {
    const session = await withRetry(
      "acesso e captura",
      async () => {
        const opened = await openSystem();

        try {
          logger.info("Aguardando carregamento da página", {
            runId,
            url: opened.page.url(),
            waitMs: 30000
          });

          // Aguarda 30 segundos para a página renderizar.
          await opened.page.waitForTimeout(30000);

          logger.info("Página pronta para captura", {
            runId,
            url: opened.page.url(),
            title: await opened.page.title()
          });

          imagePath = await capture(opened.page, runId);

          logger.info("Captura realizada", {
            runId,
            imagePath
          });

          return opened;
        } catch (error) {
          await opened.browser.close().catch(() => {});
          throw error;
        }
      },
      {
        attempts: config.retryAttempts,
        baseDelayMs: config.retryBaseDelayMs
      }
    );

    try {
      await sendScreenshot(null, imagePath, runId);

      const state = await readState(config.stateFile);

      state.lastSuccessAt = new Date().toISOString();
      state.lastSuccessRunId = runId;

      await writeState(config.stateFile, state);
    } finally {
      await session.browser.close().catch(() => {});
    }
  } catch (error) {
    logger.error("Execução falhou", {
      runId,
      error: error.message
    });
  } finally {
    if (imagePath) {
      await fs.unlink(imagePath).catch(() => {});
    }

    logger.info("Execução encerrada", {
      runId,
      durationMs: Date.now() - startedAt
    });

    running = false;
  }
}

async function startScheduler() {
  if (config.runOnStart) {
    await execute();
  }

  const intervalMs = config.intervalMinutes * 60 * 1000;

  while (!stopping) {
    await sleep(intervalMs);

    if (!stopping) {
      await execute();
    }
  }
}

function stopScheduler() {
  stopping = true;
}

module.exports = {
  startScheduler,
  stopScheduler
};
