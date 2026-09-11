const sidebar = document.querySelector(".sidebar");

const navItems = [
  {
    key: "overview",
    href: "/",
    icon: "◫",
    label: "Visão geral"
  },
  {
    key: "sensors",
    href: "/sensors.html",
    icon: "◉",
    label: "Sensores"
  },
  {
    key: "environments",
    href: "/ambientes.html",
    icon: "⌂",
    label: "Ambientes"
  },
  {
    key: "pois",
    href: "/pois.html",
    icon: "◎",
    label: "Pontos de interesse"
  },
  {
    key: "topology",
    href: "/topologia.html",
    icon: "◇",
    label: "Topologia"
  },
  {
    key: "verifications",
    href: "/verificacoes.html",
    icon: "↻",
    label: "Verificações"
  },
  {
    key: "history",
    href: "/historico.html",
    icon: "≡",
    label: "Histórico"
  },
  {
    key: "alerts",
    href: "/alertas.html",
    icon: "!",
    label: "Alertas",
    counter: true
  }
];

function getActiveKey() {
  const path = window.location.pathname;

  if (path === "/sensors.html") return "sensors";
  if (path === "/ambientes.html") return "environments";
  if (path === "/pois.html") return "pois";
  if (path === "/topologia.html") return "topology";
  if (path === "/verificacoes.html") return "verifications";
  if (path === "/historico.html") return "history";
  if (path === "/alertas.html") return "alerts";

  return "overview";
}

function renderSidebar() {
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="brand">
      <div class="brand-mark">N</div>

      <div class="brand-text">
        <strong>NAVESCENCE</strong>
        <span>Administração</span>
      </div>
    </div>

    <nav class="navigation">
      ${navItems.map(item => `
        <a
          href="${item.href}"
          class="nav-item"
          data-nav="${item.key}"
        >
          <span class="nav-icon">${item.icon}</span>

          ${item.label}

          ${
            item.counter
              ? `
                <span
                  id="sidebarAlertCount"
                  class="nav-counter hidden"
                >
                  0
                </span>
              `
              : ""
          }
        </a>
      `).join("")}
    </nav>

    <div class="sidebar-bottom">
      <div class="sidebar-system">
        <span class="sidebar-system-label">
          Sistema central
        </span>

        <div
          id="sidebarConnection"
          class="sidebar-connection connecting"
        >
          <span class="status-dot"></span>
          Conectando...
        </div>
      </div>
    </div>
  `;

  updateActiveState();
}

function updateActiveState() {
  const activeKey = getActiveKey();

  document.querySelectorAll(".sidebar [data-nav]").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.nav === activeKey
    );
  });
}

function setSidebarConnection(connected) {
  const element = document.getElementById("sidebarConnection");
  if (!element) return;

  if (connected) {
    element.className = "sidebar-connection online";
    element.innerHTML = `
      <span class="status-dot"></span>
      Conectado
    `;
    return;
  }

  element.className = "sidebar-connection offline";
  element.innerHTML = `
    <span class="status-dot"></span>
    Desconectado
  `;
}

function setSidebarAlerts(count) {
  const counter = document.getElementById("sidebarAlertCount");
  if (!counter) return;

  if (count > 0) {
    counter.textContent = count;
    counter.classList.remove("hidden");
    return;
  }

  counter.textContent = "0";
  counter.classList.add("hidden");
}

async function updateSidebarData() {
  try {
    const [dashboardResponse, alertsResponse] = await Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/alerts?status=ACTIVE&limit=500")
    ]);

    setSidebarConnection(dashboardResponse.ok);

    if (alertsResponse.ok) {
      const alerts = await alertsResponse.json();

      setSidebarAlerts(
        Array.isArray(alerts)
          ? alerts.length
          : 0
      );
    }
  } catch {
    setSidebarConnection(false);
  }
}

function isDashboard() {
  return (
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html"
  );
}

renderSidebar();

if (!isDashboard()) {
  updateSidebarData();

  setInterval(
    updateSidebarData,
    10000
  );
}