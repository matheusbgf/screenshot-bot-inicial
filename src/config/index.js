
require("dotenv").config();

const path = require("node:path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../../.env")
});

function bool(name, fallback = false) {
  const value = process.env[name];

  if (value == null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "sim"].includes(
    value.toLowerCase()
  );
}

function number(name, fallback, min = 1) {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isFinite(value) || value < min) {
    throw new Error(`Configuração inválida: ${name}`);
  }

  return value;
}

function optional(name) {
  const value = process.env[name]?.trim();
  return value || "";
}

const config = {
  timezone: optional("TIMEZONE") || "America/Sao_Paulo",

  intervalMinutes: number("INTERVAL_MINUTES", 60),

  runOnStart: bool("RUN_ON_START", true),

  systemUrl: optional("SYSTEM_URL"),

  authStateFile: path.resolve(
    optional("AUTH_STATE_FILE") || "./data/auth-state.json"
  ),

  systemWaitUntil:
    optional("SYSTEM_WAIT_UNTIL") || "domcontentloaded",

  pageReadySelector: optional("PAGE_READY_SELECTOR"),

  screenshotSelector: optional("SCREENSHOT_SELECTOR"),

  screenshotFullPage: bool("SCREENSHOT_FULL_PAGE", false),

  loginUrl: optional("LOGIN_URL"),

  username: optional("USERNAME"),

  password: optional("PASSWORD"),

  usernameSelector: optional("USERNAME_SELECTOR"),

  passwordSelector: optional("PASSWORD_SELECTOR"),

  loginSubmitSelector: optional("LOGIN_SUBMIT_SELECTOR"),

  postLoginReadySelector: optional("POST_LOGIN_READY_SELECTOR"),

  whatsappGroupId: optional("WHATSAPP_GROUP_ID"),

  whatsappApiToken: optional("API_TOKEN"),

  whatsappApiUrl:
    optional("WHATSAPP_API_URL") || "http://127.0.0.1:3241",

  whatsappMessage: (
    optional("WHATSAPP_MESSAGE") ||
    "Segue o relatório atualizado:"
  ).replace(/\\n/g, "\n"),

  whatsappAuthDir: path.resolve(
    optional("WHATSAPP_AUTH_DIR") || "./data/whatsapp-auth"
  ),

  headless: bool("HEADLESS", true),

  navigationTimeoutMs: number("NAVIGATION_TIMEOUT_MS", 45000),

  actionTimeoutMs: number("ACTION_TIMEOUT_MS", 15000),

  retryAttempts: number("RETRY_ATTEMPTS", 3),

  retryBaseDelayMs: number("RETRY_BASE_DELAY_MS", 3000),

  screenshotDir: path.resolve(
    optional("SCREENSHOT_DIR") || "./data/screenshots"
  ),

  stateFile: path.resolve(
    optional("STATE_FILE") || "./data/state.json"
  ),

  logLevel: (
    optional("LOG_LEVEL") || "info"
  ).toLowerCase()
};

function validate() {
  if (
    !config.systemUrl ||
    !/^https?:\/\//i.test(config.systemUrl)
  ) {
    throw new Error(
      "Preencha SYSTEM_URL no arquivo .env com a URL do sistema."
    );
  }

  if (!config.whatsappApiToken) {
    throw new Error(
      "API_TOKEN não encontrado no .env compartilhado."
    );
  }

  if (!config.whatsappGroupId) {
    throw new Error(
      "Preencha WHATSAPP_GROUP_ID no arquivo .env. " +
      "O ID do grupo costuma terminar em @g.us."
    );
  }

  const loginFields = [
    config.username,
    config.password,
    config.usernameSelector,
    config.passwordSelector,
    config.loginSubmitSelector
  ];

  if (loginFields.some(Boolean) && !loginFields.every(Boolean)) {
    throw new Error(
      "Para login automático, preencha USERNAME, PASSWORD, " +
      "USERNAME_SELECTOR, PASSWORD_SELECTOR e LOGIN_SUBMIT_SELECTOR."
    );
  }
}

module.exports = {
  config,
  validate
};
