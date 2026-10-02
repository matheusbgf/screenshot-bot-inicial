const fs = require("node:fs/promises");
const path = require("node:path");
const { config } = require("../config");

async function capture(page, runId) {
  await fs.mkdir(config.screenshotDir, { recursive: true, mode: 0o700 });
  const file = path.join(config.screenshotDir, `capture-${runId}.png`);
  if (config.screenshotSelector) {
    await page.locator(config.screenshotSelector).screenshot({ path: file, animations: "disabled" });
  } else {
    await page.screenshot({
      path: file,
      fullPage: config.screenshotFullPage,
      animations: "disabled"
    });
  }
  return file;
}
module.exports = { capture };
