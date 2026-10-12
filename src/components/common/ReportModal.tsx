import React, { useEffect, useRef, useState } from 'react';
import { AuditTarget } from '../../types/audit';
import { getAudit, statsForTarget } from '../../services/auditApi';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: AuditTarget;
}

const formatDate = (value: string) => value ? new Date(value).toLocaleString() : 'Not recorded';

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, target }) => {
  const [savedTarget, setSavedTarget] = useState<AuditTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || !target.id) return;
    const controller = new AbortController();
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setLoading(true);
    setError(null);
    setSavedTarget(null);
    void getAudit(target.id, controller.signal)
      .then(setSavedTarget)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Unable to load this saved audit.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      previousFocus.current?.focus();
    };
  }, [isOpen, target.id]);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.classList.toggle('printing-report', isOpen);
    return () => document.body.classList.remove('printing-report');
  }, [isOpen]);

  if (!isOpen) return null;
  const report = savedTarget;
  const stats = report ? statsForTarget(report) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print-report-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        ref={dialogRef}
        data-print-report
        className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-outline-variant/30 print-report"
      >
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between gap-3 print-report-actions">
          <div className="min-w-0">
            <h2 id="report-modal-title" className="font-manrope text-base sm:text-lg font-bold text-on-surface">
              Saved automated scan report
            </h2>
            <p className="text-xs text-on-surface-variant break-all">{target.url}</p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center min-target-size"
            aria-label="Close report dialog"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-surface-container-low print-report-content">
          {loading ? (
            <p role="status" className="text-sm text-on-surface-variant">Loading the selected saved audit…</p>
          ) : error ? (
            <p role="alert" className="text-sm text-error">{error}</p>
          ) : report && stats ? (
            <article className="bg-white text-slate-900 p-5 sm:p-8 rounded-xl report-paper">
              <p className="text-xs uppercase font-bold tracking-wide text-slate-600">AccessLens · Automated accessibility scan</p>
              <h1 className="mt-2 text-2xl font-bold break-words">{report.title}</h1>
              <p className="mt-2 font-mono text-sm break-all">{report.url}</p>
              <p className="mt-2 text-sm">Scanned: {formatDate(report.scannedAt || '')} · Status: {report.scanStatus || 'completed'}</p>
              <p className="mt-1 text-sm">{report.standard} · Viewport: {report.viewport} · Scanner: axe-core {report.scanConfiguration?.axeVersion || 'version unavailable'}</p>

              <aside className="mt-5 border-l-4 border-amber-600 bg-amber-50 p-4 text-sm text-amber-950">
                Automated checks do not establish full WCAG compliance or conformance. Manual keyboard, screen-reader, visual, and contextual review is still required.
              </aside>

              <section className="mt-6 break-inside-avoid">
                <h2 className="text-lg font-bold">Severity summary</h2>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {([
                    ['Critical', stats.critical],
                    ['Serious', stats.serious],
                    ['Moderate', stats.moderate],
                    ['Minor', stats.minor],
                  ] as const).map(([severity, count]) => (
                    <div key={severity} className="border border-slate-300 rounded p-3">
                      <dt className="text-xs font-semibold">{severity}</dt>
                      <dd className="text-xl font-bold">{count}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="mt-6">
                <h2 className="text-lg font-bold">Scan configuration</h2>
                <pre className="mt-2 whitespace-pre-wrap break-all text-xs font-mono border border-slate-300 rounded p-3">
                  {JSON.stringify(report.scanConfiguration || { standard: report.standard, viewport: report.viewport }, null, 2)}
                </pre>
              </section>

              <section className="mt-6">
                <h2 className="text-lg font-bold">Findings ({report.issues.length})</h2>
                {report.issues.length ? report.issues.map((issue, index) => (
                  <article key={`${issue.id}-${index}`} className="report-finding mt-4 border border-slate-300 rounded-lg p-4">
                    <h3 className="text-base font-bold break-words">{issue.title}</h3>
                    <p className="mt-1 text-sm font-semibold">{issue.severity} · {issue.category}</p>
                    <p className="mt-2 text-sm"><strong>WCAG reference:</strong> {issue.wcag || 'Not identified by axe-core'}</p>
                    <p className="mt-2 text-sm whitespace-pre-wrap break-words"><strong>Issue description:</strong> {issue.whyMatters}</p>
                    <p className="mt-2 text-sm break-all"><strong>Affected element:</strong> {issue.selector}</p>
                    <pre className="mt-2 whitespace-pre-wrap break-all text-xs font-mono bg-slate-50 border border-slate-200 rounded p-3">{issue.snippet}</pre>
                    <p className="mt-3 text-sm font-bold">Suggested fix guidance</p>
                    <p className="text-xs text-slate-700">Guidance for code you control; AccessLens does not edit arbitrary external websites.</p>
                    <pre className="mt-2 whitespace-pre-wrap break-all text-xs font-mono bg-slate-50 border border-slate-200 rounded p-3">{issue.remediation}</pre>
                  </article>
                )) : (
                  <p className="mt-2 text-sm">No violations were found in the automated rules that ran. This is not proof of full WCAG compliance.</p>
                )}
              </section>
            </article>
          ) : null}
        </div>

        <div className="px-6 py-3.5 bg-surface-container-lowest border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 print-report-actions">
          <p className="text-xs text-on-surface-variant">Automated findings do not establish full WCAG compliance.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={!report}
              className="bg-surface-container-high text-on-surface text-xs font-bold px-3 py-2 rounded-xl min-target-size disabled:opacity-50"
            >
              Print / Save PDF
            </button>
            <a
              href={`/api/audits/${encodeURIComponent(target.id)}/export.csv`}
              className="bg-surface-container-high text-on-surface text-xs font-bold px-3 py-2 rounded-xl min-target-size"
            >
              Download CSV
            </a>
            <a
              href={`/api/audits/${encodeURIComponent(target.id)}/report`}
              download={target.reportFilename}
              className="bg-surface-container-high text-on-surface text-xs font-bold px-3 py-2 rounded-xl min-target-size"
            >
              Download .md
            </a>
            <button
              onClick={onClose}
              className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-xl min-target-size"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
