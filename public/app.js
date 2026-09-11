const socket = io();

let currentDashboard = { nodes: {}, alerts: [] };
let selectedNode = null;

const totalNodes = document.getElementById("totalNodes");
const onlineNodes = document.getElementById("onlineNodes");
const offlineNodes = document.getElementById("offlineNodes");
const activeAlerts = document.getElementById("activeAlerts");
const systemConnection = document.getElementById("systemConnection");
const sidebarConnection = document.getElementById("sidebarConnection");
const alertsContainer = document.getElementById("alertsContainer");
const sidebarAlertCount = document.getElementById("sidebarAlertCount");
const sensorsTableBody = document.getElementById("sensorsTableBody");
const visibleNodesCount = document.getElementById("visibleNodesCount");
const sensorSearch = document.getElementById("sensorSearch");
const presenceFilter = document.getElementById("presenceFilter");
const diagnosticFilter = document.getElementById("diagnosticFilter");
const verificationTitle = document.getElementById("verificationTitle");
const verificationDescription = document.getElementById("verificationDescription");
const verificationState = document.getElementById("verificationState");
const verificationPulse = document.getElementById("verificationPulse");
const sensorDrawer = document.getElementById("sensorDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerNodeName = document.getElementById("drawerNodeName");
const drawerContent = document.getElementById("drawerContent");
const closeDrawer = document.getElementById("closeDrawer");

socket.on("connect", () => setSystemConnection(true));
socket.on("disconnect", () => setSystemConnection(false));

socket.on("dashboard:update", dashboard => {
  currentDashboard = dashboard;
  renderDashboard();
  if (selectedNode) renderDrawer(selectedNode);
});

function setSystemConnection(connected) {
  if (connected) {
    systemConnection.className = "system-status online";
    systemConnection.innerHTML = `<span class="status-dot"></span>Sistema conectado`;
    sidebarConnection.className = "sidebar-connection online";
    sidebarConnection.innerHTML = `<span class="status-dot"></span>Conectado`;
    return;
  }

  systemConnection.className = "system-status offline";
  systemConnection.innerHTML = `<span class="status-dot"></span>Sistema desconectado`;
  sidebarConnection.className = "sidebar-connection offline";
  sidebarConnection.innerHTML = `<span class="status-dot"></span>Desconectado`;
}

function renderDashboard() {
  const nodes = Object.entries(currentDashboard.nodes ?? {});
  const alerts = currentDashboard.alerts ?? [];
  const online = nodes.filter(([, data]) => data.presence === "ONLINE").length;
  const offline = nodes.filter(([, data]) => data.presence === "OFFLINE").length;

  totalNodes.textContent = nodes.length;
  onlineNodes.textContent = online;
  offlineNodes.textContent = offline;
  activeAlerts.textContent = alerts.length;

  if (alerts.length > 0) {
    sidebarAlertCount.textContent = alerts.length;
    sidebarAlertCount.classList.remove("hidden");
  } else {
    sidebarAlertCount.classList.add("hidden");
  }

  renderVerification(nodes);
  renderAlerts(alerts);
  renderSensors();
}

function renderVerification(nodes) {
  const verifyingEntry = nodes.find(([, data]) => data.status === "VERIFICANDO");

  if (!verifyingEntry) {
    verificationTitle.textContent = "Aguardando próxima verificação";
    verificationDescription.textContent = "Nenhum sensor está sendo verificado neste momento.";
    verificationState.textContent = "Aguardando";
    verificationPulse.className = "pulse idle";
    return;
  }

  const [nodeName] = verifyingEntry;

  verificationTitle.textContent = `Verificando ${nodeName}`;
  verificationDescription.textContent = "O sensor está realizando a leitura BLE dos dispositivos próximos.";
  verificationState.textContent = "Em andamento";
  verificationPulse.className = "pulse active";
}

function renderAlerts(alerts) {
  alertsContainer.innerHTML = "";

  if (alerts.length === 0) {
    alertsContainer.innerHTML = `
      <div class="no-alerts">
        <span class="no-alerts-icon">✓</span>
        <div>
          <strong>Nenhum alerta ativo</strong>
          <p>A infraestrutura está operando normalmente.</p>
        </div>
      </div>
    `;
    return;
  }

  for (const alert of alerts) {
    const element = document.createElement("div");

    element.className = "alert-card";
    element.innerHTML = `
      <div class="alert-icon">!</div>
      <div>
        <strog>${escapeHtml(alert.title)}</strog>
        <p>${escapeHtml(alert.message)}</p>
      </div>
    `;

    alertsContainer.appendChild(element);
  }
}

function renderSensors() {
  const query = sensorSearch.value.trim().toLowerCase();
  const presence = presenceFilter.value;
  const diagnostic = diagnosticFilter.value;

  let nodes = Object.entries(currentDashboard.nodes ?? {});

  if (query) {
    nodes = nodes.filter(([nodeName, data]) => {
      const text = `${nodeName} ${getExpectedNeighbors(data)} ${getDetectedNeighbors(data)}`.toLowerCase();
      return text.includes(query);
    });
  }

  if (presence !== "ALL") nodes = nodes.filter(([, data]) => data.presence === presence);
  if (diagnostic !== "ALL") nodes = nodes.filter(([, data]) => data.diagnostic === diagnostic);

  visibleNodesCount.textContent = `${nodes.length} ${nodes.length === 1 ? "sensor" : "sensores"}`;
  sensorsTableBody.innerHTML = "";

  if (nodes.length === 0) {
    sensorsTableBody.innerHTML = `<tr><td colspan="8" class="empty-table">Nenhum sensor encontrado.</td></tr>`;
    return;
  }

  nodes.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

  for (const [nodeName, data] of nodes) sensorsTableBody.appendChild(createSensorRow(nodeName, data));
}

function createSensorRow(nodeName, data) {
  const row = document.createElement("tr");
  const presence = formatPresence(data.presence);
  const status = formatStatus(data.status);
  const diagnostic = formatDiagnostic(data.diagnostic);
  const expected = getExpectedNeighbors(data);
  const detected = getDetectedNeighbors(data);

  row.innerHTML = `
    <td>
      <span class="sensor-code">${escapeHtml(nodeName)}</span>
      <span class="sensor-sub">Nó NAVESCENCE</span>
    </td>
    <td><span class="badge ${presence.className}">${presence.text}</span></td>
    <td><span class="badge ${status.className}">${status.text}</span></td>
    <td>${escapeHtml(expected)}</td>
    <td>${escapeHtml(detected)}</td>
    <td>${formatDate(data.lastCommunication)}</td>
    <td><span class="diagnostic-label ${diagnostic.className}">${diagnostic.text}</span></td>
    <td><button class="details-button" type="button" aria-label="Abrir detalhes">›</button></td>
  `;

  row.addEventListener("click", () => openDrawer(nodeName));

  return row;
}

sensorSearch.addEventListener("input", renderSensors);
presenceFilter.addEventListener("change", renderSensors);
diagnosticFilter.addEventListener("change", renderSensors);

function openDrawer(nodeName) {
  selectedNode = nodeName;
  renderDrawer(nodeName);

  sensorDrawer.classList.add("open");
  drawerOverlay.classList.add("open");
}

function hideDrawer() {
  selectedNode = null;

  sensorDrawer.classList.remove("open");
  drawerOverlay.classList.remove("open");
}

closeDrawer.addEventListener("click", hideDrawer);
drawerOverlay.addEventListener("click", hideDrawer);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") hideDrawer();
});

