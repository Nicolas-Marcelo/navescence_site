interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Carregando...",
}: LoadingStateProps) {
  return (
    <div
      className="content-state"
      role="status"
      aria-live="polite"
    >
      <div
        className="spinner"
        aria-hidden="true"
      />

      <span>
        {message}
      </span>
    </div>
  );
}