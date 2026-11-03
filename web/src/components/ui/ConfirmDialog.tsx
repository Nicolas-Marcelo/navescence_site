import {
  AlertTriangle,
  X,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  destructive = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="confirm-overlay"
      role="presentation"
      onMouseDown={
        event => {
          if (
            event.target ===
            event.currentTarget &&
            !loading
          ) {
            onCancel();
          }
        }
      }
    >
      <section
        className={`confirm-card ${
          destructive
            ? "confirm-card-destructive"
            : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={
          description
            ? "confirm-dialog-description"
            : undefined
        }
      >
        <header className="confirm-card-header">
          <div className="confirm-card-heading">
            {destructive && (
              <div className="confirm-danger-icon">
                <AlertTriangle
                  size={20}
                />
              </div>
            )}

            <div>
              <span
                className={
                  destructive
                    ? "confirm-eyebrow danger"
                    : "confirm-eyebrow"
                }
              >
                {destructive
                  ? "Ação destrutiva"
                  : "Confirmação"}
              </span>

              <h2
                id="confirm-dialog-title"
              >
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="confirm-close"
            aria-label="Fechar"
            disabled={loading}
            onClick={onCancel}
          >
            <X
              size={18}
            />
          </button>
        </header>

        {description && (
          <p
            id="confirm-dialog-description"
            className="confirm-description"
          >
            {description}
          </p>
        )}

        {children && (
          <div className="confirm-content">
            {children}
          </div>
        )}

        <footer className="confirm-actions">
          <button
            type="button"
            className="button secondary"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={
              destructive
                ? "button confirm-danger-button"
                : "button primary"
            }
            disabled={loading}
            onClick={onConfirm}
          >
            {loading
              ? destructive
                ? "Excluindo..."
                : "Salvando..."
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
    <div className="confirm-review-item">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}