function renderDrawer(nodeName) {
  const data = currentDashboard.nodes?.[nodeName];
  if (!data) return;

  drawerNodeName.textContent = nodeName;

  const presence = formatPresence(data.presence);
  const diagnostic = formatDiagnostic(data.diagnostic);
  const expected = getExpectedNeighbors(data);
  const detected = getDetectedNeighbors(data);

  const neighbors = Array.isArray(data.detectedNeighbors) ? data.detectedNeighbors : [];
  const neighbor = neighbors[0] ?? data.neighbor ?? null;
  const averageRssi = neighbor?.averageRssi ?? neighbor?.rssiAverage ?? null;

  drawerContent.innerHTML = `
    <section class="drawer-section">
      <div class="drawer-section-title">Estado atual</div>

      <div class="drawer-info">
        <div class="drawer-row">
          <span>Presença</span>
          <strong>${presence.text}</strong>
        </div>

        <div class="drawer-row">
          <span>Estado</span>
          <strong>${formatStatus(data.status).text}</strong>
        </div>

        <div class="drawer-row">
          <span>Diagnóstico</span>
          <strong>${diagnostic.text}</strong>
        </div>

        <div class="drawer-row">
          <span>Última comunicação</span>
          <strong>${formatDate(data.lastCommunication)}</strong>
        </div>

        <div class="drawer-row">
          <span>Última verificação</span>
          <strong>${formatDate(data.lastVerification)}</strong>
        </div>
      </div>
    </section>

    <section class="drawer-section">
      <div class="drawer-section-title">Topologia</div>

      <div class="drawer-info">
        <div class="drawer-row">
          <span>Vizinho esperado</span>
          <strong>${escapeHtml(expected)}</strong>
        </div>

        <div class="drawer-row">
          <span>Vizinho detectado</span>
          <strong>${escapeHtml(detected)}</strong>
        </div>
      </div>
    </section>

    <section class="drawer-section">
      <div class="drawer-section-title">Última leitura BLE</div>

      <div class="drawer-info">
        <div class="drawer-row">
          <span>M15</span>
          <strong>${neighbor?.m15 ?? "—"} dBm</strong>
        </div>

        <div class="drawer-row">
          <span>RSSI médio</span>
          <strong>${averageRssi ?? "—"} dBm</strong>
        </div>

        <div class="drawer-row">
          <span>Leituras</span>
          <strong>${neighbor?.readings ?? 0}</strong>
        </div>

        <div class="drawer-row">
          <span>Leituras válidas</span>
          <strong>${neighbor?.validReadings ?? 0}</strong>
        </div>

        <div class="drawer-row">
          <span>Descartadas</span>
          <strong>${neighbor?.discardedReadings ?? 0}</strong>
        </div>
      </div>
    </section>
  `;
}

