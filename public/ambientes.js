let environments = [];
let editingEnvironment = null;

const environmentGrid = document.getElementById("environmentGrid");
const environmentCount = document.getElementById("environmentCount");
const linkedSensorCount = document.getElementById("linkedSensorCount");
const emptyEnvironmentCount = document.getElementById("emptyEnvironmentCount");
const environmentSearch = document.getElementById("environmentSearch");
const newEnvironmentButton = document.getElementById("newEnvironmentButton");
const environmentModal = document.getElementById("environmentModal");
const environmentModalOverlay = document.getElementById("environmentModalOverlay");
const closeEnvironmentModal = document.getElementById("closeEnvironmentModal");
const cancelEnvironmentButton = document.getElementById("cancelEnvironmentButton");
const deleteEnvironmentButton = document.getElementById("deleteEnvironmentButton");
const saveEnvironmentButton = document.getElementById("saveEnvironmentButton");
const environmentModalTitle = document.getElementById("environmentModalTitle");
const environmentForm = document.getElementById("environmentForm");
const environmentFormError = document.getElementById("environmentFormError");
const environmentId = document.getElementById("environmentId");
const environmentCode = document.getElementById("environmentCode");
const environmentName = document.getElementById("environmentName");
const environmentType = document.getElementById("environmentType");
const environmentFloor = document.getElementById("environmentFloor");
const environmentDescription = document.getElementById("environmentDescription");
const toast = document.getElementById("toast");

async function loadEnvironments() {
  try {
    const response = await fetch("/api/environments");
    if (!response.ok) throw new Error("Não foi possível carregar os ambientes.");

    environments = await response.json();

    renderSummary();
    renderEnvironments();
  } catch (error) {
    environmentGrid.innerHTML = `<div class="environment-empty">${escapeHtml(error.message)}</div>`;
  }
}

function renderSummary() {
  environmentCount.textContent = environments.length;

  const linked = environments.reduce((total, environment) => {
    return total + (environment._count?.nodes ?? 0);
  }, 0);

  linkedSensorCount.textContent = linked;
  emptyEnvironmentCount.textContent = environments.filter(environment => (environment._count?.nodes ?? 0) === 0).length;
}

function renderEnvironments() {
  const query = environmentSearch.value.trim().toLowerCase();

  const filtered = environments.filter(environment => {
    const text = `${environment.code} ${environment.name} ${environment.type ?? ""} ${environment.floor ?? ""}`.toLowerCase();
    return text.includes(query);
  });

  if (filtered.length === 0) {
    environmentGrid.innerHTML = `
      <div class="environment-empty">
        <strong>Nenhum ambiente encontrado</strong>
        <span>Cadastre o primeiro ambiente da infraestrutura.</span>
      </div>
    `;
    return;
  }

  environmentGrid.innerHTML = filtered.map(environment => {
    const sensorCount = environment._count?.nodes ?? 0;

    return `
      <article class="environment-card">
        <div class="environment-card-top">
          <div class="environment-icon">${getInitials(environment.name)}</div>

          <button class="environment-edit" type="button" data-id="${environment.id}">
            Editar
          </button>
        </div>

        <div class="environment-card-content">
          <span class="environment-code">${escapeHtml(environment.code)}</span>
          <h3>${escapeHtml(environment.name)}</h3>

          <div class="environment-tags">
            <span>${escapeHtml(formatType(environment.type))}</span>
            <span>${escapeHtml(environment.floor ?? "Térreo")}</span>
          </div>

          <p>${escapeHtml(environment.description ?? "Sem descrição cadastrada.")}</p>
        </div>

        <div class="environment-card-footer">
          <div>
            <strong>${sensorCount}</strong>
            <span>${sensorCount === 1 ? "sensor vinculado" : "sensores vinculados"}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".environment-edit").forEach(button => {
    button.addEventListener("click", () => openEditEnvironment(Number(button.dataset.id)));
  });
}

function openNewEnvironment() {
  editingEnvironment = null;
  environmentForm.reset();
  environmentId.value = "";
  environmentFloor.value = "Térreo";
  environmentModalTitle.textContent = "Novo ambiente";
  deleteEnvironmentButton.classList.add("hidden");
  environmentFormError.classList.add("hidden");
  openModal();
}

async function openEditEnvironment(id) {
  try {
    const response = await fetch(`/api/environments/${id}`);
    if (!response.ok) throw new Error("Não foi possível carregar o ambiente.");

    const environment = await response.json();

    editingEnvironment = environment;
    environmentId.value = environment.id;
    environmentCode.value = environment.code;
    environmentName.value = environment.name;
    environmentType.value = environment.type ?? "";
    environmentFloor.value = environment.floor ?? "Térreo";
    environmentDescription.value = environment.description ?? "";
    environmentModalTitle.textContent = `Editar ${environment.name}`;
    environmentFormError.classList.add("hidden");
    deleteEnvironmentButton.classList.remove("hidden");

    openModal();
  } catch (error) {
    showToast(error.message);
  }
}

function openModal() {
  environmentModal.classList.add("open");
  environmentModalOverlay.classList.add("open");
}

function hideModal() {
  environmentModal.classList.remove("open");
  environmentModalOverlay.classList.remove("open");
}

environmentForm.addEventListener("submit", async event => {
  event.preventDefault();

  const data = {
    code: environmentCode.value.trim(),
    name: environmentName.value.trim(),
    type: environmentType.value || null,
    floor: environmentFloor.value.trim() || "Térreo",
    description: environmentDescription.value.trim() || null
  };

  const url = editingEnvironment ? `/api/environments/${editingEnvironment.id}` : "/api/environments";
  const method = editingEnvironment ? "PUT" : "POST";

  saveEnvironmentButton.disabled = true;
  saveEnvironmentButton.textContent = "Salvando...";
  environmentFormError.classList.add("hidden");

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      environmentFormError.textContent = result.error ?? "Não foi possível salvar o ambiente.";
      environmentFormError.classList.remove("hidden");
      return;
    }

    hideModal();
    showToast(editingEnvironment ? "Ambiente atualizado." : "Ambiente cadastrado.");
    await loadEnvironments();
  } catch {
    environmentFormError.textContent = "Não foi possível conectar ao sistema.";
    environmentFormError.classList.remove("hidden");
  } finally {
    saveEnvironmentButton.disabled = false;
    saveEnvironmentButton.textContent = "Salvar ambiente";
  }
});

deleteEnvironmentButton.addEventListener("click", async () => {
  if (!editingEnvironment) return;

  const confirmed = window.confirm(`Excluir o ambiente ${editingEnvironment.name}?`);
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/environments/${editingEnvironment.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error ?? "Não foi possível excluir o ambiente.");
    }

    hideModal();
    showToast("Ambiente excluído.");
    await loadEnvironments();
  } catch (error) {
    environmentFormError.textContent = error.message;
    environmentFormError.classList.remove("hidden");
  }
});

function formatType(type) {
  const types = {
    CORREDOR: "Corredor",
    SALA: "Sala",
    RECEPCAO: "Recepção",
    BIBLIOTECA: "Biblioteca",
    AREA_COMUM: "Área comum",
    OUTRO: "Outro"
  };

  return types[type] ?? "Não definido";
}

function getInitials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
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

newEnvironmentButton.addEventListener("click", openNewEnvironment);
closeEnvironmentModal.addEventListener("click", hideModal);
cancelEnvironmentButton.addEventListener("click", hideModal);
environmentModalOverlay.addEventListener("click", hideModal);
environmentSearch.addEventListener("input", renderEnvironments);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") hideModal();
});

loadEnvironments();