let dashboard = null;
let coordinatorStatus = null;

const verificationConnection =
  document.getElementById("verificationConnection");

const verificationSensorCount =
  document.getElementById("verificationSensorCount");

const checkingCount =
  document.getElementById("checkingCount");

const verificationOnlineCount =
  document.getElementById("verificationOnlineCount");

const verificationOfflineCount =
  document.getElementById("verificationOfflineCount");

const verificationLiveIcon =
  document.getElementById("verificationLiveIcon");

const verificationLiveTitle =
  document.getElementById("verificationLiveTitle");

const verificationLiveDescription =
  document.getElementById("verificationLiveDescription");

const verificationLiveDot =
  document.getElementById("verificationLiveDot");

const verificationLiveState =
  document.getElementById("verificationLiveState");

const verificationGrid =
  document.getElementById("verificationGrid");

const verificationReadingsBody =
  document.getElementById("verificationReadingsBody");

const verificationUpdatedAt =
  document.getElementById("verificationUpdatedAt");

const refreshVerificationButton =
  document.getElementById("refreshVerificationButton");

const manualVerificationTarget =
  document.getElementById("manualVerificationTarget");

const runManualVerificationButton =
  document.getElementById("runManualVerificationButton");

const manualVerificationStatus =
  document.getElementById("manualVerificationStatus");

const manualVerificationMessage =
  document.getElementById("manualVerificationMessage");

const socket = io();

socket.on("connect", () => {
  setConnection(true);
});

socket.on("disconnect", () => {
  setConnection(false);
});

socket.on("dashboard:update", data => {
  dashboard = data;

  renderDashboard();
  renderManualOptions();
});

async function loadAll() {
  try {
    refreshVerificationButton.disabled = true;
    refreshVerificationButton.textContent = "Atualizando...";

    const [dashboardResponse, statusResponse] =
      await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/verifications/status")
      ]);

    if (!dashboardResponse.ok) {
      throw new Error(
        "Não foi possível carregar as verificações."
      );
    }

    dashboard =
      await dashboardResponse.json();

    if (statusResponse.ok) {
      coordinatorStatus =
        await statusResponse.json();
    }

    setConnection(true);

    renderDashboard();
    renderManualOptions();
    renderCoordinatorStatus();
  } catch {
    setConnection(false);
  } finally {
    refreshVerificationButton.disabled = false;
    refreshVerificationButton.textContent = "Atualizar";
  }
}

async function loadCoordinatorStatus() {
  try {
    const response =
      await fetch(
        "/api/verifications/status"
      );

    if (!response.ok) return;

    coordinatorStatus =
      await response.json();

    renderCoordinatorStatus();
  } catch {
  }
}

function renderDashboard() {
  if (!dashboard?.nodes) return;

  renderSummary();
  renderLiveVerification();
  renderSensors();
  renderReadings();
  renderUpdatedAt();
}

function renderSummary() {
  const nodes =
    Object.values(dashboard.nodes);

  verificationSensorCount.textContent =
    nodes.length;

  checkingCount.textContent =
    nodes.filter(node => {
      return node.status === "VERIFICANDO";
    }).length;

  verificationOnlineCount.textContent =
    nodes.filter(node => {
      return node.presence === "ONLINE";
    }).length;

  verificationOfflineCount.textContent =
    nodes.filter(node => {
      return node.presence === "OFFLINE";
    }).length;
}

function renderLiveVerification() {
  const entries =
    Object.entries(dashboard.nodes);

  const checking =
    entries.find(([, node]) => {
      return node.status === "VERIFICANDO";
    });

  if (checking) {
    const [nodeId] = checking;

    verificationLiveIcon.className =
      "verification-live-icon checking";

    verificationLiveTitle.textContent =
      `Verificando ${nodeId}`;

    verificationLiveDescription.textContent =
      "O sensor está realizando a leitura BLE dos dispositivos próximos.";

    verificationLiveDot.className =
      "verification-status-dot checking";

    verificationLiveState.textContent =
      coordinatorStatus?.mode === "MANUAL"
        ? "Execução manual"
        : "Em andamento";

    return;
  }

  verificationLiveIcon.className =
    "verification-live-icon idle";

  verificationLiveTitle.textContent =
    "Aguardando próxima verificação";

  verificationLiveDescription.textContent =
    "Nenhum sensor está realizando uma leitura BLE neste momento.";

  verificationLiveDot.className =
    "verification-status-dot idle";

  verificationLiveState.textContent =
    "Aguardando";
}

