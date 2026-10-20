import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  children: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Voltar e editar",
  loading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
    >
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <header className="confirm-dialog-header">
          <span className="eyebrow">
            Revisão
          </span>

          <h2 id="confirm-dialog-title">
            {title}
          </h2>

          {description && (
            <p>{description}</p>
          )}
        </header>

        <div className="confirm-dialog-content">
          {children}
        </div>

        <footer className="confirm-dialog-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className="button primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Salvando..."
              : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

interface ReviewItemProps {
  label: string;
  value: ReactNode;
}

export function ReviewItem({
  label,
  value,
}: ReviewItemProps) {
  return (
    <div className="review-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}