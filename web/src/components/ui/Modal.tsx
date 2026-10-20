import type {
  ReactNode,
} from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}