function renderManualOptions() {
  if (!dashboard?.nodes) return;

  const current =
    manualVerificationTarget.value || "ALL";

  manualVerificationTarget.innerHTML = `
    <option value="ALL">
      Rodada completa
    </option>
  `;

  for (const nodeId of Object.keys(dashboard.nodes)) {
    const option =
      document.createElement("option");

    option.value = nodeId;
    option.textContent = nodeId;

    manualVerificationTarget.appendChild(option);
  }

  const exists =
    current === "ALL" ||
    dashboard.nodes[current];

  manualVerificationTarget.value =
    exists
      ? current
      : "ALL";
}

function renderCoordinatorStatus() {
  if (!coordinatorStatus) return;

  const busy =
    coordinatorStatus.busy === true;

  runManualVerificationButton.disabled =
    busy;

  manualVerificationTarget.disabled =
    busy;

  if (coordinatorStatus.mode === "MANUAL") {
    manualVerificationStatus.textContent =
      coordinatorStatus.currentNode
        ? `Verificação manual em andamento: ${coordinatorStatus.currentNode}`
        : "Verificação manual em andamento.";

    return;
  }

  if (coordinatorStatus.mode === "AUTOMATIC") {
    manualVerificationStatus.textContent =
      coordinatorStatus.currentNode
        ? `Rodízio automático verificando ${coordinatorStatus.currentNode}.`
        : "Rodízio automático em andamento.";

    return;
  }

  if (coordinatorStatus.nextAutomaticAt) {
    manualVerificationStatus.textContent =
      `Disponível. Próxima rodada automática às ${formatTime(
        coordinatorStatus.nextAutomaticAt
      )}.`;

    return;
  }

  manualVerificationStatus.textContent =
    "Disponível para execução manual.";
}

async function runManualVerification() {
  const target =
    manualVerificationTarget.value;

  runManualVerificationButton.disabled = true;
  manualVerificationTarget.disabled = true;

  runManualVerificationButton.textContent =
    "Executando...";

  showManualMessage(
    target === "ALL"
      ? "Executando rodada completa..."
      : `Executando verificação de ${target}...`,
    "info"
  );

  try {
    const response =
      await fetch(
        "/api/verifications/run",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target
          })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ??
        "Não foi possível executar a verificação."
      );
    }

    const finished =
      result.results.filter(item => {
        return item.result === "FINISHED";
      }).length;

    const offline =
      result.results.filter(item => {
        return item.result === "OFFLINE";
      }).length;

    const timeout =
      result.results.filter(item => {
        return item.result === "TIMEOUT";
      }).length;

    let message =
      `Verificação concluída. ${finished} sensor(es) finalizado(s).`;

    if (offline > 0) {
      message += ` ${offline} offline.`;
    }

    if (timeout > 0) {
      message += ` ${timeout} timeout.`;
    }

    showManualMessage(
      message,
      timeout > 0 || offline > 0
        ? "warning"
        : "success"
    );

    await loadAll();
  } catch (error) {
    showManualMessage(
      error.message,
      "error"
    );

    await loadCoordinatorStatus();
  } finally {
    runManualVerificationButton.textContent =
      "Iniciar verificação";

    renderCoordinatorStatus();
  }
}

function renderSensors() {
  const entries =
    Object.entries(dashboard.nodes);

  if (entries.length === 0) {
    verificationGrid.innerHTML = `
      <div class="verification-empty">
        Nenhum sensor disponível.
      </div>
    `;

    return;
  }

  verificationGrid.innerHTML =
    entries.map(([nodeId, node]) => {
      const expected =
        Array.isArray(node.expectedNeighbors)
          ? node.expectedNeighbors
          : [];

      const detected =
        Array.isArray(node.detectedNeighbors)
          ? node.detectedNeighbors
          : [];

      return `
        <article class="verification-node-card">
          <div class="verification-node-header">
            <div>
              <span class="verification-node-code">
                ${escapeHtml(nodeId)}
              </span>

              <span class="verification-node-presence ${presenceClass(node.presence)}">
                <i></i>
                ${formatPresence(node.presence)}
              </span>
            </div>

            <span class="verification-node-status ${statusClass(node.status)}">
              ${formatStatus(node.status)}
            </span>
          </div>

          <div class="verification-node-info">
            <div>
              <span>Última verificação</span>
              <strong>
                ${formatDate(node.lastVerification)}
              </strong>
            </div>

            <div>
              <span>Última comunicação</span>
              <strong>
                ${formatDate(node.lastCommunication)}
              </strong>
            </div>
          </div>

          <div class="verification-node-neighbors">
            <div>
              <span>Vizinhos esperados</span>

              <strong>
                ${
                  expected.length
                    ? expected
                        .map(item => escapeHtml(item))
                        .join(", ")
                    : "—"
                }
              </strong>
            </div>

            <div>
              <span>Vizinhos detectados</span>

              <strong>
                ${
                  detected.length
                    ? detected
                        .map(item => escapeHtml(item.node))
                        .join(", ")
                    : "Nenhum"
                }
              </strong>
            </div>
          </div>

          <div class="verification-node-footer">
            <span>
              Diagnóstico
            </span>

            <strong class="${diagnosticClass(node.diagnostic)}">
              ${formatDiagnostic(node.diagnostic)}
            </strong>
          </div>
        </article>
      `;
    }).join("");
}