function getExpectedNeighbors(data) {
  if (Array.isArray(data.expectedNeighbors)) return data.expectedNeighbors.join(", ") || "—";
  return data.expectedNeighbor ?? "—";
}

function getDetectedNeighbors(data) {
  if (Array.isArray(data.detectedNeighbors)) {
    const names = data.detectedNeighbors.map(neighbor => neighbor.node).filter(Boolean);
    return names.join(", ") || "Não detectado";
  }

  return data.neighbor?.node ?? "Não detectado";
}

function formatPresence(presence) {
  switch (presence) {
    case "ONLINE":
      return { text: "Online", className: "online" };

    case "OFFLINE":
      return { text: "Offline", className: "offline" };

    default:
      return { text: "Desconhecido", className: "unknown" };
  }
}

function formatStatus(status) {
  switch (status) {
    case "VERIFICANDO":
      return { text: "Verificando", className: "verifying" };

    case "FINALIZADO":
      return { text: "Finalizado", className: "online" };

    default:
      return { text: "Aguardando", className: "unknown" };
  }
}

function formatDiagnostic(diagnostic) {
  switch (diagnostic) {
    case "OK":
      return { text: "Normal", className: "ok" };

    case "VERIFICANDO":
      return { text: "Verificando", className: "verifying" };

    case "NO_INDISPONIVEL":
      return { text: "Indisponível", className: "error" };

    case "VIZINHO_NAO_DETECTADO":
      return { text: "Vizinho não detectado", className: "error" };

    default:
      return { text: "Aguardando", className: "unknown" };
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
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