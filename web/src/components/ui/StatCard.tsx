import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "danger" | "warning";
}

export function StatCard({
  label,
  value,
  description,
  icon,
  variant = "default",
}: StatCardProps) {
  return (
    <article className={`stat-card ${variant}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">
          {label}
        </span>

        {icon && (
          <div className="stat-card-icon">
            {icon}
          </div>
        )}
      </div>

      <strong className="stat-card-value">
        {value}
      </strong>

      {description && (
        <span className="stat-card-description">
          {description}
        </span>
      )}
    </article>
  );
}