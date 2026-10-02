require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { chromium } = require("playwright");

const authFile = path.resolve(
  process.env.AUTH_STATE_FILE || "./data/auth-state.json"
);

const url =
  process.env.SYSTEM_URL || "https://elsysone.com/pt-BR";

async function main() {
  await fs.mkdir(path.dirname(authFile), {
    recursive: true,
    mode: 0o700
  });

  const browser = await chromium.launch({
    headless: false
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    console.log("Faça login normalmente e conclua o MFA.");

    const rl = readline.createInterface({
      input: stdin,
      output: stdout
    });

    await rl.question(
      "Após entrar no sistema, pressione ENTER aqui para salvar a sessão: "
    );

    rl.close();

    await context.storageState({
      path: authFile
    });

    await fs.chmod(authFile, 0o600);

    console.log("Sessão salva localmente.");
    console.log("Não compartilhe o arquivo de sessão.");
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error("Falha na autenticação:", error.message);
  process.exitCode = 1;
});

