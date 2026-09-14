let alerts = [];
let selectedAlertId = null;

const activeAlertCount = document.getElementById("activeAlertCount");
const criticalAlertCount = document.getElementById("criticalAlertCount");
const resolvedAlertCount = document.getElementById("resolvedAlertCount");
const totalAlertCount = document.getElementById("totalAlertCount");

const alertSearch = document.getElementById("alertSearch");
const alertStatusFilter = document.getElementById("alertStatusFilter");
const alertSeverityFilter = document.getElementById("alertSeverityFilter");
const alertTypeFilter = document.getElementById("alertTypeFilter");

const visibleAlertsCount = document.getElementById("visibleAlertsCount");
const alertsList = document.getElementById("alertsList");
const refreshAlertsButton = document.getElementById("refreshAlertsButton");

const alertDrawerOverlay = document.getElementById("alertDrawerOverlay");
const alertDrawer = document.getElementById("alertDrawer");
const closeAlertDrawer = document.getElementById("closeAlertDrawer");
const alertDrawerTitle = document.getElementById("alertDrawerTitle");
const alertDrawerContent = document.getElementById("alertDrawerContent");

async function loadAlerts(showLoading = true) {
  if (showLoading) {
    alertsList.innerHTML = `
      <div class="alerts-loading">
        Carregando alertas...
      </div>
    `;
  }

  try {
    refreshAlertsButton.disabled = true;
    refreshAlertsButton.textContent = "Atualizando...";

    const response = await fetch("/api/alerts?limit=500");

    if (!response.ok) {
      throw new Error("Não foi possível carregar os alertas.");
    }

    const result = await response.json();

    alerts = Array.isArray(result)
      ? result
      : [];

    renderSummary();
    renderAlerts();
  } catch (error) {
    alertsList.innerHTML = `
      <div class="alerts-empty">
        <strong>
          Não foi possível carregar os alertas
        </strong>

        <span>
          ${escapeHtml(error.message)}
        </span>
      </div>
    `;
  } finally {
    refreshAlertsButton.disabled = false;
    refreshAlertsButton.textContent = "Atualizar";
  }
}

function renderSummary() {
  const active = alerts.filter(alert => {
    return alert.status === "ACTIVE";
  });

  const resolved = alerts.filter(alert => {
    return alert.status === "RESOLVED";
  });

  const critical = active.filter(alert => {
    return alert.severity === "CRITICAL";
  });

  activeAlertCount.textContent =
    active.length;

  criticalAlertCount.textContent =
    critical.length;

  resolvedAlertCount.textContent =
    resolved.length;

  totalAlertCount.textContent =
    alerts.length;
}

function renderAlerts() {
  const query =
    alertSearch.value
      .trim()
      .toLowerCase();

  const status =
    alertStatusFilter.value;

  const severity =
    alertSeverityFilter.value;

  const type =
    alertTypeFilter.value;

  let filtered =
    [...alerts];

  if (query) {
    filtered = filtered.filter(alert => {
      const text = `
        ${alert.nodeCode ?? ""}
        ${alert.title ?? ""}
        ${alert.message ?? ""}
        ${formatType(alert.type)}
        ${formatSeverity(alert.severity)}
        ${formatStatus(alert.status)}
      `.toLowerCase();

      return text.includes(query);
    });
  }

  if (status !== "ALL") {
    filtered = filtered.filter(alert => {
      return alert.status === status;
    });
  }

  if (severity !== "ALL") {
    filtered = filtered.filter(alert => {
      return alert.severity === severity;
    });
  }

  if (type !== "ALL") {
    filtered = filtered.filter(alert => {
      return alert.type === type;
    });
  }

  filtered.sort((a, b) => {
    return (
      new Date(b.openedAt).getTime() -
      new Date(a.openedAt).getTime()
    );
  });

  visibleAlertsCount.textContent =
    filtered.length === 1
      ? "1 alerta"
      : `${filtered.length} alertas`;

  if (filtered.length === 0) {
    alertsList.innerHTML = `
      <div class="alerts-empty">
        <strong>
          Nenhum alerta encontrado
        </strong>

        <span>
          Não existem ocorrências para os filtros selecionados.
        </span>
      </div>
    `;

    return;
  }

  alertsList.innerHTML =
    filtered
      .map(createAlertCard)
      .join("");

  document
    .querySelectorAll(".persistent-alert-card")
    .forEach(card => {
      card.addEventListener("click", () => {
        openAlertDrawer(
          Number(card.dataset.alertId)
        );
      });
    });
}

