let pois = [];
let sensors = [];

const totalPoiCount = document.getElementById("totalPoiCount");
const activePoiCount = document.getElementById("activePoiCount");
const inactivePoiCount = document.getElementById("inactivePoiCount");
const poiTypeCount = document.getElementById("poiTypeCount");

const poiSearch = document.getElementById("poiSearch");
const poiStatusFilter = document.getElementById("poiStatusFilter");
const poiTypeFilter = document.getElementById("poiTypeFilter");

const visiblePoiCount = document.getElementById("visiblePoiCount");
const poiTableBody = document.getElementById("poiTableBody");

const newPoiButton = document.getElementById("newPoiButton");

const poiModalOverlay = document.getElementById("poiModalOverlay");
const poiModalTitle = document.getElementById("poiModalTitle");
const closePoiModal = document.getElementById("closePoiModal");
const cancelPoiButton = document.getElementById("cancelPoiButton");

const poiForm = document.getElementById("poiForm");
const poiId = document.getElementById("poiId");
const poiCode = document.getElementById("poiCode");
const poiName = document.getElementById("poiName");
const poiType = document.getElementById("poiType");
const poiNode = document.getElementById("poiNode");
const poiDescription = document.getElementById("poiDescription");
const poiActive = document.getElementById("poiActive");
const poiFormMessage = document.getElementById("poiFormMessage");
const savePoiButton = document.getElementById("savePoiButton");

async function loadData() {
  try {
    const [poisResponse, sensorsResponse] = await Promise.all([
      fetch("/api/pois"),
      fetch("/api/sensors")
    ]);

    if (!poisResponse.ok) {
      throw new Error("Não foi possível carregar os pontos de interesse.");
    }

    if (!sensorsResponse.ok) {
      throw new Error("Não foi possível carregar os sensores.");
    }

    pois = await poisResponse.json();
    sensors = await sensorsResponse.json();

    renderSummary();
    renderTypeFilter();
    renderSensorOptions();
    renderPois();
  } catch (error) {
    poiTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-cell">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

function renderSummary() {
  totalPoiCount.textContent = pois.length;

  activePoiCount.textContent = pois.filter(poi => {
    return poi.active;
  }).length;

  inactivePoiCount.textContent = pois.filter(poi => {
    return !poi.active;
  }).length;

  poiTypeCount.textContent = new Set(
    pois.map(poi => poi.type)
  ).size;
}

function renderTypeFilter() {
  const selected = poiTypeFilter.value;

  const types = [
    ...new Set(
      pois
        .map(poi => poi.type)
        .filter(Boolean)
    )
  ].sort();

  poiTypeFilter.innerHTML = `
    <option value="ALL">
      Todos os tipos
    </option>
  `;

  for (const type of types) {
    const option = document.createElement("option");

    option.value = type;
    option.textContent = formatType(type);

    poiTypeFilter.appendChild(option);
  }

  poiTypeFilter.value =
    types.includes(selected)
      ? selected
      : "ALL";
}

function renderSensorOptions() {
  const selected = poiNode.value;

  poiNode.innerHTML = `
    <option value="">
      Selecione o sensor
    </option>
  `;

  for (const sensor of sensors) {
    const option = document.createElement("option");

    option.value = sensor.id;

    const environment =
      sensor.environment?.name
        ? ` · ${sensor.environment.name}`
        : "";

    option.textContent =
      `${sensor.code} · ${sensor.name ?? "Sem nome"}${environment}`;

    poiNode.appendChild(option);
  }

  if (
    selected &&
    [...poiNode.options].some(option => option.value === selected)
  ) {
    poiNode.value = selected;
  }
}

function getFilteredPois() {
  const search =
    poiSearch.value
      .trim()
      .toLowerCase();

  const status =
    poiStatusFilter.value;

  const type =
    poiTypeFilter.value;

  return pois.filter(poi => {
    if (search) {
      const text = `
        ${poi.code}
        ${poi.name}
        ${poi.type}
        ${poi.description ?? ""}
        ${poi.node?.code ?? ""}
        ${poi.node?.name ?? ""}
        ${poi.node?.environment?.name ?? ""}
      `.toLowerCase();

      if (!text.includes(search)) {
        return false;
      }
    }

    if (
      status === "ACTIVE" &&
      !poi.active
    ) {
      return false;
    }

    if (
      status === "INACTIVE" &&
      poi.active
    ) {
      return false;
    }

    if (
      type !== "ALL" &&
      poi.type !== type
    ) {
      return false;
    }

    return true;
  });
}

function renderPois() {
  const filtered =
    getFilteredPois();

  visiblePoiCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? "ponto" : "pontos"}`;

  if (filtered.length === 0) {
    poiTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="poi-empty-cell">
          <strong>Nenhum ponto de interesse encontrado</strong>
          <span>Cadastre um ponto para utilizá-lo como destino de navegação.</span>
        </td>
      </tr>
    `;

    return;
  }

  poiTableBody.innerHTML = filtered.map(poi => {
    return `
      <tr>
        <td>
          <span class="poi-name">
            ${escapeHtml(poi.name)}
          </span>

          <span class="poi-code">
            ${escapeHtml(poi.code)}
          </span>
        </td>

        <td>
          <span class="poi-type-badge">
            ${escapeHtml(formatType(poi.type))}
          </span>
        </td>

        <td>
          <span class="poi-node-code">
            ${escapeHtml(poi.node?.code ?? "—")}
          </span>

          <span class="poi-node-name">
            ${escapeHtml(poi.node?.name ?? "")}
          </span>
        </td>

        <td>
          ${escapeHtml(
            poi.node?.environment?.name ?? "—"
          )}
        </td>

        <td>
          <span class="poi-status ${poi.active ? "active" : "inactive"}">
            ${poi.active ? "Ativo" : "Inativo"}
          </span>
        </td>

        <td>
          <div class="poi-actions">
            <button
              class="poi-action-button edit"
              type="button"
              data-action="edit"
              data-id="${poi.id}"
            >
              Editar
            </button>

            <button
              class="poi-action-button toggle"
              type="button"
              data-action="toggle"
              data-id="${poi.id}"
            >
              ${poi.active ? "Desativar" : "Ativar"}
            </button>

            <button
              class="poi-action-button delete"
              type="button"
              data-action="delete"
              data-id="${poi.id}"
            >
              Excluir
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  bindTableActions();
}

function bindTableActions() {
  document.querySelectorAll("[data-action='edit']").forEach(button => {
    button.addEventListener("click", () => {
      openEditModal(Number(button.dataset.id));
    });
  });

  document.querySelectorAll("[data-action='toggle']").forEach(button => {
    button.addEventListener("click", () => {
      togglePoi(Number(button.dataset.id));
    });
  });

  document.querySelectorAll("[data-action='delete']").forEach(button => {
    button.addEventListener("click", () => {
      deletePoi(Number(button.dataset.id));
    });
  });
}

function openNewModal() {
  poiForm.reset();

  poiId.value = "";
  poiActive.checked = true;

  poiModalTitle.textContent =
    "Novo ponto de interesse";

  savePoiButton.textContent =
    "Salvar ponto";

  poiFormMessage.textContent = "";
  poiFormMessage.className = "poi-form-message";

  renderSensorOptions();

  poiModalOverlay.classList.add("open");

  setTimeout(() => {
    poiCode.focus();
  }, 50);
}

function openEditModal(id) {
  const poi = pois.find(item => item.id === id);

  if (!poi) return;

  poiId.value = poi.id;
  poiCode.value = poi.code;
  poiName.value = poi.name;
  poiType.value = poi.type;
  poiDescription.value = poi.description ?? "";
  poiActive.checked = poi.active;

  renderSensorOptions();

  poiNode.value = String(poi.nodeId);

  poiModalTitle.textContent =
    `Editar ${poi.name}`;

  savePoiButton.textContent =
    "Salvar alterações";

  poiFormMessage.textContent = "";
  poiFormMessage.className = "poi-form-message";

  poiModalOverlay.classList.add("open");
}

function closeModal() {
  poiModalOverlay.classList.remove("open");
}

async function savePoi(event) {
  event.preventDefault();

  const id =
    Number(poiId.value);

  const data = {
    code: poiCode.value,
    name: poiName.value,
    type: poiType.value,
    description: poiDescription.value,
    nodeId: Number(poiNode.value),
    active: poiActive.checked
  };

  try {
    savePoiButton.disabled = true;
    savePoiButton.textContent = "Salvando...";

    const response = await fetch(
      id
        ? `/api/pois/${id}`
        : "/api/pois",
      {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      }
    );

    const result =
      response.status === 204
        ? null
        : await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ??
        "Não foi possível salvar o ponto de interesse."
      );
    }

    closeModal();

    await loadData();
  } catch (error) {
    poiFormMessage.textContent =
      error.message;

    poiFormMessage.className =
      "poi-form-message error";
  } finally {
    savePoiButton.disabled = false;

    savePoiButton.textContent =
      id
        ? "Salvar alterações"
        : "Salvar ponto";
  }
}

async function togglePoi(id) {
  const poi = pois.find(item => item.id === id);

  if (!poi) return;

  try {
    const response = await fetch(
      `/api/pois/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          active: !poi.active
        })
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ??
        "Não foi possível alterar o estado do ponto."
      );
    }

    await loadData();
  } catch (error) {
    window.alert(error.message);
  }
}

