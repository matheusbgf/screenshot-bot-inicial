const { config } = require("../src/config");
const { openSystem, saveAuthState } = require("../src/browser/client");

async function main() {
  const session = await openSystem({ waitForReady: config.headless });

  try {
    const summary = session.page.getByText("SUMÁRIO", { exact: true }).first();
    const timeout = config.headless
      ? config.navigationTimeoutMs
      : Math.max(config.navigationTimeoutMs * 4, 180000);

    if (!config.headless) {
      console.log("Faça login na janela do Chromium; o script salvará a sessão quando SUMÁRIO aparecer.");
    }

    await summary.waitFor({ state: "visible", timeout });

    if (!config.headless) {
      await saveAuthState(session.context);
      console.log("Login concluído na janela visível; sessão salva localmente.");
    } else {
      console.log(
        session.authenticatedByForm
          ? "Acesso autenticado em modo headless; sessão salva localmente."
          : "Sessão existente validada em modo headless."
      );
    }
  } finally {
    await session.browser.close();
  }
}

main().catch(error => {
  console.error("Falha na autenticação:", error.message);
  process.exitCode = 1;
});
