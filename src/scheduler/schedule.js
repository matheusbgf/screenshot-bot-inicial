const minuteMs = 60 * 1000;

function nextScheduledAt(now, scheduleTimes, timeZone) {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (!Number.isFinite(nowMs)) {
    throw new Error("Horário atual inválido.");
  }

  if (!Array.isArray(scheduleTimes) || scheduleTimes.length === 0) {
    throw new Error("A lista de horários não pode ficar vazia.");
  }

  const scheduledTimes = new Set(scheduleTimes);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const firstMinute = Math.floor(nowMs / minuteMs) * minuteMs + minuteMs;
  const searchLimitMinutes = 48 * 60;

  for (let minute = 0; minute <= searchLimitMinutes; minute++) {
    const candidate = new Date(firstMinute + minute * minuteMs);
    const parts = Object.fromEntries(
      formatter.formatToParts(candidate).map(({ type, value }) => [type, value])
    );
    const localTime = `${parts.hour}:${parts.minute}`;

    if (scheduledTimes.has(localTime)) {
      return candidate;
    }
  }

  throw new Error("Nenhum horário configurado foi encontrado nos próximos dois dias.");
}

module.exports = { nextScheduledAt };
