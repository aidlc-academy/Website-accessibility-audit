import React, { useState } from 'react';
import { ViewType, AuditTarget, AuditStats } from '../../types/audit';

interface OverviewViewProps {
  onStartScan: (url: string) => void;
  onOpenTarget: (targetId: string) => void;
  stats: AuditStats;
  recentTargets: AuditTarget[];
  onNavigate: (view: ViewType) => void;
  loading: boolean;
  error: string | null;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onStartScan,
  onOpenTarget,
  stats,
  recentTargets,
  onNavigate,
  loading,
  error,
}) => {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value.trim());
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
        throw new Error('unsupported URL');
      }
      setUrlError(null);
      return true;
    } catch {
      setUrlError(value.trim()
        ? 'Enter a complete public website address beginning with http:// or https://.'
        : 'Website URL is required.');
      return false;
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateUrl(url)) onStartScan(url.trim());
  };

  return (
    <section aria-labelledby="overview-heading" className="flex flex-col w-full">
      <div className="glass-card relative overflow-hidden bg-surface-container-low rounded-2xl p-6 lg:p-8 mb-8 shadow-sm border border-outline-variant/20">
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-primary/20">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">verified</span>
            Automated WCAG 2.2 A/AA checks
          </div>
          <h1 id="overview-heading" className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface mb-2">
            Build a web everyone can use.
          </h1>
          <p className="text-sm lg:text-base text-on-surface-variant mb-6">
            Scan a public website with axe-core, inspect affected elements, and review actionable guidance.
          </p>

          <div className="bg-surface-container-lowest p-5 lg:p-6 rounded-2xl shadow-md border border-outline-variant/20">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <label htmlFor="url-input" className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Target website URL <span className="font-normal normal-case text-on-surface-variant">— public HTTP or HTTPS site</span>
              </label>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <input
                  id="url-input"
                  type="url"
                  required
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  placeholder="https://example.com"
                  aria-invalid={urlError ? 'true' : 'false'}
                  aria-describedby={urlError ? 'url-error-msg' : 'url-help'}
                  className={`w-full flex-1 bg-surface-container-low text-on-surface text-sm px-4 py-3 rounded-xl outline-none focus:ring-2 border font-mono ${
                    urlError ? 'border-error focus:ring-error' : 'border-outline-variant/30 focus:ring-primary'
                  }`}
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-container text-on-primary font-bold text-sm px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm min-target-size"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">bolt</span>
                  Run accessibility audit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrl('https://example.com/');
                    setUrlError(null);
                  }}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-sm px-4 py-3 rounded-xl transition-colors border border-outline-variant/20 min-target-size"
                >
                  Use example.com
                </button>
              </div>
              <p id="url-help" className="text-xs text-on-surface-variant">
                Private, local, and reserved network destinations are blocked. Each scan has a server-enforced time limit.
              </p>
              {urlError && <p id="url-error-msg" role="alert" className="text-xs font-semibold text-error">{urlError}</p>}
              <p className="text-xs text-on-surface-variant">
                Automated checks do not cover every WCAG requirement. Manual keyboard, screen-reader, and context-dependent review is still necessary.
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="glass-card lg:col-span-4 bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <h2 className="font-manrope text-base font-bold text-on-surface">Most recent scan findings</h2>
          <p className="text-xs text-on-surface-variant mt-1 mb-5">
            Counts are from the most recently opened audit and reflect automated axe-core findings only.
          </p>
          <dl className="space-y-2.5">
            {([
              ['Critical', stats.critical],
              ['Serious', stats.serious],
              ['Moderate', stats.moderate],
              ['Minor', stats.minor],
            ] as const).map(([severity, count]) => (
              <div key={severity} className="bg-surface-container-lowest p-3 rounded-xl flex items-center justify-between border border-outline-variant/15">
                <dt className="text-sm font-semibold text-on-surface">{severity}</dt>
                <dd className="font-manrope text-sm font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded">{count}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 pt-4 border-t border-outline-variant/20 text-xs text-on-surface-variant">
            A zero-finding automated scan is not proof of WCAG conformance.
          </p>
        </div>

        <div className="glass-card lg:col-span-8 bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-manrope text-lg font-bold text-on-surface">Saved audits</h2>
              <p className="text-xs text-on-surface-variant">Locally stored scan results you can reopen.</p>
            </div>
            <button
              onClick={() => onNavigate('scan-history')}
              className="text-xs font-bold text-primary hover:underline min-target-size"
            >
              View history
            </button>
          </div>
          {loading ? (
            <p role="status" className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl p-5">Loading saved audits…</p>
          ) : error ? (
            <p role="alert" className="text-sm text-error bg-surface-container-lowest rounded-xl p-5">{error} Open Scan History to retry.</p>
          ) : recentTargets.length === 0 ? (
            <p className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl p-5">
              No audits have been saved yet. Enter a public website URL above to start the first scan.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentTargets.slice(0, 4).map((target) => (
                <div key={target.id} className="p-4 bg-surface-container-lowest rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline-variant/15">
                  <div className="min-w-0">
                    <h3 className="font-manrope font-bold text-sm text-on-surface truncate">{target.title}</h3>
                    <p className="text-xs text-on-surface-variant font-mono truncate">{target.url}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {target.issueCount ?? target.issues.length} affected elements · {target.date}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenTarget(target.id)}
                    className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-xl min-target-size"
                  >
                    Open findings
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
