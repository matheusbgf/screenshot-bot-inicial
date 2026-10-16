const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { config } = require("../config");
const logger = require("../utils/logger");

async function selectorIsVisible(page, selector, timeout) {
  if (!selector) return false;

  try {
    await page.locator(selector).first().waitFor({
      state: "visible",
      timeout
    });
    return true;
  } catch (error) {
    if (error.name === "TimeoutError") return false;
    throw error;
  }
}

async function saveAuthState(context) {
  await fs.mkdir(path.dirname(config.authStateFile), {
    recursive: true,
    mode: 0o700
  });
  await context.storageState({ path: config.authStateFile });
  await fs.chmod(config.authStateFile, 0o600);
}

async function authenticateWithConfiguredForm(page, context) {
  if (!config.username) return false;

  if (!config.postLoginReadySelector) {
    throw new Error(
      "Configure POST_LOGIN_READY_SELECTOR para confirmar o login headless sem salvar uma sessão incompleta."
    );
  }

  const alreadyReady = await selectorIsVisible(
    page,
    config.postLoginReadySelector,
    config.actionTimeoutMs
  );

  if (alreadyReady) return false;

  let loginFormVisible = await selectorIsVisible(
    page,
    config.usernameSelector,
    1500
  );

  if (!loginFormVisible && config.loginUrl) {
    await page.goto(config.loginUrl, {
      waitUntil: config.systemWaitUntil,
      timeout: config.navigationTimeoutMs
    });
    loginFormVisible = await selectorIsVisible(
      page,
      config.usernameSelector,
      config.actionTimeoutMs
    );
  }

  if (!loginFormVisible) {
    throw new Error(
      "Não encontrei o formulário de login configurado nem confirmei a sessão. Verifique o acesso e os seletores; SSO, MFA, CAPTCHA e bloqueios corporativos não são contornados."
    );
  }

  await page.locator(config.usernameSelector).first().fill(config.username);
  await page.locator(config.passwordSelector).first().fill(config.password);
  await page.locator(config.loginSubmitSelector).first().click();
  await page.locator(config.postLoginReadySelector).first().waitFor({
    state: "visible",
    timeout: config.navigationTimeoutMs
  });

  await page.goto(config.systemUrl, {
    waitUntil: config.systemWaitUntil,
    timeout: config.navigationTimeoutMs
  });

  await page.locator(config.postLoginReadySelector).first().waitFor({
    state: "visible",
    timeout: config.navigationTimeoutMs
  });

  if (config.pageReadySelector) {
    await page.locator(config.pageReadySelector).waitFor({ state: "visible" });
  }

  await saveAuthState(context);
  logger.info("Sessão do sistema salva após login headless", {
    origin: new URL(config.systemUrl).origin
  });

  return true;
}

async function openSystem() {
  if (!config.headless) {
    throw new Error(
      "HEADLESS=true é obrigatório para este fluxo. Nenhuma janela foi aberta."
    );
  }

  const browser = await chromium.launch({ headless: config.headless });
  let context;
  try {
    let storageState;
    try {
      await fs.access(config.authStateFile);
      storageState = config.authStateFile;
    } catch {
      logger.info("Arquivo de sessão ausente; tentando o login headless configurado, se disponível.");
    }

    context = await browser.newContext({
      viewport: {
        width: config.screenshotWidth + config.screenshotCropX,
        height: config.screenshotHeight + config.screenshotCropY
      },
      ...(storageState ? { storageState } : {})
    });
    const page = await context.newPage();
    page.setDefaultTimeout(config.actionTimeoutMs);
    page.setDefaultNavigationTimeout(config.navigationTimeoutMs);
    await page.goto(
      !storageState && config.loginUrl ? config.loginUrl : config.systemUrl,
      { waitUntil: config.systemWaitUntil }
    );

    const authenticatedByForm =
      await authenticateWithConfiguredForm(page, context);

    if (config.pageReadySelector) {
      await page.locator(config.pageReadySelector).waitFor({ state: "visible" });
    }
    logger.info("Sistema web carregado", { origin: new URL(config.systemUrl).origin });
    return { browser, context, page, authenticatedByForm };
  } catch (error) {
    if (context) await context.close().catch(() => {});
    await browser.close().catch(() => {});
    throw error;
  }
}

async function waitForPageToSettle(page, runId) {
  try {
    await page.waitForLoadState("networkidle", {
      timeout: config.networkIdleTimeoutMs
    });
  } catch (error) {
    if (error.name !== "TimeoutError") {
      throw error;
    }

    logger.warn("A página continuou com atividade de rede; seguindo após o limite", {
      runId,
      timeoutMs: config.networkIdleTimeoutMs
    });
  }

  await page.waitForTimeout(config.pageSettleWaitMs);
}

module.exports = { openSystem, waitForPageToSettle };
