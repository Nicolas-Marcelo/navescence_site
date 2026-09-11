let sensors = [];
let environments = [];
let topology = [];
let dashboard = null;

const topologySensorCount = document.getElementById("topologySensorCount");
const topologyEdgeCount = document.getElementById("topologyEdgeCount");
const topologyEnvironmentCount = document.getElementById("topologyEnvironmentCount");
const topologyOfflineCount = document.getElementById("topologyOfflineCount");
const topologyEnvironmentFilter = document.getElementById("topologyEnvironmentFilter");
const topologyUpdatedAt = document.getElementById("topologyUpdatedAt");
const topologyTitle = document.getElementById("topologyTitle");
const topologyCanvas = document.getElementById("topologyCanvas");
const topologyLines = document.getElementById("topologyLines");
const topologyNodes = document.getElementById("topologyNodes");
const topologyEmpty = document.getElementById("topologyEmpty");
const topologyEdgesBody = document.getElementById("topologyEdgesBody");
const refreshTopologyButton = document.getElementById("refreshTopologyButton");

async function loadTopology() {
  try {
    refreshTopologyButton.disabled = true;
    refreshTopologyButton.textContent = "Atualizando...";

    const [
      sensorsResponse,
      environmentsResponse,
      topologyResponse,
      dashboardResponse
    ] = await Promise.all([
      fetch("/api/sensors"),
      fetch("/api/environments"),
      fetch("/api/topology"),
      fetch("/api/dashboard")
    ]);

    if (!sensorsResponse.ok) throw new Error("Não foi possível carregar os sensores.");
    if (!environmentsResponse.ok) throw new Error("Não foi possível carregar os ambientes.");
    if (!topologyResponse.ok) throw new Error("Não foi possível carregar as conexões.");

    sensors = await sensorsResponse.json();
    environments = await environmentsResponse.json();
    topology = await topologyResponse.json();

    dashboard = dashboardResponse.ok
      ? await dashboardResponse.json()
      : null;

    renderEnvironmentFilter();
    renderSummary();
    renderTopology();
    renderEdges();
    renderUpdatedAt();
  } catch (error) {
    topologyNodes.innerHTML = "";

    topologyEmpty.classList.remove("hidden");
    topologyEmpty.querySelector("strong").textContent = "Não foi possível carregar a topologia";
    topologyEmpty.querySelector("span").textContent = error.message;

    topologyEdgesBody.innerHTML = `
      <tr>
        <td colspan="5" class="loading-cell">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  } finally {
    refreshTopologyButton.disabled = false;
    refreshTopologyButton.textContent = "Atualizar";
  }
}

function renderEnvironmentFilter() {
  const selected = topologyEnvironmentFilter.value;

  topologyEnvironmentFilter.innerHTML = `
    <option value="ALL">Todos os ambientes</option>
  `;

  for (const environment of environments) {
    const option = document.createElement("option");

    option.value = environment.id;
    option.textContent = environment.name;

    topologyEnvironmentFilter.appendChild(option);
  }

  const stillExists =
    selected === "ALL" ||
    environments.some(environment => String(environment.id) === selected);

  topologyEnvironmentFilter.value = stillExists
    ? selected
    : "ALL";
}

function renderSummary() {
  const unavailable = sensors.filter(sensor => {
    return getPresence(sensor.code) === "OFFLINE";
  }).length;

  topologySensorCount.textContent = sensors.length;
  topologyEdgeCount.textContent = topology.length;
  topologyEnvironmentCount.textContent = environments.length;
  topologyOfflineCount.textContent = unavailable;
}

function renderTopology() {
  const environmentId = topologyEnvironmentFilter.value;

  const visibleSensors =
    environmentId === "ALL"
      ? sensors
      : sensors.filter(sensor => String(sensor.environmentId) === environmentId);

  const visibleIds = new Set(
    visibleSensors.map(sensor => sensor.id)
  );

  const visibleEdges = topology.filter(edge => {
    return visibleIds.has(edge.nodeAId) &&
      visibleIds.has(edge.nodeBId);
  });

  updateTopologyTitle(environmentId);

  topologyLines.innerHTML = "";
  topologyNodes.innerHTML = "";

  if (visibleSensors.length === 0) {
    topologyEmpty.classList.remove("hidden");
    return;
  }

  topologyEmpty.classList.add("hidden");

  const positions = calculatePositions(visibleSensors);

  for (const edge of visibleEdges) {
    const start = positions.get(edge.nodeAId);
    const end = positions.get(edge.nodeBId);

    if (!start || !end) continue;

    drawEdge(edge, start, end);
  }

  for (const sensor of visibleSensors) {
    const position = positions.get(sensor.id);

    if (!position) continue;

    drawNode(sensor, position);
  }
}

function calculatePositions(visibleSensors) {
  const positions = new Map();

  if (visibleSensors.length === 1) {
    positions.set(visibleSensors[0].id, {
      x: 50,
      y: 50
    });

    return positions;
  }

  const sensorsWithPosition = visibleSensors.filter(sensor => {
    return Number.isFinite(Number(sensor.x)) &&
      Number.isFinite(Number(sensor.y)) &&
      sensor.x !== null &&
      sensor.y !== null;
  });

  if (
    sensorsWithPosition.length === visibleSensors.length &&
    hasCoordinateVariation(sensorsWithPosition)
  ) {
    return calculateRealPositions(visibleSensors);
  }

  if (visibleSensors.length <= 4) {
    visibleSensors.forEach((sensor, index) => {
      const spacing = 70 / (visibleSensors.length - 1);

      positions.set(sensor.id, {
        x: 15 + spacing * index,
        y: 50
      });
    });

    return positions;
  }

  const centerX = 50;
  const centerY = 50;
  const radiusX = 36;
  const radiusY = 32;

  visibleSensors.forEach((sensor, index) => {
    const angle =
      (Math.PI * 2 * index) /
        visibleSensors.length -
      Math.PI / 2;

    positions.set(sensor.id, {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY
    });
  });

  return positions;
}

function hasCoordinateVariation(items) {
  const xValues = new Set(items.map(sensor => Number(sensor.x)));
  const yValues = new Set(items.map(sensor => Number(sensor.y)));

  return xValues.size > 1 || yValues.size > 1;
}

function calculateRealPositions(items) {
  const positions = new Map();

  const xs = items.map(sensor => Number(sensor.x));
  const ys = items.map(sensor => Number(sensor.y));

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  for (const sensor of items) {
    const normalizedX =
      (Number(sensor.x) - minX) / rangeX;

    const normalizedY =
      (Number(sensor.y) - minY) / rangeY;

    positions.set(sensor.id, {
      x: 15 + normalizedX * 70,
      y: 18 + normalizedY * 64
    });
  }

  return positions;
}

function drawEdge(edge, start, end) {
  const line = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );

  line.setAttribute("x1", `${start.x}%`);
  line.setAttribute("y1", `${start.y}%`);
  line.setAttribute("x2", `${end.x}%`);
  line.setAttribute("y2", `${end.y}%`);
  line.setAttribute("class", "topology-edge");

  topologyLines.appendChild(line);

  if (edge.distance !== null && edge.distance !== undefined) {
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

    label.setAttribute(
      "x",
      `${(start.x + end.x) / 2}%`
    );

    label.setAttribute(
      "y",
      `${(start.y + end.y) / 2 - 3}%`
    );

    label.setAttribute(
      "class",
      "topology-edge-label"
    );

    label.textContent = `${edge.distance} m`;

    topologyLines.appendChild(label);
  }
}

function drawNode(sensor, position) {
  const presence = getPresence(sensor.code);
  const diagnostic = getDiagnostic(sensor.code);

  const environment =
    sensor.environment?.name ??
    "Sem ambiente";

  const node = document.createElement("article");

  node.className = `
    topology-node
    ${presence.toLowerCase()}
  `.trim();

  node.style.left = `${position.x}%`;
  node.style.top = `${position.y}%`;

  node.innerHTML = `
    <div class="topology-node-header">
      <div class="topology-node-icon">
        N
      </div>

      <span class="topology-presence ${presence.toLowerCase()}">
        <i></i>
        ${formatPresence(presence)}
      </span>
    </div>

    <div class="topology-node-body">
      <strong>${escapeHtml(sensor.code)}</strong>
      <span>${escapeHtml(sensor.name ?? "Sensor NAVESCENCE")}</span>
    </div>

    <div class="topology-node-meta">
      <span>${escapeHtml(environment)}</span>
      <span>${escapeHtml(formatDiagnostic(diagnostic))}</span>
    </div>
  `;

  topologyNodes.appendChild(node);
}

function renderEdges() {
  const environmentId = topologyEnvironmentFilter.value;

  let visibleEdges = [...topology];

  if (environmentId !== "ALL") {
    const allowedIds = new Set(
      sensors
        .filter(sensor => String(sensor.environmentId) === environmentId)
        .map(sensor => sensor.id)
    );

    visibleEdges = topology.filter(edge => {
      return allowedIds.has(edge.nodeAId) &&
        allowedIds.has(edge.nodeBId);
    });
  }

  if (visibleEdges.length === 0) {
    topologyEdgesBody.innerHTML = `
      <tr>
        <td colspan="5" class="loading-cell">
          Nenhuma conexão configurada.
        </td>
      </tr>
    `;

    return;
  }

  topologyEdgesBody.innerHTML = visibleEdges
    .map(edge => {
      return `
        <tr>
          <td>
            <span class="sensor-code">
              ${escapeHtml(edge.nodeA?.code ?? "—")}
            </span>
          </td>

          <td>
            <span class="sensor-code">
              ${escapeHtml(edge.nodeB?.code ?? "—")}
            </span>
          </td>

          <td>
            ${
              edge.distance !== null &&
              edge.distance !== undefined
                ? `${escapeHtml(edge.distance)} m`
                : "—"
            }
          </td>

          <td>
            ${escapeHtml(edge.nodeA?.environment?.name ?? getEnvironmentName(edge.nodeA?.environmentId))}
          </td>

          <td>
            ${escapeHtml(edge.nodeB?.environment?.name ?? getEnvironmentName(edge.nodeB?.environmentId))}
          </td>
        </tr>
      `;
    })
    .join("");
}

function updateTopologyTitle(environmentId) {
  if (environmentId === "ALL") {
    topologyTitle.textContent = "Todos os ambientes";
    return;
  }

  const environment = environments.find(item => {
    return String(item.id) === environmentId;
  });

  topologyTitle.textContent =
    environment?.name ??
    "Ambiente";
}

function getPresence(code) {
  const node = dashboard?.nodes?.[code];

  return node?.presence ??
    "DESCONHECIDO";
}

function getDiagnostic(code) {
  const node = dashboard?.nodes?.[code];

  return node?.diagnostic ??
    "DESCONHECIDO";
}

function getEnvironmentName(id) {
  if (!id) return "—";

  const environment = environments.find(item => {
    return item.id === id;
  });

  return environment?.name ?? "—";
}

function formatPresence(presence) {
  const values = {
    ONLINE: "Online",
    OFFLINE: "Offline",
    DESCONHECIDO: "Desconhecido"
  };

  return values[presence] ?? presence;
}

function formatDiagnostic(diagnostic) {
  const values = {
    OK: "Operacional",
    VERIFICANDO: "Verificando",
    NO_INDISPONIVEL: "Indisponível",
    VIZINHO_NAO_DETECTADO: "Vizinho não detectado",
    DESCONHECIDO: "Aguardando diagnóstico"
  };

  return values[diagnostic] ??
    diagnostic;
}

function renderUpdatedAt() {
  const value =
    dashboard?.updatedAt ??
    new Date().toISOString();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    topologyUpdatedAt.textContent = "—";
    return;
  }

  topologyUpdatedAt.textContent =
    date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
}

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

topologyEnvironmentFilter.addEventListener(
  "change",
  () => {
    renderTopology();
    renderEdges();
  }
);

refreshTopologyButton.addEventListener(
  "click",
  loadTopology
);

loadTopology();

setInterval(() => {
  loadTopology();
}, 10000);