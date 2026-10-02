const fs = require("node:fs/promises");
const path = require("node:path");
const logger = require("../utils/logger");
const { config } = require("../config");

async function sendScreenshot(_client, imagePath, runId) {
  const absoluteImagePath = path.resolve(imagePath);

  await fs.access(absoluteImagePath);

  const response = await fetch(config.whatsappApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": config.whatsappApiToken
    },
    body: JSON.stringify({
      tipo: 1,
      groupId: config.whatsappGroupId,
      message: config.whatsappMessage,
      imagePath: absoluteImagePath
    }),
    signal: AbortSignal.timeout(60000)
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `API do WhatsApp retornou uma resposta inválida (HTTP ${response.status}).`
    );
  }

  if (!response.ok || data.success !== true) {
    const status = response.status;
    const reason = typeof data.error === "string"
      ? data.error
      : "Resposta sem confirmação de sucesso";

    throw new Error(
      `Falha na API do WhatsApp (HTTP ${status}): ${reason}`
    );
  }

  logger.info("API do WhatsApp confirmou o envio", {
    runId,
    status: response.status
  });
}

module.exports = { sendScreenshot };
