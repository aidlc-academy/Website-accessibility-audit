import React, { useEffect, useState } from 'react';

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

type ScanStage = {
  id: string;
  label: string;
  icon: string;
  status: 'pending' | 'active' | 'complete' | 'error';
};

export const ScanProgressView: React.FC<ScanProgressViewProps> = ({
  targetUrl,
  scanState,
  onCancel,
  onComplete,
}) => {
  const [stages, setStages] = useState<ScanStage[]>([
    { id: 'validate', label: 'Validating URL', icon: 'shield_check', status: 'pending' },
    { id: 'connect', label: 'Connecting to target', icon: 'cloud_sync', status: 'pending' },
    { id: 'load', label: 'Loading page', icon: 'hourglass_empty', status: 'pending' },
    { id: 'inspect', label: 'Inspecting elements', icon: 'search', status: 'pending' },
    { id: 'analyze', label: 'Analyzing issues', icon: 'analytics', status: 'pending' },
    { id: 'generate', label: 'Generating report', icon: 'description', status: 'pending' },
  ]);

  const [currentStageIndex, setCurrentStageIndex] = useState(-1);

  useEffect(() => {
    if (scanState.status === 'loading') {
      // Simulate progressive stages
      const timer = setInterval(() => {
        setCurrentStageIndex(prev => {
          if (prev < stages.length - 1) {
            const newIndex = prev + 1;
            setStages(current =>
              current.map((stage, idx) => {
                if (idx < newIndex) return { ...stage, status: 'complete' };
                if (idx === newIndex) return { ...stage, status: 'active' };
                return { ...stage, status: 'pending' };
              })
            );
            return newIndex;
          }
          return prev;
        });
      }, 800); // Move to next stage every 800ms

      return () => clearInterval(timer);
    } else if (scanState.status === 'success') {
      setStages(current => current.map(stage => ({ ...stage, status: 'complete' })));
      setCurrentStageIndex(stages.length);
    } else if (scanState.status === 'error') {
      setStages(current =>
        current.map((stage, idx) =>
          idx <= currentStageIndex
            ? { ...stage, status: idx === currentStageIndex ? 'error' : 'complete' }
            : { ...stage, status: 'pending' }
        )
      );
    }
  }, [scanState.status]);

  return (
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
            <div className="min-w-0 flex-1">
              <p className="text-xs text-on-surface-variant">Target website</p>
              <p className="font-mono text-sm break-all">{targetUrl}</p>
            </div>
          </div>
          <h2 id="scan-heading" className="font-manrope text-xl font-bold text-on-surface mb-5">
            {scanState.status === 'loading' ? 'Scanning public page…' : scanState.status === 'success' ? 'Scan results are ready' : 'Scan stopped'}
          </h2>

          {/* Progress bar */}
          <div className="mb-6 w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden" role="progressbar" aria-label="Automated accessibility scan">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                scanState.status === 'error'
                  ? 'bg-error'
                  : scanState.status === 'success'
                    ? 'bg-emerald-600'
                    : 'bg-primary'
              }`}
              style={{
                width: scanState.status === 'error'
                  ? `${((currentStageIndex + 1) / stages.length) * 100}%`
                  : scanState.status === 'success'
                    ? '100%'
                    : `${Math.max(10, ((currentStageIndex + 1) / stages.length) * 100)}%`
              }}
            />
          </div>

          {/* Scan stages */}
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  stage.status === 'active'
                    ? 'bg-primary/10 border border-primary/30'
                    : stage.status === 'complete'
                      ? 'bg-success-container/20 border border-success/20'
                      : stage.status === 'error'
                        ? 'bg-error-container/20 border border-error/30'
                        : 'bg-surface-container border border-outline-variant/10'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    stage.status === 'active'
                      ? 'text-primary animate-pulse'
                      : stage.status === 'complete'
                        ? 'text-success'
                        : stage.status === 'error'
                          ? 'text-error'
                          : 'text-on-surface-variant'
                  }`}
                  aria-hidden="true"
                >
                  {stage.status === 'complete' ? 'check_circle' : stage.status === 'error' ? 'error' : stage.icon}
                </span>
                <span
                  className={`text-sm font-medium ${
                    stage.status === 'active'
                      ? 'text-primary font-bold'
                      : stage.status === 'complete'
                        ? 'text-on-surface'
                        : stage.status === 'error'
                          ? 'text-error font-bold'
                          : 'text-on-surface-variant'
                  }`}
                >
                  {stage.label}
                </span>
                {stage.status === 'active' && (
                  <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-5 glass-card bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <h2 className="font-manrope text-base font-bold text-on-surface mb-4">What this scan checks</h2>
          <ul className="space-y-3 text-sm text-on-surface-variant">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">done</span>
              <span>Automated axe-core WCAG 2.2 A/AA rules</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">done</span>
              <span>Issue descriptions, affected selectors, and rule guidance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">done</span>
              <span>Passed and incomplete rule counts from the scanner</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">done</span>
              <span>Severity classification (Critical, Serious, Moderate, Minor)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">done</span>
              <span>WCAG success criterion mapping</span>
            </li>
          </ul>
          <div className="mt-5 pt-4 border-t border-outline-variant/20">
            <p className="text-xs font-semibold text-on-surface mb-2">Manual testing still required:</p>
            <ul className="space-y-1 text-xs text-on-surface-variant">
              <li>• Keyboard-only navigation</li>
              <li>• Screen reader compatibility</li>
              <li>• Meaningful alternative text</li>
              <li>• Focus order and visibility</li>
              <li>• Context-dependent requirements</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};
