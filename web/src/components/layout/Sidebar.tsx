import {
  Activity,
  Bell,
  Building2,
  CircleDot,
  LayoutDashboard,
  Map,
  MapPinned,
  Route,
  Users,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const items = [
  {
    to: "/admin",
    label: "Visão geral",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/admin/sensores",
    label: "Sensores",
    icon: Activity,
  },
  {
    to: "/admin/ambientes",
    label: "Ambientes",
    icon: Building2,
  },
  {
    to: "/admin/pois",
    label: "Pontos de interesse",
    icon: MapPinned,
  },
  {
    to: "/admin/topologia",
    label: "Topologia",
    icon: Route,
  },
  {
    to: "/admin/alertas",
    label: "Alertas",
    icon: Bell,
  },
  {
    to: "/admin/historico",
    label: "Verificações",
    icon: CircleDot,
  },
  {
    to: "/admin/navegacoes",
    label: "Navegações",
    icon: Map,
  },
  {
    to: "/admin/usuarios",
    label: "Usuários",
    icon: Users,
  },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div
          className="sidebar-logo"
          aria-hidden="true"
        >
          N
        </div>

        <div className="sidebar-brand-copy">
          <strong>
            NAVESCENCE
          </strong>

          <span>
            Sistema central
          </span>
        </div>
      </div>

      <div className="sidebar-section-label">
        GERENCIAMENTO
      </div>

      <nav
        className="sidebar-nav"
        aria-label="Menu administrativo"
      >
        {items.map(item => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({
                isActive,
              }) =>
                `sidebar-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              <Icon
                size={19}
                strokeWidth={1.9}
              />

              <span>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-system-status">
          <span
            className="system-dot"
            aria-hidden="true"
          />

          <div>
            <strong>
              Sistema central
            </strong>

            <span>
              Operacional
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}