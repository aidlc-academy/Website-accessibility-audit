import React, { useMemo, useState } from 'react';
import { AuditTarget, AuditIssue, SeverityTier } from '../../types/audit';

interface AuditStudioViewProps {
  target: AuditTarget;
  selectedIssueId: string;
  onSelectIssue: (issueId: string) => void;
  onNavigateToFix: (issue: AuditIssue) => void;
  onRescan: () => void;
  onOpenReportModal: () => void;
}

export const AuditStudioView: React.FC<AuditStudioViewProps> = ({
  target,
  selectedIssueId,
  onSelectIssue,
  onNavigateToFix,
  onRescan,
  onOpenReportModal,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | SeverityTier>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const issues = target.issues || [];
  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId);
  const filteredIssues = useMemo(() => issues.filter((issue) => {
    const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
    const query = searchQuery.trim().toLowerCase();
    return matchesSeverity && (!query || `${issue.title} ${issue.selector} ${issue.wcag}`.toLowerCase().includes(query));
  }), [filterSeverity, issues, searchQuery]);
  const renderComparisonGroup = (heading: string, findings: AuditIssue[]) => (
    <div className="bg-surface-container-lowest p-3 rounded-xl">
      <h3 className="text-xs font-bold text-on-surface">{heading} ({findings.length})</h3>
      {findings.length ? (
        <ul className="mt-2 space-y-2">
          {findings.map((issue, index) => (
            <li key={`${issue.ruleId}-${issue.elementId}-${index}`} className="text-xs text-on-surface-variant">
              <span className="font-semibold">{issue.title}</span> · {issue.severity}
              <span className="block mt-1 font-mono break-all">{issue.ruleId} · {issue.selector}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-on-surface-variant">None</p>
      )}
    </div>
  );

  return (
    <section aria-labelledby="studio-heading" className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-outline-variant/20">
        <div className="min-w-0">
          <h1 id="studio-heading" className="font-manrope text-lg md:text-xl font-extrabold text-on-surface font-mono break-all">
            {target.url}
          </h1>
          <p className="mt-2 text-xs text-on-surface-variant">
            Scanned {target.date} · {target.viewport} · {target.standard} · axe-core {target.scannedAt ? 'automated scan' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRescan}
            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 min-target-size"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">refresh</span>
            Rescan
          </button>
          <button
            onClick={onOpenReportModal}
            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 min-target-size"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
            View saved report
          </button>
          {selectedIssue && (
            <button
              onClick={() => onNavigateToFix(selectedIssue)}
              className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 min-target-size"
            >
              Review remediation
            </button>
          )}
        </div>
      </div>

      {target.compareToAuditId && target.comparison && (
        <section aria-labelledby="comparison-heading" className="glass-card bg-surface-container-low rounded-2xl p-5 mb-5 shadow-sm border border-outline-variant/20">
          <h2 id="comparison-heading" className="font-manrope text-base font-bold text-on-surface">Rescan comparison</h2>
          {target.comparison.compatible ? (
            <>
              <p className="mt-1 text-xs text-on-surface-variant">
                Compared with the saved scan from {target.comparison.baselineScannedAt
                  ? new Date(target.comparison.baselineScannedAt).toLocaleString()
                  : 'an earlier date'}. Findings are matched by axe rule ID and affected-element selector.
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Page content, personalization, and dynamic state can change between scans and affect these results.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {renderComparisonGroup('Resolved', target.comparison.resolved)}
                {renderComparisonGroup('Remaining', target.comparison.remaining)}
                {renderComparisonGroup('Newly detected', target.comparison.newlyDetected)}
              </div>
            </>
          ) : (
            <p role="status" className="mt-2 text-sm text-on-surface-variant">
              This saved rescan cannot be compared: {target.comparison.reason}
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 glass-card bg-surface-container-low p-4 rounded-2xl flex flex-col gap-3 shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-manrope text-sm font-bold text-on-surface">Affected elements</h2>
            <span className="bg-primary-container text-on-primary-container text-xs px-2.5 py-0.5 rounded-full font-bold">
              {target.issueCount ?? issues.length} found
            </span>
          </div>
          <label htmlFor="finding-search" className="sr-only">Filter findings by title, selector, or WCAG criterion</label>
          <input
            id="finding-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter findings…"
            className="w-full px-3 py-2 bg-surface text-xs rounded-xl text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          />
          <label htmlFor="severity-filter" className="sr-only">Filter findings by severity</label>
          <select
            id="severity-filter"
            value={filterSeverity}
            onChange={(event) => setFilterSeverity(event.target.value as 'all' | SeverityTier)}
            className="w-full px-3 py-2 bg-surface text-xs rounded-xl text-on-surface border border-outline-variant/30 focus:ring-2 focus:ring-primary"
          >
            <option value="all">All severities</option>
            <option value="Critical">Critical</option>
            <option value="Serious">Serious</option>
            <option value="Moderate">Moderate</option>
            <option value="Minor">Minor</option>
          </select>

          <div className="max-h-[600px] overflow-y-auto flex flex-col gap-2" aria-label="Automated findings">
            {filteredIssues.length ? filteredIssues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => onSelectIssue(issue.id)}
                aria-pressed={selectedIssue?.id === issue.id}
                className={`p-3 text-left bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-outline-variant hover:bg-surface-container transition-colors ${
                  selectedIssue?.id === issue.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-on-surface">{issue.title}</span>
                  <span className="text-[10px] text-outline font-semibold shrink-0">{issue.severity}</span>
                </span>
                <span className="block text-[11px] text-on-surface-variant mt-1.5 truncate font-mono">{issue.selector}</span>
              </button>
            )) : (
              <p className="text-sm text-on-surface-variant p-3">
                {issues.length === 0
                  ? 'Axe-core reported no violations in the rules it ran. This is not proof of WCAG conformance.'
                  : 'No findings match these filters.'}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 glass-card bg-surface-container-low rounded-2xl p-5 shadow-sm border border-outline-variant/20">
          {selectedIssue ? (
            <article aria-labelledby="finding-title" className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-outline">{selectedIssue.severity} · {selectedIssue.category}</p>
                <h2 id="finding-title" className="font-manrope text-lg font-bold text-on-surface mt-1">{selectedIssue.title}</h2>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-container-lowest p-3 rounded-xl">
                  <dt className="font-bold text-on-surface">WCAG reference</dt>
                  <dd className="mt-1 text-on-surface-variant">{selectedIssue.wcag}</dd>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-xl">
                  <dt className="font-bold text-on-surface">Impacted users</dt>
                  <dd className="mt-1 text-on-surface-variant">{selectedIssue.impactedUsers}</dd>
                </div>
                <div className="sm:col-span-2 bg-surface-container-lowest p-3 rounded-xl">
                  <dt className="font-bold text-on-surface">Affected selector</dt>
                  <dd className="mt-1 font-mono text-on-surface-variant break-all">{selectedIssue.selector}</dd>
                </div>
              </dl>
              <div>
                <h3 className="text-xs font-bold text-on-surface">Issue and impact</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{selectedIssue.whyMatters}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-on-surface">Element captured by the scanner</h3>
                <pre className="mt-1 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-xs whitespace-pre-wrap break-all overflow-auto">
                  <code>{selectedIssue.snippet}</code>
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-bold text-on-surface">Suggested correction guidance</h3>
                <p className="mt-1 text-xs text-on-surface-variant">Guidance only; AccessLens does not edit the audited external website.</p>
                <pre className="mt-1 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-xs whitespace-pre-wrap break-all overflow-auto">
                  <code>{selectedIssue.remediation}</code>
                </pre>
              </div>
            </article>
          ) : (
            <div>
              <h2 className="font-manrope text-lg font-bold text-on-surface">Automated evaluation summary</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-surface-container-lowest p-3 rounded-xl"><dt className="text-xs text-on-surface-variant">Passed rules</dt><dd className="font-bold">{target.passedRules ?? 'Not reported'}</dd></div>
                <div className="bg-surface-container-lowest p-3 rounded-xl"><dt className="text-xs text-on-surface-variant">Needs manual review</dt><dd className="font-bold">{target.incompleteRules ?? 'Not reported'}</dd></div>
              </dl>
              <p className="mt-4 text-sm text-on-surface-variant">
                Automated checks only cover supported rules and page states. A qualified manual review is needed before making any WCAG conformance claim.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
