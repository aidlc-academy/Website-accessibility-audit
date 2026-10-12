/**
 * AccessLens — Audit Report Generator
 * Generates WCAG 2.2 Level AA audit reports following the workspace standard.
 */

class ReportGenerator {
  static generateMarkdownReport(auditData, stats) {
    const today = new Date().toISOString().split('T')[0];
    const targetUrl = auditData.url || 'https://demo.accesslens.app';
    const issues = auditData.issues || [];

    const criticalIssues = issues.filter(i => i.severity === 'Critical');
    const seriousIssues = issues.filter(i => i.severity === 'Serious');
    const moderateIssues = issues.filter(i => i.severity === 'Moderate');
    const minorIssues = issues.filter(i => i.severity === 'Minor');

    const complianceStatus = stats.score >= 95 ? 'Passed (WCAG 2.2 AA)' : (stats.score >= 70 ? 'Partial Compliance (Remediation Required)' : 'Failed (Critical Blockers Present)');

    let md = `# Website Accessibility Audit Report\n\n`;
    md += `- **Target URL / Application**: \`${targetUrl}\`\n`;
    md += `- **Evaluation Date**: \`${today}\`\n`;
    md += `- **Target Standard**: WCAG 2.2 Level AA\n`;
    md += `- **Auditor**: AccessLens Accessibility Audit Studio (Alex Morgan)\n`;
    md += `- **Audit Methodology**: Automated Engine (Axe-Core / Pa11y Ruleset) + Manual DOM & Keyboard Inspection\n\n`;
    md += `---\n\n`;

    md += `## 1. Executive Summary\n\n`;
    md += `| Total Issues Found | Critical | Serious | Moderate | Minor | Compliance Score | Status |\n`;
    md += `| :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    md += `| **${stats.total}** | **${stats.critical}** | **${stats.serious}** | **${stats.moderate}** | **${stats.minor}** | **${stats.score}%** | **${complianceStatus}** |\n\n`;

    md += `### Summary Overview\n`;
    md += `This comprehensive audit evaluated \`${targetUrl}\` against the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA standard.\n`;
    if (stats.critical > 0) {
      md += `The audit identified **${stats.critical} Critical** barriers which completely block access for assistive technology users, alongside **${stats.serious} Serious** contrast and focus issues.\n\n`;
    } else {
      md += `No critical blockers were identified. Minor improvements recommended below.\n\n`;
    }

    md += `---\n\n`;
    md += `## 2. Issues Inventory by Severity\n\n`;

    // Critical
    md += `### Critical Issues (Blockers)\n\n`;
    if (criticalIssues.length === 0) {
      md += `*None detected.*\n\n`;
    } else {
      criticalIssues.forEach((issue) => {
        md += `#### [${issue.id}] ${issue.title}\n`;
        md += `- **WCAG Success Criterion**: \`${issue.wcag}\`\n`;
        md += `- **Impacted Users**: ${issue.impactedUsers}\n`;
        md += `- **Affected Element / Selector**: \`${issue.selector}\`\n`;
        md += `- **Description**: ${issue.whyMatters}\n`;
        md += `- **Remediation Snippet**:\n`;
        md += `  \`\`\`html\n${issue.remediation}\n  \`\`\`\n\n`;
      });
    }

    // Serious
    md += `---\n\n### Serious Issues\n\n`;
    if (seriousIssues.length === 0) {
      md += `*None detected.*\n\n`;
    } else {
      seriousIssues.forEach((issue) => {
        md += `#### [${issue.id}] ${issue.title}\n`;
        md += `- **WCAG Success Criterion**: \`${issue.wcag}\`\n`;
        md += `- **Impacted Users**: ${issue.impactedUsers}\n`;
        md += `- **Affected Element / Selector**: \`${issue.selector}\`\n`;
        md += `- **Description**: ${issue.whyMatters}\n`;
        md += `- **Remediation Snippet**:\n`;
        md += `  \`\`\`html\n${issue.remediation}\n  \`\`\`\n\n`;
      });
    }

    // Moderate
    md += `---\n\n### Moderate Issues\n\n`;
    if (moderateIssues.length === 0) {
      md += `*None detected.*\n\n`;
    } else {
      moderateIssues.forEach((issue) => {
        md += `#### [${issue.id}] ${issue.title}\n`;
        md += `- **WCAG Success Criterion**: \`${issue.wcag}\`\n`;
        md += `- **Impacted Users**: ${issue.impactedUsers}\n`;
        md += `- **Affected Element / Selector**: \`${issue.selector}\`\n`;
        md += `- **Remediation Snippet**:\n`;
        md += `  \`\`\`html\n${issue.remediation}\n  \`\`\`\n\n`;
      });
    }

    // Minor
    md += `---\n\n### Minor Issues\n\n`;
    if (minorIssues.length === 0) {
      md += `*None detected.*\n\n`;
    } else {
      minorIssues.forEach((issue) => {
        md += `#### [${issue.id}] ${issue.title}\n`;
        md += `- **WCAG Success Criterion**: \`${issue.wcag}\`\n`;
        md += `- **Affected Element / Selector**: \`${issue.selector}\`\n`;
        md += `- **Remediation Snippet**:\n`;
        md += `  \`\`\`html\n${issue.remediation}\n  \`\`\`\n\n`;
      });
    }

    md += `---\n\n## 3. Recommended Remediation Roadmap\n\n`;
    md += `1. **Sprint 1 (Immediate Fixes - Critical)**:\n`;
    md += `   - Fix non-text alternatives on avatar elements (\`SC 1.1.1\`).\n`;
    md += `   - Attach accessible names and labels to search inputs and icon buttons (\`SC 4.1.2\`).\n`;
    md += `2. **Sprint 2 (High Priority - Serious)**:\n`;
    md += `   - Adjust text and UI color tokens to satisfy 4.5:1 minimum contrast (\`SC 1.4.3\`).\n`;
    md += `   - Add \`scroll-padding-top\` to prevent sticky header focus obscuring (\`SC 2.4.11\`).\n`;
    md += `   - Enlarge touch target dimensions to at least 24x24px (\`SC 2.5.8\`).\n`;
    md += `3. **Sprint 3 (Refinement - Moderate & Minor)**:\n`;
    md += `   - Wrap navigation sections in semantic \`<nav>\` landmark regions.\n`;
    md += `   - Enforce sequential heading hierarchy.\n\n`;

    md += `---\n\n## 4. Verification & Retest Instructions\n\n`;
    md += `Run automated regression checks using:\n`;
    md += `\`\`\`bash\nnpx @axe-core/cli ${targetUrl}\n\`\`\`\n`;
    md += `Verify focus and screen reader announcements with Windows Narrator, NVDA, or VoiceOver.\n`;

    return md;
  }

  static downloadReport(markdownContent, filename) {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async saveReportToDisk(markdownContent, filename) {
    try {
      const response = await fetch('/api/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: markdownContent })
      });
      return await response.json();
    } catch (e) {
      console.warn('Backend save unavailable, using client download fallback:', e);
      return { success: false, fallback: true };
    }
  }
}

window.ReportGenerator = ReportGenerator;
