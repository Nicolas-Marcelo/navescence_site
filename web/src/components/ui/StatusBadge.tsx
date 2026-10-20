interface StatusBadgeProps {
  value?: string | null;
}

interface StatusData {
  label: string;
  className: string;
}

export function StatusBadge({
  value,
}: StatusBadgeProps) {
  const normalized =
    value?.toUpperCase() ?? "UNKNOWN";

  const values: Record<string, StatusData> = {
    ONLINE: {
      label: "Online",
      className: "success",
    },

    OFFLINE: {
      label: "Offline",
      className: "danger",
    },

    ACTIVE: {
      label: "Ativo",
      className: "success",
    },

    RESOLVED: {
      label: "Resolvido",
      className: "neutral",
    },

    VERIFICANDO: {
      label: "Verificando",
      className: "warning",
    },

    FINALIZADO: {
      label: "Finalizado",
      className: "success",
    },

    INACTIVE: {
      label: "Inativo",
      className: "neutral",
    },

    NOT_MONITORED: {
      label: "Não monitorado",
      className: "neutral",
    },

    UNKNOWN: {
      label: "Desconhecido",
      className: "neutral",
    },

    DESCONHECIDO: {
      label: "Desconhecido",
      className: "neutral",
    },
  };

  const data = values[normalized] ?? {
    label: value ?? "Desconhecido",
    className: "neutral",
  };

  return (
    <span
      className={`status-badge ${data.className}`}
    >
      <i aria-hidden="true" />

      {data.label}
    </span>
  );
}