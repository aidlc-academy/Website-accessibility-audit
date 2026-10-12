import React from 'react';
import { AuditTarget } from '../../types/audit';

interface ScanHistoryViewProps {
  targets: AuditTarget[];
  onOpenTarget: (targetId: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({
  targets,
  onOpenTarget,
  loading,
  error,
  onRetry,
}) => {
  return (
    <section aria-labelledby="history-heading" className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 id="history-heading" className="font-manrope text-xl md:text-2xl font-bold text-on-surface">
              Scan History & Audit Logs
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            Archived accessibility scans and compliance tracking records.
          </p>
        </div>
      </div>

      <div className="glass-card bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/20">
        <div className="flex flex-col gap-4">
          {loading ? (
            <p role="status" className="text-sm text-on-surface-variant">Loading saved audits…</p>
          ) : error ? (
            <div role="alert" className="flex items-center justify-between gap-3 text-sm text-error">
              <p>{error}</p>
              <button onClick={onRetry} className="font-bold underline min-target-size">Retry</button>
            </div>
          ) : targets.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No saved audits yet. Run an audit from the Overview screen to populate your history.</p>
          ) : targets.map((t) => (
            <div
              key={t.id}
              className="p-4 bg-surface-container-lowest rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline-variant/15 hover:bg-surface-container-high/30 transition-colors"
            >
              <div>
                <h2 className="font-manrope font-bold text-sm text-on-surface">{t.title}</h2>
                <span className="text-xs text-on-surface-variant font-mono">{t.url}</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    t.status === 'Needs Review' ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'
                  }`}>
                    {t.status === 'Audit complete' ? 'Automated scan complete' : 'Findings need review'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t.issueCount ?? t.issues.length} affected {t.issueCount === 1 ? 'element' : 'elements'} · {t.date}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onOpenTarget(t.id)}
                className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer min-target-size shrink-0 self-start sm:self-center"
              >
                Inspect in Studio
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
