
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const { config } = require("../config");
const { nextScheduledAt } = require("./schedule");
const logger = require("../utils/logger");
const { openSystem, waitForPageToSettle } = require("../browser/client");
const { capture } = require("../browser/capture");
const { sendScreenshot } = require("../whatsapp/sender");
const { withRetry } = require("../utils/retry");
const { readState, writeState } = require("../storage/state");

let running = false;
let stopping = false;
let scheduledTimer = null;
let wakeScheduledWait = null;

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
            networkIdleTimeoutMs: config.networkIdleTimeoutMs,
            settleWaitMs: config.pageSettleWaitMs
          });

          // Aguarda os dados carregados pela aplicação antes de capturar.
          await waitForPageToSettle(opened.page, runId);

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
  while (!stopping) {
    const scheduledAt = nextScheduledAt(
      new Date(),
      config.scheduleTimes,
      config.timezone
    );
    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());

    logger.info("Próximo checkpoint programado", {
      scheduledAt: scheduledAt.toISOString(),
      timezone: config.timezone
    });

    await new Promise(resolve => {
      wakeScheduledWait = resolve;
      scheduledTimer = setTimeout(() => {
        scheduledTimer = null;
        wakeScheduledWait = null;
        resolve();
      }, delayMs);
    });

    if (!stopping) {
      await execute();
    }
  }
}

function stopScheduler() {
  stopping = true;

  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  if (wakeScheduledWait) {
    const wake = wakeScheduledWait;
    wakeScheduledWait = null;
    wake();
  }
}

module.exports = {
  startScheduler,
  stopScheduler
};
