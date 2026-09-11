let sensors = [];
let environments = [];
let topology = [];
let editingSensor = null;

const registeredSensorsBody = document.getElementById("registeredSensorsBody");
const registeredCount = document.getElementById("registeredCount");
const activeCount = document.getElementById("activeCount");
const maintenanceCount = document.getElementById("maintenanceCount");
const inactiveCount = document.getElementById("inactiveCount");

const registeredSensorSearch = document.getElementById("registeredSensorSearch");
const registeredSensorStatus = document.getElementById("registeredSensorStatus");

const newSensorButton = document.getElementById("newSensorButton");
const sensorModalOverlay = document.getElementById("sensorModalOverlay");
const sensorModal = document.getElementById("sensorModal");
const closeSensorModal = document.getElementById("closeSensorModal");
const cancelSensorButton = document.getElementById("cancelSensorButton");

const sensorModalTitle = document.getElementById("sensorModalTitle");
const sensorForm = document.getElementById("sensorForm");
const sensorFormError = document.getElementById("sensorFormError");
const sensorNeighbors = document.getElementById("sensorNeighbors");

const sensorId = document.getElementById("sensorId");
const sensorCode = document.getElementById("sensorCode");
const sensorMac = document.getElementById("sensorMac");
const sensorName = document.getElementById("sensorName");
const sensorEnvironment = document.getElementById("sensorEnvironment");
const sensorLocation = document.getElementById("sensorLocation");
const sensorX = document.getElementById("sensorX");
const sensorY = document.getElementById("sensorY");
const sensorActive = document.getElementById("sensorActive");
const sensorMaintenance = document.getElementById("sensorMaintenance");

const saveSensorButton = document.getElementById("saveSensorButton");
const toast = document.getElementById("toast");

