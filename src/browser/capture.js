const fs = require("node:fs/promises");
const path = require("node:path");
const { config } = require("../config");

function getCaptureClip() {
  return {
    x: config.screenshotCropX,
    y: config.screenshotCropY,
    width: config.screenshotWidth,
    height: config.screenshotHeight
  };
}

async function capture(page, runId) {
  await fs.mkdir(config.screenshotDir, { recursive: true, mode: 0o700 });
  const file = path.join(config.screenshotDir, `capture-${runId}.png`);

  await page.evaluate(() => window.scrollTo({ left: 0, top: 0, behavior: "auto" }));
  await page.addStyleTag({
    content: `
      html, body { scrollbar-width: none !important; }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
    `
  });

  const clip = getCaptureClip();
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }));

  if (clip.x + clip.width > viewport.width || clip.y + clip.height > viewport.height) {
    throw new Error("O recorte configurado não cabe na viewport da captura.");
  }

  const summaryHeading = page.getByText("SUMÁRIO", { exact: true }).first();
  await summaryHeading.waitFor({ state: "visible" });
  const headingBox = await summaryHeading.boundingBox();

  if (
    !headingBox ||
    headingBox.x < clip.x ||
    headingBox.y < clip.y ||
    headingBox.x + headingBox.width > clip.x + clip.width ||
    headingBox.y + headingBox.height > clip.y + clip.height
  ) {
    throw new Error("O título SUMÁRIO está fora da área configurada para a captura.");
  }

  await page.screenshot({
    path: file,
    clip,
    animations: "disabled",
    scale: "css"
  });

  return file;
}

module.exports = { capture, getCaptureClip };