function renderReadings() {
  const rows = [];

  for (
    const [nodeId, node]
    of Object.entries(dashboard.nodes)
  ) {
    const neighbors =
      Array.isArray(node.detectedNeighbors)
        ? node.detectedNeighbors
        : [];

    for (const neighbor of neighbors) {
      rows.push({
        scanner: nodeId,
        ...neighbor
      });
    }
  }

  if (rows.length === 0) {
    verificationReadingsBody.innerHTML = `
      <tr>
        <td colspan="8" class="loading-cell">
          Nenhuma leitura BLE disponível.
        </td>
      </tr>
    `;

    return;
  }

  verificationReadingsBody.innerHTML =
    rows.map(reading => `
      <tr>
        <td>
          <span class="sensor-code">
            ${escapeHtml(reading.scanner)}
          </span>
        </td>

        <td>
          ${escapeHtml(reading.node ?? "—")}
        </td>

        <td>
          ${escapeHtml(reading.mac ?? "—")}
        </td>

        <td>
          ${formatNumber(reading.readings)}
        </td>

        <td>
          ${formatNumber(reading.validReadings)}
        </td>

        <td>
          ${formatNumber(reading.discardedReadings)}
        </td>

        <td>
          ${formatRssi(reading.averageRssi)}
        </td>

        <td>
          <strong>
            ${formatRssi(reading.m15)}
          </strong>
        </td>
      </tr>
    `).join("");
}

function renderUpdatedAt() {
  verificationUpdatedAt.textContent =
    dashboard?.updatedAt
      ? `Atualizado às ${formatTime(
          dashboard.updatedAt
        )}`
      : "—";
}

function showManualMessage(message, type) {
  manualVerificationMessage.className =
    `manual-verification-message ${type}`;

  manualVerificationMessage.textContent =
    message;
}

function setConnection(connected) {
  if (connected) {
    verificationConnection.className =
      "system-status online";

    verificationConnection.innerHTML = `
      <span class="status-dot"></span>
      Tempo real
    `;

    return;
  }

  verificationConnection.className =
    "system-status offline";

  verificationConnection.innerHTML = `
    <span class="status-dot"></span>
    Desconectado
  `;
}

function formatPresence(value) {
  const values = {
    ONLINE: "Online",
    OFFLINE: "Offline",
    DESCONHECIDO: "Desconhecido"
  };

  return values[value] ??
    value ??
    "Desconhecido";
}

function formatStatus(value) {
  const values = {
    VERIFICANDO: "Verificando",
    FINALIZADO: "Finalizado",
    OCUPADO: "Ocupado",
    DESCONHECIDO: "Aguardando"
  };

  return values[value] ??
    value ??
    "Aguardando";
}

function formatDiagnostic(value) {
  const values = {
    OK: "Funcionamento normal",
    VERIFICANDO: "Verificando",
    NO_INDISPONIVEL: "Indisponível",
    VIZINHO_NAO_DETECTADO: "Vizinho não detectado",
    DESCONHECIDO: "Aguardando diagnóstico"
  };

  return values[value] ??
    value ??
    "Aguardando diagnóstico";
}

function presenceClass(value) {
  if (value === "ONLINE") return "online";
  if (value === "OFFLINE") return "offline";

  return "unknown";
}

function statusClass(value) {
  if (value === "VERIFICANDO") return "checking";
  if (value === "FINALIZADO") return "finished";

  return "waiting";
}

function diagnosticClass(value) {
  if (value === "OK") {
    return "diagnostic-ok";
  }

  if (value === "VIZINHO_NAO_DETECTADO") {
    return "diagnostic-warning";
  }

  if (value === "NO_INDISPONIVEL") {
    return "diagnostic-error";
  }

  return "";
}

function formatDate(value) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  );
}

function formatTime(value) {
  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  );
}

function formatNumber(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return String(value);
}

function formatRssi(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${number.toFixed(1)} dBm`;
}

function escapeHtml(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

refreshVerificationButton.addEventListener(
  "click",
  loadAll
);

runManualVerificationButton.addEventListener(
  "click",
  runManualVerification
);

loadAll();

setInterval(
  loadCoordinatorStatus,
  2000
);