async function deletePoi(id) {
  const poi = pois.find(item => item.id === id);

  if (!poi) return;

  const confirmed = window.confirm(
    `Excluir o ponto de interesse "${poi.name}"?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `/api/pois/${id}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      const result =
        await response.json();

      throw new Error(
        result?.error ??
        "Não foi possível excluir o ponto."
      );
    }

    await loadData();
  } catch (error) {
    window.alert(error.message);
  }
}

function formatType(value) {
  const values = {
    ENTRADA: "Entrada",
    SERVICO: "Serviço",
    BANHEIRO: "Banheiro",
    SALA: "Sala",
    ACESSIBILIDADE: "Acessibilidade",
    REFERENCIA: "Referência",
    OUTRO: "Outro"
  };

  return values[value] ?? value;
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

newPoiButton.addEventListener(
  "click",
  openNewModal
);

closePoiModal.addEventListener(
  "click",
  closeModal
);

cancelPoiButton.addEventListener(
  "click",
  closeModal
);

poiModalOverlay.addEventListener(
  "click",
  event => {
    if (event.target === poiModalOverlay) {
      closeModal();
    }
  }
);

poiForm.addEventListener(
  "submit",
  savePoi
);

poiSearch.addEventListener(
  "input",
  renderPois
);

poiStatusFilter.addEventListener(
  "change",
  renderPois
);

poiTypeFilter.addEventListener(
  "change",
  renderPois
);

document.addEventListener(
  "keydown",
  event => {
    if (event.key === "Escape") {
      closeModal();
    }
  }
);

loadData();