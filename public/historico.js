let historyData = [];

const historyTotalCount = document.getElementById("historyTotalCount");
const historyFinishedCount = document.getElementById("historyFinishedCount");
const historyFailureCount = document.getElementById("historyFailureCount");
const historyManualCount = document.getElementById("historyManualCount");

const historySearch = document.getElementById("historySearch");
const historySensorFilter = document.getElementById("historySensorFilter");
const historyModeFilter = document.getElementById("historyModeFilter");
const historyResultFilter = document.getElementById("historyResultFilter");

const historyVisibleCount = document.getElementById("historyVisibleCount");
const historyTableBody = document.getElementById("historyTableBody");

const refreshHistoryButton = document.getElementById("refreshHistoryButton");

const historyDrawerOverlay = document.getElementById("historyDrawerOverlay");
const historyDrawer = document.getElementById("historyDrawer");
const historyDrawerTitle = document.getElementById("historyDrawerTitle");
const historyDrawerContent = document.getElementById("historyDrawerContent");
const closeHistoryDrawer = document.getElementById("closeHistoryDrawer");

async function loadHistory() {
  try {
    refreshHistoryButton.disabled = true;
    refreshHistoryButton.textContent = "Atualizando...";

    const response = await fetch("/api/verifications/history?limit=200");

    if (!response.ok) {
      throw new Error("Não foi possível carregar o histórico.");
    }

    historyData = await response.json();

    renderSensorFilter();
    renderSummary();
    renderHistory();
  } catch (error) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  } finally {
    refreshHistoryButton.disabled = false;
    refreshHistoryButton.textContent = "Atualizar";
  }
}

function renderSummary() {
  historyTotalCount.textContent = historyData.length;

  historyFinishedCount.textContent = historyData.filter(item => {
    return item.result === "FINISHED";
  }).length;

  historyFailureCount.textContent = historyData.filter(item => {
    return ["OFFLINE", "TIMEOUT", "ERROR"].includes(item.result);
  }).length;

  historyManualCount.textContent = historyData.filter(item => {
    return item.mode === "MANUAL";
  }).length;
}

function renderSensorFilter() {
  const selected = historySensorFilter.value;

  const sensors = [
    ...new Set(
      historyData.map(item => item.nodeCode)
    )
  ].sort();

  historySensorFilter.innerHTML = `
    <option value="ALL">
      Todos os sensores
    </option>
  `;

  for (const sensor of sensors) {
    const option = document.createElement("option");

    option.value = sensor;
    option.textContent = sensor;

    historySensorFilter.appendChild(option);
  }

  historySensorFilter.value =
    sensors.includes(selected)
      ? selected
      : "ALL";
}

function getFilteredHistory() {
  const search = historySearch.value.trim().toLowerCase();
  const sensor = historySensorFilter.value;
  const mode = historyModeFilter.value;
  const result = historyResultFilter.value;

  return historyData.filter(item => {
    if (search) {
      const text = `
        ${item.nodeCode}
        ${item.node?.name ?? ""}
        ${item.node?.mac ?? ""}
      `.toLowerCase();

      if (!text.includes(search)) return false;
    }

    if (sensor !== "ALL" && item.nodeCode !== sensor) return false;
    if (mode !== "ALL" && item.mode !== mode) return false;
    if (result !== "ALL" && item.result !== result) return false;

    return true;
  });
}

function renderHistory() {
  const filtered = getFilteredHistory();

  historyVisibleCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? "registro" : "registros"}`;

  if (filtered.length === 0) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">
          Nenhuma verificação encontrada.
        </td>
      </tr>
    `;

    return;
  }

  historyTableBody.innerHTML = filtered.map(item => {
    const readings = Array.isArray(item.readings)
      ? item.readings.length
      : 0;

    return `
      <tr>
        <td>
          <span class="history-date">
            ${formatDate(item.startedAt)}
          </span>
        </td>

        <td>
          <span class="sensor-code">
            ${escapeHtml(item.nodeCode)}
          </span>

          <span class="sensor-sub">
            ${escapeHtml(item.node?.name ?? "Sensor NAVESCENCE")}
          </span>
        </td>

        <td>
          <span class="history-mode ${item.mode.toLowerCase()}">
            ${formatMode(item.mode)}
          </span>
        </td>

        <td>
          <span class="history-result ${resultClass(item.result)}">
            ${formatResult(item.result)}
          </span>
        </td>

        <td>
          ${formatDuration(item.durationMs)}
        </td>

        <td>
          ${readings}
        </td>

        <td>
          <button
            class="table-action-button history-details-button"
            type="button"
            data-id="${item.id}"
          >
            Detalhes
          </button>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".history-details-button").forEach(button => {
    button.addEventListener("click", () => {
      openHistoryDetails(Number(button.dataset.id));
    });
  });
}

async function openHistoryDetails(id) {
  try {
    const response = await fetch(`/api/verifications/history/${id}`);

    if (!response.ok) {
      throw new Error("Não foi possível carregar a verificação.");
    }

    const item = await response.json();

    historyDrawerTitle.textContent = `${item.nodeCode} · #${item.id}`;

    historyDrawerContent.innerHTML = createDetailContent(item);

    historyDrawer.classList.add("open");
    historyDrawerOverlay.classList.add("open");
  } catch (error) {
    alert(error.message);
  }
}

