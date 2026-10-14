import {
  AuditComparison,
  AuditIssue,
  AuditStats,
  AuditTarget,
  PourCategory,
  ScanConfiguration,
  SeverityTier,
} from '../types/audit';
import { getAuthHeaders } from './authApi';

interface ApiAudit {
  id: string;
  url: string;
  pageTitle: string;
  scannedAt: string;
  status?: 'completed' | 'failed';
  standard: string;
  viewport: string;
  scanConfiguration?: ScanConfiguration;
  compareToAuditId?: string;
  comparison?: {
    compatible: boolean;
    reason: string;
    baselineAuditId: string;
    baselineScannedAt: string;
    resolved: ApiIssue[];
    remaining: ApiIssue[];
    newlyDetected: ApiIssue[];
  };
  issues?: ApiIssue[];
  issueCount?: number;
  stats?: AuditStats;
  passedRules?: number;
  incompleteRules?: number;
  manualReviewRequired?: boolean;
  reportFilename?: string;
}

interface ApiIssue {
  id: string;
  title: string;
  severity: SeverityTier;
  category?: PourCategory;
  pour?: PourCategory;
  wcag?: string;
  wcagCriterion?: string;
  selector: string;
  element?: string;
  snippet?: string;
  elementBadge?: string;
  impactedUsers?: string;
  whyMatters?: string;
  description?: string;
  impact?: string;
  remediation?: string;
  fix?: { before?: string; after?: string; description?: string };
  elementId?: string;
  fixed?: boolean;
  helpUrl?: string;
  ruleId?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { ...getAuthHeaders(), ...init?.headers },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Cannot connect to the audit backend. Make sure the project server is running.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || `The audit backend returned HTTP ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

function toIssue(issue: ApiIssue, index: number): AuditIssue {
  return {
    id: issue.id,
    title: issue.title,
    severity: issue.severity,
    category: issue.category || issue.pour || 'Robust',
    wcag: issue.wcag || issue.wcagCriterion || 'WCAG criterion not reported',
    selector: issue.selector,
    elementBadge: issue.elementBadge || String(index + 1),
    impactedUsers: issue.impactedUsers || 'Impact depends on the affected content and assistive technology.',
    whyMatters: issue.whyMatters || issue.impact || issue.description || issue.title,
    snippet: issue.snippet || issue.element || '(element markup unavailable)',
    remediation: issue.remediation || issue.fix?.after || 'Review the axe-core help reference and correct the reported issue.',
    fixed: issue.fixed,
    elementId: issue.elementId || '',
    ruleId: issue.ruleId,
  };
}

function toTarget(audit: ApiAudit): AuditTarget {
  const issues = (audit.issues || []).map(toIssue);
  const comparison: AuditComparison | undefined = audit.comparison
    ? {
      ...audit.comparison,
      resolved: audit.comparison.resolved.map(toIssue),
      remaining: audit.comparison.remaining.map(toIssue),
      newlyDetected: audit.comparison.newlyDetected.map(toIssue),
    }
    : undefined;
  return {
    id: audit.id,
    url: audit.url,
    title: audit.pageTitle,
    viewport: audit.viewport,
    standard: audit.standard,
    date: new Date(audit.scannedAt).toLocaleString(),
    status: (audit.issueCount ?? issues.length) > 0 ? 'Needs Review' : 'Audit complete',
    issues,
    issueCount: audit.issueCount ?? issues.length,
    scannedAt: audit.scannedAt,
    stats: audit.stats,
    passedRules: audit.passedRules,
    incompleteRules: audit.incompleteRules,
    manualReviewRequired: audit.manualReviewRequired,
    reportFilename: audit.reportFilename,
    scanStatus: audit.status,
    scanConfiguration: audit.scanConfiguration,
    compareToAuditId: audit.compareToAuditId,
    comparison,
  };
}

export async function listAudits(): Promise<AuditTarget[]> {
  const result = await request<{ audits: ApiAudit[] }>('/api/audits');
  return result.audits.map(toTarget);
}

export async function getAudit(id: string, signal?: AbortSignal): Promise<AuditTarget> {
  const result = await request<{ audit: ApiAudit }>(`/api/audits/${encodeURIComponent(id)}`, { signal });
  return toTarget(result.audit);
}

export async function runAudit(url: string, signal?: AbortSignal, compareToAuditId?: string): Promise<AuditTarget> {
  const result = await request<{ audit: ApiAudit }>('/api/audits', {
    method: 'POST',
    body: JSON.stringify({ url, ...(compareToAuditId ? { compareToAuditId } : {}) }),
    signal,
  });
  return toTarget(result.audit);
}

export async function listReports(): Promise<Array<{
  auditId: string;
  url: string;
  pageTitle: string;
  scannedAt: string;
  issueCount: number;
  filename: string;
}>> {
  const result = await request<{ reports: Array<{
    auditId: string;
    url: string;
    pageTitle: string;
    scannedAt: string;
    issueCount: number;
    filename: string;
  }> }>('/api/reports');
  return result.reports;
}

export function statsForTarget(target: AuditTarget): AuditStats {
  if (target.stats) return target.stats;
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  target.issues.forEach(({ severity }) => {
    counts[severity.toLowerCase() as keyof typeof counts]++;
  });
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return {
    ...counts,
    total,
    score: Math.max(0, Math.round(100 - counts.critical * 12 - counts.serious * 6 - counts.moderate * 2.5 - counts.minor)),
    totalFixed: target.issues.filter((issue) => issue.fixed).length,
  };
}
