
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

function timeList(name, fallback) {
  const value = optional(name) || fallback;
  const values = value.split(",").map(item => item.trim());

  if (
    values.some(item => !/^(?:[01]\d|2[0-3]):00$/.test(item)) ||
    new Set(values).size !== values.length
  ) {
    throw new Error(`Configuração inválida: ${name}. Use horários HH:00 sem duplicatas.`);
  }

  return values.sort();
}

const defaultScheduleTimes = "01:00,04:00,07:00,10:00,13:00,16:00,19:00,22:00";

const config = {
  timezone: optional("TIMEZONE") || "America/Sao_Paulo",

  scheduleTimes: timeList("SCHEDULE_TIMES", defaultScheduleTimes),

  systemUrl: optional("SYSTEM_URL"),

  authStateFile: path.resolve(
    optional("AUTH_STATE_FILE") || "./data/auth-state.json"
  ),

  systemWaitUntil:
    optional("SYSTEM_WAIT_UNTIL") || "domcontentloaded",

  pageReadySelector: optional("PAGE_READY_SELECTOR"),

  networkIdleTimeoutMs: number("NETWORK_IDLE_TIMEOUT_MS", 45000),

  pageSettleWaitMs: number("PAGE_SETTLE_WAIT_MS", 60000),

  screenshotWidth: number("SCREENSHOT_WIDTH", 1920),

  screenshotHeight: number("SCREENSHOT_HEIGHT", 1080),

  screenshotCropX: number("SCREENSHOT_CROP_X", 360, 0),

  screenshotCropY: number("SCREENSHOT_CROP_Y", 116, 0),

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
    "Checkpoint - ELSYS ONE [NETYLINK]\\n\\n⏱️ Período atual do monitoramento.\\n\\nEquipe BOC\\nCore | Technologies"
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
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: config.timezone }).format();
  } catch {
    throw new Error("TIMEZONE inválido; use um identificador IANA, como America/Sao_Paulo.");
  }

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

  if (config.username && !config.postLoginReadySelector) {
    throw new Error(
      "Para login headless, preencha POST_LOGIN_READY_SELECTOR com um elemento que só apareça após a autenticação."
    );
  }
}

module.exports = {
  config,
  validate
};