function createDetailContent(item) {
  const readings = Array.isArray(item.readings)
    ? item.readings
    : [];

  return `
    <section class="history-detail-section">
      <span class="drawer-section-title">
        Execução
      </span>

      <div class="history-detail-grid">
        ${createDetailItem("Sensor", item.nodeCode)}
        ${createDetailItem("Nome", item.node?.name ?? "—")}
        ${createDetailItem("Modo", formatMode(item.mode))}
        ${createDetailItem("Resultado", formatResult(item.result))}
        ${createDetailItem("Início", formatFullDate(item.startedAt))}
        ${createDetailItem("Fim", formatFullDate(item.finishedAt))}
        ${createDetailItem("Duração", formatDuration(item.durationMs))}
        ${createDetailItem("MAC", item.node?.mac ?? "—")}
      </div>
    </section>

    <section class="history-detail-section">
      <span class="drawer-section-title">
        Leituras BLE
      </span>

      ${
        readings.length === 0
          ? `
            <div class="history-no-readings">
              Nenhuma leitura BLE foi registrada nesta verificação.
            </div>
          `
          : readings.map(reading => createReadingCard(reading)).join("")
      }
    </section>
  `;
}

function createDetailItem(label, value) {
  return `
    <div class="history-detail-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function createReadingCard(reading) {
  return `
    <article class="history-reading-card">
      <div class="history-reading-header">
        <div>
          <span>Vizinho detectado</span>

          <strong>
            ${escapeHtml(reading.neighborCode ?? "SEM_NOME")}
          </strong>
        </div>

        <span class="history-reading-m15">
          ${formatRssi(reading.m15)}
        </span>
      </div>

      <div class="history-reading-grid">
        ${createDetailItem("MAC", reading.mac ?? "—")}
        ${createDetailItem("Leituras", formatNumber(reading.readings))}
        ${createDetailItem("Válidas", formatNumber(reading.validReadings))}
        ${createDetailItem("Descartadas", formatNumber(reading.discardedReadings))}
        ${createDetailItem("RSSI médio", formatRssi(reading.averageRssi))}
        ${createDetailItem("M15", formatRssi(reading.m15))}
        ${createDetailItem("Mínimo", formatRssi(reading.minRssi))}
        ${createDetailItem("Máximo", formatRssi(reading.maxRssi))}
      </div>
    </article>
  `;
}

function closeDrawer() {
  historyDrawer.classList.remove("open");
  historyDrawerOverlay.classList.remove("open");
}

function formatMode(value) {
  const values = {
    AUTOMATIC: "Automática",
    MANUAL: "Manual"
  };

  return values[value] ?? value;
}

function formatResult(value) {
  const values = {
    FINISHED: "Finalizada",
    OFFLINE: "Offline",
    TIMEOUT: "Timeout",
    ERROR: "Erro"
  };

  return values[value] ?? value;
}

function resultClass(value) {
  if (value === "FINISHED") return "success";
  if (value === "OFFLINE") return "offline";
  if (value === "TIMEOUT") return "warning";
  if (value === "ERROR") return "error";

  return "unknown";
}

function formatDuration(value) {
  const milliseconds = Number(value);

  if (!Number.isFinite(milliseconds)) return "—";

  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }

  return `${(milliseconds / 1000).toFixed(1)} s`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatFullDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatNumber(value) {
  if (value === null || value === undefined) return "—";

  return String(value);
}

function formatRssi(value) {
  if (value === null || value === undefined) return "—";

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return `${number.toFixed(1)} dBm`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

refreshHistoryButton.addEventListener("click", loadHistory);
historySearch.addEventListener("input", renderHistory);
historySensorFilter.addEventListener("change", renderHistory);
historyModeFilter.addEventListener("change", renderHistory);
historyResultFilter.addEventListener("change", renderHistory);

closeHistoryDrawer.addEventListener("click", closeDrawer);
historyDrawerOverlay.addEventListener("click", closeDrawer);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeDrawer();
});

loadHistory();