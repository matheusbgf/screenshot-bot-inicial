const { config } = require("../src/config");
const { openSystem } = require("../src/browser/client");

async function main() {
  if (!config.headless) {
    throw new Error("Defina HEADLESS=true para autenticar sem interface gráfica.");
  }

  const session = await openSystem();

  try {
    await session.page.getByText("SUMÁRIO", { exact: true }).first().waitFor({
      state: "visible",
      timeout: config.navigationTimeoutMs
    });

    console.log(
      session.authenticatedByForm
        ? "Acesso autenticado em modo headless; sessão salva localmente."
        : "Sessão existente validada em modo headless."
    );
  } finally {
    await session.browser.close();
  }
}

main().catch(error => {
  console.error("Falha na autenticação:", error.message);
  process.exitCode = 1;
});

