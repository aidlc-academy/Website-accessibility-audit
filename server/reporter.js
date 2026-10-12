import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

const CSV_COLUMNS = [
  'Audit URL',
  'Scan date',
  'Scan status',
  'Scan configuration',
  'Critical findings',
  'Serious findings',
  'Moderate findings',
  'Minor findings',
  'Rule ID',
  'Issue description',
  'Severity',
  'Affected element selector',
  'Affected element markup',
  'WCAG reference',
  'Fix guidance',
];

function codeBlock(value) {
  return `\`\`\`html\n${String(value || '(not captured)').replace(/`/g, '&#96;')}\n\`\`\``;
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function generateCsvReport(audit) {
  const counts = { Critical: 0, Serious: 0, Moderate: 0, Minor: 0 };
  for (const issue of audit.issues || []) {
    if (issue.severity in counts) counts[issue.severity]++;
  }
  const metadata = [
    audit.url,
    audit.scannedAt,
    audit.status || 'completed',
    JSON.stringify(audit.scanConfiguration || {}),
    counts.Critical,
    counts.Serious,
    counts.Moderate,
    counts.Minor,
  ];
  const rows = (audit.issues || []).length
    ? audit.issues.map((issue) => [
      ...metadata,
      issue.ruleId,
      issue.whyMatters || issue.description || issue.title,
      issue.severity,
      issue.selector,
      issue.element || issue.snippet,
      issue.wcagCriterion || issue.wcag,
      issue.remediation || issue.fix?.after,
    ])
    : [[...metadata, '', 'No automated violations were found in the rules that ran.', '', '', '', '', '']];
  return '\uFEFF' + [
    CSV_COLUMNS.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\r\n');
}

export function generateMarkdownReport(audit) {
  const lines = [
    '# Automated Website Accessibility Scan',
    '',
    '> This report contains automated axe-core results only. It is not a manual audit or proof of WCAG conformance. Keyboard, screen-reader, responsive, and context-dependent checks still require human review.',
    '',
    `- **Target:** ${audit.url}`,
    `- **Page title:** ${audit.pageTitle}`,
    `- **Scanned:** ${audit.scannedAt}`,
    `- **Standard rules selected:** ${audit.standard}`,
    `- **Scanner:** axe-core ${audit.axeVersion}`,
    `- **Scan configuration:** ${JSON.stringify(audit.scanConfiguration)}`,
    `- **Scan status:** ${audit.status}`,
    `- **Affected elements:** ${audit.issues.length}`,
    `- **Critical / Serious / Moderate / Minor:** ${audit.issues.filter((issue) => issue.severity === 'Critical').length} / ${audit.issues.filter((issue) => issue.severity === 'Serious').length} / ${audit.issues.filter((issue) => issue.severity === 'Moderate').length} / ${audit.issues.filter((issue) => issue.severity === 'Minor').length}`,
    `- **Passed rules:** ${audit.passedRules}`,
    `- **Rules requiring review:** ${audit.incompleteRules}`,
    '',
  ];

  if (audit.pageLoadError) lines.push(`> **Page load warning:** ${audit.pageLoadError}`, '');
  if (audit.issues.length === 0) {
    lines.push('## Findings', '', 'axe-core reported no violations in the rules it ran on this page state.', '');
  }

  for (const issue of audit.issues) {
    lines.push(
      `## ${issue.title}`,
      '',
      `- **Severity:** ${issue.severity}`,
      `- **WCAG reference:** ${issue.wcagCriterion}`,
      `- **Category:** ${issue.pour}`,
      `- **Selector:** \`${issue.selector.replace(/`/g, '&#96;')}\``,
      `- **Impacted users:** ${issue.impactedUsers}`,
      '',
      `**Description and impact:** ${issue.whyMatters || issue.description || issue.title}`,
      '',
      '**Affected element:**',
      '',
      codeBlock(issue.element),
      '',
      '**Correction guidance:**',
      '',
      codeBlock(issue.fix?.after || 'Review the referenced axe-core rule and apply an appropriate correction.'),
      '',
      issue.helpUrl ? `Reference: ${issue.helpUrl}` : '',
      '',
    );
  }

  lines.push(
    '## Manual verification still required',
    '',
    '- Test all interactive functionality using only a keyboard.',
    '- Review reading order, focus visibility, focus obscuration, and keyboard traps.',
    '- Verify meaningful alternative text and announcements with a screen reader.',
    '- Check responsive reflow, zoom, text resizing, and target spacing.',
    '- Review WCAG 2.2 criteria and contextual content that automated tools cannot determine.',
    '',
  );

  return lines.join('\n');
}

export function saveReport(audit) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const hostname = new URL(audit.url).hostname.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const date = new Date(audit.scannedAt).toISOString().slice(0, 10);
  const filename = `audit-${hostname}-${date}-${audit.id.slice(0, 8)}.md`;
  fs.writeFileSync(path.join(REPORTS_DIR, filename), generateMarkdownReport(audit), 'utf8');
  return { filename };
}
