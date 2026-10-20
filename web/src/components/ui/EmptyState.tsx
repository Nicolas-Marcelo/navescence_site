interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="content-state">
      <strong>{title}</strong>

      {description && (
        <span>{description}</span>
      )}
    </div>
  );
}