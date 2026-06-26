interface SyncProgressProps {
  progress: number;
  stepLabel: string;
}

export function SyncProgress({ progress, stepLabel }: SyncProgressProps) {
  return (
    <div className="sync-progress" role="status" aria-live="polite">
      <div className="sync-progress-header">
        <span className="sync-progress-label">{stepLabel}</span>
        <span className="sync-progress-pct">{progress}%</span>
      </div>
      <div className="progress-bar progress-bar-lg">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
