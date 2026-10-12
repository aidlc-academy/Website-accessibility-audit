import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCsvReport, generateMarkdownReport } from '../server/reporter.js';

const auditFixture = {
  id: 'audit-12345678',
  url: 'https://example.com/path',
  scannedAt: '2026-02-01T12:00:00.000Z',
  status: 'completed',
  pageTitle: 'Example',
  standard: 'WCAG 2.2 Level AA',
  axeVersion: '4.14.0',
  scanConfiguration: { viewport: { width: 1280, height: 900 }, timeoutMs: 60000 },
  passedRules: 15,
  incompleteRules: 2,
  issues: [
    {
      ruleId: 'image-alt',
      title: 'Images must have alternate text',
      severity: 'Serious',
      selector: '#logo, img',
      element: '<img src="logo.png">',
      wcagCriterion: '1.1.1 Non-text Content',
      whyMatters: '=HYPERLINK("https://attacker.example","open")',
      remediation: 'Add alt="Company logo".',
    },
    {
      ruleId: 'link-name',
      title: 'Links must have discernible text',
      severity: 'Moderate',
      selector: '#help',
      element: '<a id="help">\n</a>',
      wcag: '2.4.4 Link Purpose',
      description: 'A "quoted", multiline\nvalue.',
      fix: { after: 'Give the link a descriptive name.' },
    },
  ],
};

test('CSV exports saved audit metadata and safely escaped findings', () => {
  const csv = generateCsvReport(auditFixture);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"https:\/\/example\.com\/path","2026-02-01T12:00:00\.000Z","completed"/);
  assert.match(csv, /"0","1","1","0","image-alt"/);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/attacker\.example"",""open""\)"/);
  assert.match(csv, /"#logo, img","<img src=""logo\.png"">","1\.1\.1 Non-text Content","Add alt=""Company logo""\."/);
  assert.match(csv, /"A ""quoted"", multiline\nvalue\."/);
  assert.match(csv, /"<a id=""help"">\n<\/a>","2\.4\.4 Link Purpose","Give the link a descriptive name\."/);
  assert.equal((csv.match(/\r\n/g) || []).length, 2);
});

test('CSV exports metadata for audits with no findings', () => {
  const csv = generateCsvReport({ ...auditFixture, issues: [] });
  assert.match(csv, /"0","0","0","0","","No automated violations were found in the rules that ran\."/);
});

test('Markdown reports use descriptions returned by the scanner', () => {
  const markdown = generateMarkdownReport(auditFixture);
  assert.match(markdown, /\*\*Description and impact:\*\* =HYPERLINK/);
  assert.match(markdown, /\*\*Critical \/ Serious \/ Moderate \/ Minor:\*\* 0 \/ 1 \/ 1 \/ 0/);
  assert.match(markdown, /not .*proof of WCAG conformance/i);
});
