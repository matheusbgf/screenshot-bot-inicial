require('dotenv').config();

const { config } = require('../src/config');
const { openSystem, waitForPageToSettle } = require('../src/browser/client');
const { capture } = require('../src/browser/capture');

async function main() {
  const { browser, page } = await openSystem();

  try {
    await waitForPageToSettle(page, 'manual');
    const outputFile = await capture(page, `manual-${Date.now()}`);
    console.log('Screenshot salvo em:', outputFile);
    console.log(`Dimensões configuradas: ${config.screenshotWidth}x${config.screenshotHeight}`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('Falha no teste de captura:', error.message);
  process.exitCode = 1;
});
