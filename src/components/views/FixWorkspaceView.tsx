import React, { useState } from 'react';
import { AuditIssue } from '../../types/audit';

interface FixWorkspaceViewProps {
  issue: AuditIssue;
  onNavigateToStudio: () => void;
}

export const FixWorkspaceView: React.FC<FixWorkspaceViewProps> = ({
  issue,
  onNavigateToStudio,
}) => {
  const [suggestion, setSuggestion] = useState(issue.remediation);
  const [statusMessage, setStatusMessage] = useState('');
  const [reviewed, setReviewed] = useState(false);

  const copySuggestion = async () => {
    try {
      await navigator.clipboard.writeText(suggestion);
      setStatusMessage('Correction guidance copied.');
    } catch {
      setStatusMessage('Clipboard access was denied. Select and copy the correction guidance manually.');
    }
  };

  const markReviewed = () => {
    setReviewed(true);
    setStatusMessage('Marked reviewed in this session only. The scanned website was not changed or rescanned.');
  };

  return (
    <section aria-labelledby="fix-heading" className="flex flex-col w-full">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm">
        <div>
          <h1 id="fix-heading" className="font-manrope text-lg md:text-xl font-bold text-on-surface">
            Remediation guidance
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant font-mono break-all">{issue.selector}</p>
        </div>
        <span className="px-2.5 py-1 rounded text-xs font-bold bg-surface-container-high text-on-surface">
          {issue.severity} · {issue.wcag}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 flex flex-col gap-5">
          <article className="glass-card bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant/20">
            <h2 className="font-manrope text-base font-bold text-on-surface">{issue.title}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mt-2">{issue.whyMatters}</p>
            <p className="text-xs text-on-surface-variant mt-3"><strong>Impacted users:</strong> {issue.impactedUsers}</p>
          </article>

          <article className="glass-card bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant/20">
            <h2 className="font-manrope text-sm font-bold text-on-surface">Markup captured by axe-core</h2>
            <pre className="mt-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-xs whitespace-pre-wrap break-all overflow-auto">
              <code>{issue.snippet}</code>
            </pre>
          </article>
        </div>

        <div className="lg:col-span-7 glass-card bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <label htmlFor="remediation-code" className="font-manrope text-sm font-bold text-on-surface">
            Suggested correction
          </label>
          <p className="text-xs text-on-surface-variant mt-1 mb-3">
            Review and adapt this guidance in your own source code. Editing or marking it here does not modify the scanned website.
          </p>
          <textarea
            id="remediation-code"
            value={suggestion}
            onChange={(event) => setSuggestion(event.target.value)}
            rows={12}
            spellCheck={false}
            className="w-full p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono text-on-surface resize-y focus:ring-2 focus:ring-primary"
          />

          {statusMessage && (
            <p role="status" aria-live="polite" className="text-xs text-on-surface-variant mt-3">{statusMessage}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-outline-variant/20">
            <button
              onClick={onNavigateToStudio}
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold px-3 py-2.5 rounded-xl min-target-size"
            >
              Return to findings
            </button>
            <div className="flex gap-2">
              <button
                onClick={copySuggestion}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold px-3 py-2.5 rounded-xl min-target-size"
              >
                Copy guidance
              </button>
              <button
                onClick={markReviewed}
                className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl min-target-size"
              >
                {reviewed ? 'Reviewed this session' : 'Mark reviewed'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
