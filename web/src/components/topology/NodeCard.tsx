import {
  StatusBadge,
} from "../ui/StatusBadge";

import type {
  DashboardNode,
  Sensor,
} from "../../types/sensor";

interface NodeCardProps {
  sensor: Sensor;
  runtime?: DashboardNode;
}

export function NodeCard({
  sensor,
  runtime,
}: NodeCardProps) {
  return (
    <article className="topology-node-card">
      <header>
        <strong>
          {sensor.code}
        </strong>

        <StatusBadge
          value={
            runtime?.presence
          }
        />
      </header>

      <span>
        {sensor.environment
          ?.name ??
          "Sem ambiente"}
      </span>
    </article>
  );
}