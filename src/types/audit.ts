export type SeverityTier = 'Critical' | 'Serious' | 'Moderate' | 'Minor';
export type PourCategory = 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';

export interface AuditIssue {
  id: string;
  title: string;
  severity: SeverityTier;
  category: PourCategory;
  wcag: string;
  selector: string;
  elementBadge: string;
  impactedUsers: string;
  whyMatters: string;
  snippet: string;
  remediation: string;
  fixed?: boolean;
  elementId: string;
  ruleId?: string;
}

export interface ScanConfiguration {
  scanner: string;
  axeVersion: string;
  tags: string[];
  viewport: { width: number; height: number };
  timeoutMs: number;
}

export interface AuditComparison {
  compatible: boolean;
  reason: string;
  baselineAuditId: string;
  baselineScannedAt: string;
  resolved: AuditIssue[];
  remaining: AuditIssue[];
  newlyDetected: AuditIssue[];
}

export interface AuditTarget {
  id: string;
  url: string;
  title: string;
  viewport: string;
  standard: string;
  date: string;
  status: 'Needs Review' | 'Passed (AAA)' | 'In Progress' | 'Audit complete';
  issues: AuditIssue[];
  issueCount?: number;
  scannedAt?: string;
  stats?: AuditStats;
  passedRules?: number;
  incompleteRules?: number;
  manualReviewRequired?: boolean;
  reportFilename?: string;
  scanStatus?: 'completed' | 'failed';
  scanConfiguration?: ScanConfiguration;
  compareToAuditId?: string;
  comparison?: AuditComparison;
}

export interface AuditStats {
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  score: number;
  totalFixed: number;
}

export type ViewType = 
  | 'overview' 
  | 'scan' 
  | 'audit-studio' 
  | 'fix-workspace' 
  | 'visualizers'
  | 'scan-history' 
  | 'reports' 
  | 'settings';

export type CVDMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
