const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { config } = require("../config");
const logger = require("../utils/logger");

function createWhatsAppClient() {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: config.whatsappAuthDir }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    },
    takeoverOnConflict: false
  });

  client.on("qr", qr => {
    logger.info("Escaneie o QR Code para autenticar o WhatsApp nesta máquina.");
    qrcode.generate(qr, { small: true });
  });
  client.on("authenticated", () => logger.info("WhatsApp autenticado"));
  client.on("auth_failure", message => logger.error("Falha na autenticação do WhatsApp", { message }));
  client.on("ready", () => logger.info("WhatsApp pronto"));
  client.on("disconnected", reason => logger.warn("WhatsApp desconectado", { reason }));

  return client;
}
module.exports = { createWhatsAppClient };
