const test = require("node:test");
const assert = require("node:assert/strict");
const { config } = require("../src/config");
const { getCaptureClip } = require("../src/browser/capture");
const { waitForPageToSettle } = require("../src/browser/client");
const { nextScheduledAt } = require("../src/scheduler/schedule");

test("usa os horários locais de checkpoint configurados", () => {
  assert.deepEqual(config.scheduleTimes, [
    "01:00", "04:00", "07:00", "10:00",
    "13:00", "16:00", "19:00", "22:00"
  ]);
});

test("aguarda a rede estabilizar e mais 60 segundos antes da captura", () => {
  assert.equal(config.networkIdleTimeoutMs, 45000);
  assert.equal(config.pageSettleWaitMs, 60000);
});

test("espera a rede ociosa e depois o tempo de renderização", async () => {
  const calls = [];
  const page = {
    async waitForLoadState(state, options) {
      calls.push(["load", state, options.timeout]);
    },
    async waitForTimeout(ms) {
      calls.push(["settle", ms]);
    }
  };

  await waitForPageToSettle(page, "test");

  assert.deepEqual(calls, [
    ["load", "networkidle", 45000],
    ["settle", 60000]
  ]);
});

test("mantém a espera final se a página nunca ficar ociosa", async () => {
  const calls = [];
  const page = {
    async waitForLoadState() {
      const error = new Error("timeout");
      error.name = "TimeoutError";
      throw error;
    },
    async waitForTimeout(ms) {
      calls.push(ms);
    }
  };

  await waitForPageToSettle(page, "test");

  assert.deepEqual(calls, [60000]);
});

test("calcula o próximo horário em America/Sao_Paulo", () => {
  const next = nextScheduledAt(
    new Date("2026-10-16T06:59:30.000Z"),
    config.scheduleTimes,
    "America/Sao_Paulo"
  );

  assert.equal(next.toISOString(), "2026-10-16T07:00:00.000Z");
});

test("não repete um horário que já passou", () => {
  const next = nextScheduledAt(
    new Date("2026-10-16T07:00:00.000Z"),
    config.scheduleTimes,
    "America/Sao_Paulo"
  );

  assert.equal(next.toISOString(), "2026-10-16T10:00:00.000Z");
});

test("recorta somente a área de 1920x1080 abaixo do menu e da barra", () => {
  assert.deepEqual(getCaptureClip(), {
    x: 360,
    y: 116,
    width: 1920,
    height: 1080
  });
});

test("usa exatamente a legenda de checkpoint solicitada", () => {
  assert.equal(
    config.whatsappMessage,
    "Checkpoint - ELSYS ONE [NETYLINK]\n\n⏱️ Período atual do monitoramento.\n\nEquipe BOC\nCore | Technologies"
  );
});
