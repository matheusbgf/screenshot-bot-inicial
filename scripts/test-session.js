require("dotenv").config();
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const systemUrl = process.env.SYSTEM_URL || "https://elsysone.com/pt-BR";
const authFile = path.resolve(process.env.AUTH_STATE_FILE || "./data/auth-state.json");

(async () => {
  await fs.access(authFile);
  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({
      storageState: authFile,
      viewport: { width: 1440, height: 1000 }
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.goto(systemUrl, { waitUntil: "domcontentloaded" });
    console.log("URL após navegação:", page.url());
    console.log("Título:", await page.title());
    console.log("Confira visualmente se o sistema abriu autenticado.");
    console.log("Não imprima nem compartilhe cookies ou conteúdo sensível.");
    await page.waitForTimeout(1500);
    await browser.close();
  } catch (error) {
    await browser.close().catch(() => {});
    throw error;
  }
})().catch(error => {
  console.error("Teste de sessão falhou:", error.message);
  process.exit(1);
});