async function loadData() {
  try {
    const [sensorsResponse, environmentsResponse, topologyResponse] = await Promise.all([
      fetch("/api/sensors"),
      fetch("/api/environments"),
      fetch("/api/topology")
    ]);

    if (!sensorsResponse.ok) throw new Error("Não foi possível carregar os sensores.");
    if (!environmentsResponse.ok) throw new Error("Não foi possível carregar os ambientes.");
    if (!topologyResponse.ok) throw new Error("Não foi possível carregar a topologia.");

    sensors = await sensorsResponse.json();
    environments = await environmentsResponse.json();
    topology = await topologyResponse.json();

    renderEnvironmentOptions();
    renderSummary();
    renderSensors();
  } catch (error) {
    registeredSensorsBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-table">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

function renderSummary() {
  registeredCount.textContent = sensors.length;

  activeCount.textContent = sensors.filter(sensor => {
    return sensor.active && !sensor.maintenance;
  }).length;

  maintenanceCount.textContent = sensors.filter(sensor => {
    return sensor.maintenance;
  }).length;

  inactiveCount.textContent = sensors.filter(sensor => {
    return !sensor.active;
  }).length;
}

function renderEnvironmentOptions(selectedId = null) {
  sensorEnvironment.innerHTML = `
    <option value="">Nenhum ambiente</option>
  `;

  for (const environment of environments) {
    const option = document.createElement("option");

    option.value = environment.id;
    option.textContent = environment.name;

    if (Number(selectedId) === environment.id) {
      option.selected = true;
    }

    sensorEnvironment.appendChild(option);
  }
}

function getNeighborCodes(code) {
  const neighbors = [];

  for (const edge of topology) {
    if (edge.nodeA?.code === code) {
      neighbors.push(edge.nodeB.code);
    } else if (edge.nodeB?.code === code) {
      neighbors.push(edge.nodeA.code);
    }
  }

  return neighbors;
}

function renderSensors() {
  const query = registeredSensorSearch.value.trim().toLowerCase();
  const status = registeredSensorStatus.value;

  let filtered = [...sensors];

  if (query) {
    filtered = filtered.filter(sensor => {
      const neighbors = getNeighborCodes(sensor.code).join(" ");

      const text = `
        ${sensor.code}
        ${sensor.name ?? ""}
        ${sensor.mac ?? ""}
        ${sensor.environment?.name ?? ""}
        ${sensor.environment?.code ?? ""}
        ${sensor.location ?? ""}
        ${neighbors}
      `.toLowerCase();

      return text.includes(query);
    });
  }

  if (status === "ACTIVE") {
    filtered = filtered.filter(sensor => {
      return sensor.active && !sensor.maintenance;
    });
  }

  if (status === "MAINTENANCE") {
    filtered = filtered.filter(sensor => sensor.maintenance);
  }

  if (status === "INACTIVE") {
    filtered = filtered.filter(sensor => !sensor.active);
  }

  registeredSensorsBody.innerHTML = "";

  if (filtered.length === 0) {
    registeredSensorsBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-table">
          Nenhum sensor encontrado.
        </td>
      </tr>
    `;

    return;
  }

  for (const sensor of filtered) {
    registeredSensorsBody.appendChild(createSensorRow(sensor));
  }
}

function createSensorRow(sensor) {
  const row = document.createElement("tr");

  const status = getSensorStatus(sensor);

  const position =
    sensor.x !== null &&
    sensor.x !== undefined &&
    sensor.y !== null &&
    sensor.y !== undefined
      ? `${sensor.x}, ${sensor.y}`
      : "—";

  const neighbors = getNeighborCodes(sensor.code);

  row.innerHTML = `
    <td>
      <span class="sensor-code">
        ${escapeHtml(sensor.code)}
      </span>

      <span class="sensor-sub">
        ${escapeHtml(sensor.name ?? "Sem nome")}
      </span>
    </td>

    <td>
      ${escapeHtml(sensor.mac ?? "—")}
    </td>

    <td>
      ${
        sensor.environment
          ? `
            <span class="sensor-code">
              ${escapeHtml(sensor.environment.name)}
            </span>

            <span class="sensor-sub">
              ${escapeHtml(sensor.environment.floor ?? "")}
            </span>
          `
          : "—"
      }
    </td>

    <td>
      ${escapeHtml(sensor.location ?? "—")}
    </td>

    <td>
      ${escapeHtml(position)}
    </td>

    <td>
      ${
        neighbors.length
          ? neighbors
              .map(code => {
                return `
                  <span class="neighbor-badge">
                    ${escapeHtml(code)}
                  </span>
                `;
              })
              .join("")
          : "—"
      }
    </td>

    <td>
      <span class="badge ${status.className}">
        ${status.text}
      </span>
    </td>

    <td>
      ${formatDate(sensor.updatedAt)}
    </td>

    <td>
      <button class="table-action-button" type="button">
        Editar
      </button>
    </td>
  `;

  row
    .querySelector(".table-action-button")
    .addEventListener("click", () => openEditSensor(sensor.id));

  return row;
}

function getSensorStatus(sensor) {
  if (!sensor.active) {
    return {
      text: "Inativo",
      className: "offline"
    };
  }

  if (sensor.maintenance) {
    return {
      text: "Manutenção",
      className: "verifying"
    };
  }

  return {
    text: "Ativo",
    className: "online"
  };
}

function renderNeighborOptions(currentCode = null, selected = []) {
  const available = sensors.filter(sensor => {
    return sensor.code !== currentCode;
  });

  if (available.length === 0) {
    sensorNeighbors.innerHTML = `
      <span class="neighbors-empty">
        Nenhum outro sensor cadastrado.
      </span>
    `;

    return;
  }

  sensorNeighbors.innerHTML = available
    .map(sensor => {
      return `
        <label class="neighbor-option">
          <input
            type="checkbox"
            name="sensorNeighbor"
            value="${escapeHtml(sensor.code)}"
            ${selected.includes(sensor.code) ? "checked" : ""}
          >

          <span>
            <strong>
              ${escapeHtml(sensor.code)}
            </strong>

            <small>
              ${escapeHtml(sensor.name ?? "Sensor NAVESCENCE")}
            </small>
          </span>
        </label>
      `;
    })
    .join("");
}

function getSelectedNeighbors() {
  return [
    ...document.querySelectorAll(
      'input[name="sensorNeighbor"]:checked'
    )
  ].map(input => input.value);
}

function openNewSensor() {
  editingSensor = null;

  sensorForm.reset();

  sensorId.value = "";
  sensorActive.checked = true;
  sensorMaintenance.checked = false;

  sensorModalTitle.textContent = "Novo sensor";
  sensorFormError.classList.add("hidden");

  renderEnvironmentOptions();
  renderNeighborOptions();

  openModal();
}

function openEditSensor(id) {
  const sensor = sensors.find(item => item.id === id);

  if (!sensor) return;

  editingSensor = sensor;

  sensorId.value = sensor.id;
  sensorCode.value = sensor.code;
  sensorMac.value = sensor.mac ?? "";
  sensorName.value = sensor.name ?? "";
  sensorLocation.value = sensor.location ?? "";
  sensorX.value = sensor.x ?? "";
  sensorY.value = sensor.y ?? "";

  sensorActive.checked = sensor.active;
  sensorMaintenance.checked = sensor.maintenance;

  renderEnvironmentOptions(sensor.environmentId);

  renderNeighborOptions(
    sensor.code,
    getNeighborCodes(sensor.code)
  );

  sensorModalTitle.textContent = `Editar ${sensor.code}`;
  sensorFormError.classList.add("hidden");

  openModal();
}

function openModal() {
  sensorModal.classList.add("open");
  sensorModalOverlay.classList.add("open");
}

function hideModal() {
  sensorModal.classList.remove("open");
  sensorModalOverlay.classList.remove("open");
}

sensorForm.addEventListener("submit", async event => {
  event.preventDefault();

  const environmentId =
    sensorEnvironment.value === ""
      ? null
      : Number(sensorEnvironment.value);

  const data = {
    code: sensorCode.value.trim(),
    mac: sensorMac.value.trim() || null,
    name: sensorName.value.trim() || null,
    environmentId,
    location: sensorLocation.value.trim() || null,
    x: sensorX.value === "" ? null : Number(sensorX.value),
    y: sensorY.value === "" ? null : Number(sensorY.value),
    active: sensorActive.checked,
    maintenance: sensorMaintenance.checked
  };

  const neighbors = getSelectedNeighbors();

  const url = editingSensor
    ? `/api/sensors/${editingSensor.id}`
    : "/api/sensors";

  const method = editingSensor
    ? "PUT"
    : "POST";

  saveSensorButton.disabled = true;
  saveSensorButton.textContent = "Salvando...";

  sensorFormError.classList.add("hidden");

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      sensorFormError.textContent =
        result.error ??
        "Não foi possível salvar o sensor.";

      sensorFormError.classList.remove("hidden");

      return;
    }

    const neighborsResponse = await fetch(
      `/api/sensors/${result.id}/neighbors`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          neighbors
        })
      }
    );

    const neighborsResult = await neighborsResponse.json();

    if (!neighborsResponse.ok) {
      sensorFormError.textContent =
        neighborsResult.error ??
        "O sensor foi salvo, mas não foi possível atualizar os vizinhos.";

      sensorFormError.classList.remove("hidden");

      return;
    }

    hideModal();

    showToast(
      editingSensor
        ? "Sensor atualizado com sucesso."
        : "Sensor cadastrado com sucesso."
    );

    await loadData();
  } catch {
    sensorFormError.textContent =
      "Não foi possível conectar ao sistema.";

    sensorFormError.classList.remove("hidden");
  } finally {
    saveSensorButton.disabled = false;
    saveSensorButton.textContent = "Salvar sensor";
  }
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
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

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

newSensorButton.addEventListener(
  "click",
  openNewSensor
);

closeSensorModal.addEventListener(
  "click",
  hideModal
);

cancelSensorButton.addEventListener(
  "click",
  hideModal
);

sensorModalOverlay.addEventListener(
  "click",
  hideModal
);

registeredSensorSearch.addEventListener(
  "input",
  renderSensors
);

registeredSensorStatus.addEventListener(
  "change",
  renderSensors
);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    hideModal();
  }
});

loadData();