import {
  StatusBadge,
} from "../ui/StatusBadge";

interface SensorStatusProps {
  active: boolean;
  maintenance: boolean;
}

export function SensorStatus({
  active,
  maintenance,
}: SensorStatusProps) {
  if (!active) {
    return (
      <StatusBadge value="INACTIVE" />
    );
  }

  if (maintenance) {
    return (
      <StatusBadge value="VERIFICANDO" />
    );
  }

  return (
    <StatusBadge value="ACTIVE" />
  );
}