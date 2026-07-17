interface AppRouteLoadingProps {
  message?: string;
}

export function AppRouteLoading({
  message = "Carregando…",
}: AppRouteLoadingProps) {
  return (
    <div className="app-route-loading" role="status" aria-live="polite">
      <p className="app-route-loading-text">{message}</p>
    </div>
  );
}
