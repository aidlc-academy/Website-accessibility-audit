import React from 'react';
import { AuditTarget } from '../../types/audit';

interface ReportsViewProps {
  audits: AuditTarget[];
  loading: boolean;
  error: string | null;
  onOpenAudit: (auditId: string) => void;
  onOpenReport: (auditId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  audits,
  loading,
  error,
  onOpenAudit,
  onOpenReport,
}) => (
  <section aria-labelledby="reports-heading" className="flex flex-col w-full">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 id="reports-heading" className="font-manrope text-xl md:text-2xl font-bold text-on-surface">
          Saved audit reports
        </h1>
        <p className="text-xs text-on-surface-variant">
          Download generated reports for scans saved on this server. Reports describe automated findings, not a full conformance evaluation.
        </p>
      </div>
    </div>

    <div className="glass-card bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4">
      {loading ? (
        <p role="status" className="text-sm text-on-surface-variant">Loading saved reports…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-error">{error}</p>
      ) : audits.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No reports yet. Completed scans are saved here automatically.</p>
      ) : audits.map((audit) => (
        <article key={audit.id} className="min-w-0 p-4 bg-surface-container-lowest rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline-variant/15">
          <div className="min-w-0 flex-1">
            <h2 className="font-manrope font-bold text-sm text-on-surface truncate">{audit.title}</h2>
            <p className="text-xs text-on-surface-variant font-mono break-all">{audit.url}</p>
            <p className="text-xs text-on-surface-variant mt-1 break-words">
              {audit.reportFilename} · {audit.issueCount ?? audit.issues.length} affected elements · {audit.date}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:max-w-[50%]">
            <button
              onClick={() => onOpenAudit(audit.id)}
              className="bg-surface-container-high text-on-surface text-xs font-bold px-3 py-2 rounded-lg min-target-size"
            >
              Inspect findings
            </button>
            <button
              onClick={() => onOpenReport(audit.id)}
              className="bg-primary text-on-primary text-xs font-bold px-3 py-2 rounded-lg min-target-size"
            >
              Preview report
            </button>
            <a
              href={`/api/audits/${encodeURIComponent(audit.id)}/report`}
              className="bg-surface-container-high text-on-surface text-xs font-bold px-3 py-2 rounded-lg min-target-size"
            >
              Download .md
            </a>
            <a
              href={`/api/audits/${encodeURIComponent(audit.id)}/export.csv`}
              className="bg-primary text-on-primary text-xs font-bold px-3 py-2 rounded-lg min-target-size"
            >
              Download CSV
            </a>
          </div>
        </article>
      ))}
    </div>
  </section>
);