function createAlertCard(alert) {
  const severityClass =
    getSeverityClass(
      alert.severity
    );

  const statusClass =
    getStatusClass(
      alert.status
    );

  return `
    <article
      class="persistent-alert-card ${severityClass}"
      data-alert-id="${alert.id}"
      tabindex="0"
      role="button"
    >
      <div class="persistent-alert-marker">
        !
      </div>

      <div class="persistent-alert-main">
        <div class="persistent-alert-header">
          <div>
            <div class="persistent-alert-labels">
              <span class="alert-status ${statusClass}">
                ${escapeHtml(formatStatus(alert.status))}
              </span>

              <span class="alert-severity ${severityClass}">
                ${escapeHtml(formatSeverity(alert.severity))}
              </span>
            </div>

            <h3>
              ${escapeHtml(alert.title ?? "Alerta")}
            </h3>

            <p>
              ${escapeHtml(alert.message ?? "—")}
            </p>
          </div>
        </div>

        <div class="persistent-alert-meta">
          <span>
            Sensor:
            <strong>
              ${escapeHtml(alert.nodeCode ?? "—")}
            </strong>
          </span>

          <span>
            Tipo:
            <strong>
              ${escapeHtml(formatType(alert.type))}
            </strong>
          </span>

          <span>
            Aberto em:
            <strong>
              ${formatDate(alert.openedAt)}
            </strong>
          </span>

          ${
            alert.status === "RESOLVED"
              ? `
                <span>
                  Resolvido em:
                  <strong>
                    ${formatDate(alert.resolvedAt)}
                  </strong>
                </span>
              `
              : `
                <span>
                  Última ocorrência:
                  <strong>
                    ${formatDate(alert.lastSeenAt)}
                  </strong>
                </span>
              `
          }
        </div>
      </div>
    </article>
  `;
}

async function openAlertDrawer(id) {
  selectedAlertId = id;

  alertDrawer.classList.add("open");
  alertDrawerOverlay.classList.add("open");

  alertDrawerTitle.textContent =
    "Detalhes do alerta";

  alertDrawerContent.innerHTML = `
    <div class="alerts-loading">
      Carregando detalhes...
    </div>
  `;

  try {
    const response = await fetch(
      `/api/alerts/${id}`
    );

    if (!response.ok) {
      throw new Error(
        "Não foi possível carregar os detalhes do alerta."
      );
    }

    const alert =
      await response.json();

    if (selectedAlertId !== id) return;

    renderAlertDrawer(alert);
  } catch (error) {
    alertDrawerContent.innerHTML = `
      <div class="alerts-empty">
        <strong>
          Não foi possível carregar o alerta
        </strong>

        <span>
          ${escapeHtml(error.message)}
        </span>
      </div>
    `;
  }
}

function renderAlertDrawer(alert) {
  alertDrawerTitle.textContent =
    alert.nodeCode
      ? `${alert.nodeCode} · ${formatType(alert.type)}`
      : "Detalhes do alerta";

  const verification =
    alert.verificationRun ??
    null;

  alertDrawerContent.innerHTML = `
    <section class="alert-detail-section">
      <div class="alert-detail-title">
        <h3>
          ${escapeHtml(alert.title ?? "Alerta")}
        </h3>

        <p>
          ${escapeHtml(alert.message ?? "—")}
        </p>
      </div>

      <div class="alert-detail-grid">
        ${detailItem(
          "Sensor",
          alert.nodeCode ?? "—"
        )}

        ${detailItem(
          "Tipo",
          formatType(alert.type)
        )}

        ${detailItem(
          "Severidade",
          formatSeverity(alert.severity)
        )}

        ${detailItem(
          "Estado",
          formatStatus(alert.status)
        )}

        ${detailItem(
          "Aberto em",
          formatDate(alert.openedAt)
        )}

        ${detailItem(
          "Última ocorrência",
          formatDate(alert.lastSeenAt)
        )}

        ${
          alert.resolvedAt
            ? detailItem(
                "Resolvido em",
                formatDate(alert.resolvedAt)
              )
            : ""
        }
      </div>
    </section>

    <section class="alert-detail-section">
      <div class="alert-detail-title">
        <h3>
          Verificação relacionada
        </h3>

        <p>
          Execução do sistema associada a esta ocorrência.
        </p>
      </div>

      ${
        verification
          ? renderVerification(
              verification
            )
          : `
            <div class="alert-no-verification">
              Este alerta não está associado diretamente a uma verificação armazenada.
            </div>
          `
      }
    </section>
  `;
}

