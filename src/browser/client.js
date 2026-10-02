const fs = require("node:fs/promises");
const { chromium } = require("playwright");
const { config } = require("../config");
const logger = require("../utils/logger");

async function openSystem() {
  const browser = await chromium.launch({ headless: config.headless });
  let context;
  try {
    let storageState;
    try {
      await fs.access(config.authStateFile);
      storageState = config.authStateFile;
    } catch {
      logger.warn("Arquivo de sessão não encontrado; o sistema pode exigir login manual.");
    }

    context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      ...(storageState ? { storageState } : {})
    });
    const page = await context.newPage();
    page.setDefaultTimeout(config.actionTimeoutMs);
    page.setDefaultNavigationTimeout(config.navigationTimeoutMs);
    await page.goto(config.systemUrl, { waitUntil: config.systemWaitUntil });

    if (config.pageReadySelector) {
      await page.locator(config.pageReadySelector).waitFor({ state: "visible" });
    }
    logger.info("Sistema web carregado", { origin: new URL(config.systemUrl).origin });
    return { browser, context, page };
  } catch (error) {
    if (context) await context.close().catch(() => {});
    await browser.close().catch(() => {});
    throw error;
  }
}
module.exports = { openSystem };
