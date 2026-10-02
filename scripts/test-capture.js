require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const authFile = path.resolve(
    process.env.AUTH_STATE_FILE || './data/auth-state.json'
  );

  const url =
    process.env.SYSTEM_URL || 'https://elsysone.com/pt-BR/home';

  if (!fs.existsSync(authFile)) {
    throw new Error(`Arquivo de sessão não encontrado: ${authFile}`);
  }

  const outputDir = path.resolve('./data/screenshots');
  fs.mkdirSync(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, 'home-test.png');

  const browser = await chromium.launch({
    headless: false
  });

  try {
    const context = await browser.newContext({
      storageState: authFile,
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(45000);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log('URL final:', page.url());
    console.log('Título:', await page.title());

    await page.screenshot({
      path: outputFile,
      fullPage: true,
      animations: 'disabled'
    });

    console.log('Screenshot salvo em:', outputFile);
    console.log('Verifique visualmente se a página está autenticada.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('Falha no teste de captura:', error.message);
  process.exitCode = 1;
});
