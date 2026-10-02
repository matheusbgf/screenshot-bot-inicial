const logger = require("./logger");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry(label, operation, { attempts = 3, baseDelayMs = 3000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      logger.warn("Operação falhou", { operation: label, attempt, attempts, error: error.message });
      if (attempt < attempts) await sleep(baseDelayMs * (2 ** (attempt - 1)));
    }
  }
  throw lastError;
}
module.exports = { withRetry, sleep };
