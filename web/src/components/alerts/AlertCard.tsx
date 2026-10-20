import {
  StatusBadge,
} from "../ui/StatusBadge";

import type {
  SystemAlert,
} from "../../types/alert";

interface AlertCardProps {
  alert: SystemAlert;
}

export function AlertCard({
  alert,
}: AlertCardProps) {
  return (
    <article className="alert-admin-card">
      <div className="alert-symbol">
        !
      </div>

      <div className="alert-admin-content">
        <header>
          <div>
            <strong>
              {alert.title ??
                "Alerta"}
            </strong>

            <span>
              {alert.nodeCode ??
                "Sistema"}
            </span>
          </div>

          <StatusBadge
            value={alert.status}
          />
        </header>

        <p>
          {alert.message ?? "—"}
        </p>

        <footer>
          <span>
            {alert.severity}
          </span>

          <span>
            {new Date(
              alert.openedAt,
            ).toLocaleString(
              "pt-BR",
            )}
          </span>
        </footer>
      </div>
    </article>
  );
}