function renderVerification(verification) {
  const readings =
    Array.isArray(
      verification.readings
    )
      ? verification.readings
      : [];

  return `
    <div class="alert-detail-grid">
      ${detailItem(
        "ID da verificação",
        `#${verification.id}`
      )}

      ${detailItem(
        "Modo",
        formatVerificationMode(
          verification.mode
        )
      )}

      ${detailItem(
        "Resultado",
        formatVerificationResult(
          verification.result
        )
      )}

      ${detailItem(
        "Duração",
        formatDuration(
          verification.durationMs
        )
      )}

      ${detailItem(
        "Início",
        formatDate(
          verification.startedAt
        )
      )}

      ${detailItem(
        "Término",
        formatDate(
          verification.finishedAt
        )
      )}
    </div>

    ${
      readings.length > 0
        ? `
          <div class="alert-related-readings">
            ${readings
              .map(reading => `
                <div class="alert-reading">
                  <div>
                    <span>
                      Vizinho
                    </span>

                    <strong>
                      ${escapeHtml(
                        reading.neighborCode ??
                        reading.mac ??
                        "Dispositivo"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      M15
                    </span>

                    <strong>
                      ${
                        reading.m15 !== null &&
                        reading.m15 !== undefined
                          ? `${escapeHtml(reading.m15)} dBm`
                          : "—"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      RSSI médio
                    </span>

                    <strong>
                      ${
                        reading.averageRssi !== null &&
                        reading.averageRssi !== undefined
                          ? `${escapeHtml(reading.averageRssi)} dBm`
                          : "—"
                      }
                    </strong>
                  </div>
                </div>
              `)
              .join("")}
          </div>
        `
        : ""
    }
  `;
}

function detailItem(label, value) {
  return `
    <div class="alert-detail-item">
      <span>
        ${escapeHtml(label)}
      </span>

      <strong>
        ${escapeHtml(value)}
      </strong>
    </div>
  `;
}

function hideAlertDrawer() {
  selectedAlertId = null;

  alertDrawer.classList.remove("open");
  alertDrawerOverlay.classList.remove("open");
}

function formatType(type) {
  const values = {
    NODE_OFFLINE:
      "Sensor offline",

    MISSING_NEIGHBOR:
      "Vizinho não detectado",

    VERIFICATION_TIMEOUT:
      "Timeout de verificação",

    VERIFICATION_ERROR:
      "Erro de verificação"
  };

  return (
    values[type] ??
    type ??
    "Desconhecido"
  );
}

function formatSeverity(severity) {
  const values = {
    CRITICAL: "Crítico",
    WARNING: "Atenção",
    INFO: "Informativo"
  };

  return (
    values[severity] ??
    severity ??
    "Desconhecida"
  );
}

function formatStatus(status) {
  const values = {
    ACTIVE: "Ativo",
    RESOLVED: "Resolvido"
  };

  return (
    values[status] ??
    status ??
    "Desconhecido"
  );
}

function getSeverityClass(severity) {
  switch (severity) {
    case "CRITICAL":
      return "critical";

    case "WARNING":
      return "warning";

    default:
      return "info";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "ACTIVE":
      return "active";

    case "RESOLVED":
      return "resolved";

    default:
      return "unknown";
  }
}

function formatVerificationMode(mode) {
  switch (mode) {
    case "AUTOMATIC":
      return "Automática";

    case "MANUAL":
      return "Manual";

    default:
      return mode ?? "—";
  }
}

function formatVerificationResult(result) {
  const values = {
    FINISHED: "Finalizada",
    TIMEOUT: "Timeout",
    ERROR: "Erro",
    OFFLINE: "Offline"
  };

  return (
    values[result] ??
    result ??
    "—"
  );
}

function formatDuration(value) {
  const duration =
    Number(value);

  if (
    !Number.isFinite(duration)
  ) {
    return "—";
  }

  if (duration < 1000) {
    return `${duration} ms`;
  }

  return `${(
    duration /
    1000
  ).toFixed(1)} s`;
}

function formatDate(value) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  );
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

alertSearch.addEventListener(
  "input",
  renderAlerts
);

alertStatusFilter.addEventListener(
  "change",
  renderAlerts
);

alertSeverityFilter.addEventListener(
  "change",
  renderAlerts
);

alertTypeFilter.addEventListener(
  "change",
  renderAlerts
);

refreshAlertsButton.addEventListener(
  "click",
  () => loadAlerts()
);

closeAlertDrawer.addEventListener(
  "click",
  hideAlertDrawer
);

alertDrawerOverlay.addEventListener(
  "click",
  hideAlertDrawer
);

document.addEventListener(
  "keydown",
  event => {
    if (event.key === "Escape") {
      hideAlertDrawer();
    }
  }
);

document.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter" &&
      document.activeElement
        ?.classList
        ?.contains(
          "persistent-alert-card"
        )
    ) {
      document.activeElement.click();
    }
  }
);

loadAlerts();

setInterval(
  () => loadAlerts(false),
  10000
);