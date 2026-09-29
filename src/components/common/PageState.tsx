export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="sa-state">
      <span className="sa-spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function PageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="sa-state sa-state-error">
      <p>{message}</p>
      {onRetry && (
        <button className="rsv-btn rsv-btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
