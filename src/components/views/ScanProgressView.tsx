import React from 'react';

export interface ScanState {
  status: 'loading' | 'success' | 'error';
  message?: string;
  findingCount?: number;
}

interface ScanProgressViewProps {
  targetUrl: string;
  scanState: ScanState;
  onCancel: () => void;
  onComplete: () => void;
}

export const ScanProgressView: React.FC<ScanProgressViewProps> = ({
  targetUrl,
  scanState,
  onCancel,
  onComplete,
}) => (
  <section aria-labelledby="scan-heading" className="flex flex-col w-full">
    <div
      className={`p-4 mb-6 rounded-2xl border flex items-start gap-3 text-sm ${
        scanState.status === 'error'
          ? 'bg-error-container/40 border-error/30 text-on-error-container'
          : 'bg-surface-container-low border-outline-variant/20 text-on-surface'
      }`}
      role={scanState.status === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span className="material-symbols-outlined shrink-0" aria-hidden="true">
        {scanState.status === 'loading' ? 'progress_activity' : scanState.status === 'success' ? 'task_alt' : 'error'}
      </span>
      <div className="flex-1">
        <p className="font-bold">
          {scanState.status === 'loading'
            ? 'Running an automated axe-core scan'
            : scanState.status === 'success'
              ? 'Automated scan complete'
              : 'The audit could not be completed'}
        </p>
        <p className="mt-1">
          {scanState.status === 'loading'
            ? 'The server is loading the public page and checking it against automated WCAG rules.'
            : scanState.status === 'success'
              ? `${scanState.findingCount ?? 0} affected element${scanState.findingCount === 1 ? '' : 's'} recorded. Automated checks do not establish full WCAG conformance; manual review is still required.`
              : scanState.message}
        </p>
      </div>
      {scanState.status === 'loading' && (
        <button
          onClick={onCancel}
          className="bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2 rounded-xl hover:bg-surface-container-highest min-target-size"
        >
          Cancel
        </button>
      )}
      {scanState.status === 'success' && (
        <button
          onClick={onComplete}
          className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary-container min-target-size"
        >
          View findings
        </button>
      )}
      {scanState.status === 'error' && (
        <button
          onClick={onCancel}
          className="bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2 rounded-xl hover:bg-surface-container-highest min-target-size"
        >
          Back
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 glass-card bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-5">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">language</span>
          <div className="min-w-0">
            <p className="text-xs text-on-surface-variant">Target website</p>
            <p className="font-mono text-sm break-all">{targetUrl}</p>
          </div>
        </div>
        <h2 id="scan-heading" className="font-manrope text-xl font-bold text-on-surface">
          {scanState.status === 'loading' ? 'Scanning public page…' : scanState.status === 'success' ? 'Scan results are ready' : 'Scan stopped'}
        </h2>
        <div className="mt-5 w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden" role="progressbar" aria-label="Automated accessibility scan">
          <div
            className={`h-full rounded-full transition-all ${scanState.status === 'error' ? 'bg-error w-full' : scanState.status === 'success' ? 'bg-emerald-600 w-full' : 'bg-primary w-1/2 animate-pulse'}`}
          />
        </div>
      </div>

      <aside className="lg:col-span-5 glass-card bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant/20">
        <h2 className="font-manrope text-base font-bold text-on-surface">What this scan checks</h2>
        <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
          <li>Automated axe-core WCAG 2.2 A/AA rules</li>
          <li>Issue descriptions, affected selectors, and rule guidance</li>
          <li>Passed and incomplete rule counts from the scanner</li>
        </ul>
        <p className="mt-4 text-xs text-on-surface-variant">
          Keyboard interaction, meaningful alternative text, focus behavior, and other context-dependent requirements need human verification.
        </p>
      </aside>
    </div>
  </section>
);
