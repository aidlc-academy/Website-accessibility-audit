# AccessLens - Product Documentation

> **Note**: This document describes an existing, implemented application. AccessLens was developed prior to Kiro adoption and is now maintained using Kiro IDE for continued development.

---

## Product Vision

**AccessLens** is a professional website accessibility audit tool that helps developers, designers, and accessibility professionals identify and fix WCAG 2.2 Level AA compliance issues through automated scanning and actionable remediation guidance.

---

## Target Users

### Primary Users
- **Web Developers**: Need to test their websites for accessibility compliance
- **Accessibility Professionals**: Conducting formal WCAG audits
- **QA Engineers**: Including accessibility in testing workflows
- **College Students**: Learning about web accessibility (demonstration/education)

### User Needs
- Fast, automated accessibility scanning of public websites
- Detailed violation reports with severity classification
- WCAG 2.2 success criterion mapping
- Actionable fix suggestions with code examples
- Export capabilities for documentation and tracking
- Historical audit comparison

---

## Core Features (Implemented)

### 1. Automated Accessibility Scanning
- **Technology**: Puppeteer + axe-core WCAG 2.2 A/AA rule engine
- **Target**: Public HTTP/HTTPS websites
- **Output**: Comprehensive violation reports with affected elements
- **Timeline**: Real-time progress tracking with 6-stage visualization

### 2. Professional Dashboard
- **Overview**: Live statistics, recent audits, quick demo mode
- **Quick Stats**: Total scans, average score, issue counts by severity
- **Recent History**: Last 4 audits with one-click access

### 3. Detailed Results Analysis
- **Severity Classification**: Critical, Serious, Moderate, Minor
- **WCAG Mapping**: Success criterion references for each violation
- **Element Details**: CSS selectors, HTML snippets, affected markup
- **Impact Descriptions**: Why issues matter and who is affected
- **Fix Suggestions**: Before/after code examples for remediation

### 4. Report Generation & Export
- **Markdown Reports**: Full narrative audit documents
- **CSV Export**: Spreadsheet format with all violations
- **PDF Export**: Professional reports via browser print

### 5. Scan History & Comparison
- **Cloud Storage**: Supabase PostgreSQL with row-level security
- **History View**: All saved audits with search/filter
- **Rescan Comparison**: Identifies resolved, new, and remaining issues
- **Baseline Tracking**: Compare fixes against previous scans

### 6. Security Hardening
- **SSRF Protection**: Blocks private IPs, internal networks, cloud metadata endpoints
- **Rate Limiting**: 10 scans per IP per hour
- **URL Validation**: Enforces public HTTP/HTTPS, standard ports only
- **Proxy Filtering**: Runtime request validation including redirects

### 7. Accessibility-First Design
- **WCAG 2.2 AA Compliant**: Interface follows accessibility best practices
- **Keyboard Navigation**: Full keyboard operability with visible focus
- **Screen Reader Support**: ARIA labels, live announcements, semantic HTML
- **Responsive Design**: Mobile, tablet, and desktop support

---

## User Workflows

### Workflow 1: Quick Demo Scan
1. User opens dashboard
2. Clicks "Run Demo" button
3. Watches 6-stage progress animation (5-15 seconds)
4. Reviews results in Audit Studio
5. Downloads Markdown or CSV report

### Workflow 2: Manual Website Audit
1. User enters target URL
2. System validates URL (security checks)
3. Backend launches Puppeteer browser
4. axe-core scans rendered page
5. Results processed and saved to database
6. User explores violations with filters
7. Navigates to Fix Workspace for specific issues
8. Exports report for documentation

### Workflow 3: Fix Tracking & Comparison
1. User opens audit from Scan History
2. Clicks "Rescan this URL"
3. New scan runs with same configuration
4. Comparison engine identifies:
   - ✅ Resolved issues (no longer present)
   - 🆕 New issues (not in baseline)
   - ⚠️ Remaining issues (still present)
5. User documents progress

---

## What AccessLens Tests (Automated)

### ✅ **Covered by axe-core Automation**
- **Images**: Missing alt attributes, decorative image handling
- **Forms**: Labels, accessible names, error identification
- **Buttons**: Accessible names, roles, states
- **Links**: Meaningful link text, accessible names
- **Color Contrast**: WCAG 2.2 AA ratios (4.5:1, 3:1)
- **Headings**: Proper hierarchy (h1-h6)
- **Document Language**: lang attribute presence
- **Page Titles**: Descriptive page titles
- **ARIA**: Attributes, roles, states, properties
- **Target Size**: Minimum touch target dimensions (24x24px)
- **Focus Visible**: Visible focus indicators

### ⚠️ **Requires Manual Testing**
- Keyboard-only navigation and interaction
- Screen reader compatibility and announcement quality
- Meaningful alternative text (subjective quality assessment)
- Focus order and management
- Context-dependent criteria
- Dynamic content updates
- Live captions and audio descriptions
- Logical reading order

**Important**: A perfect automated score does NOT guarantee full WCAG conformance. Manual testing is essential.

---

## Technical Constraints

### Security Limitations (By Design)
- ❌ Cannot scan localhost, private IPs (192.168.x, 10.x, 127.x)
- ❌ Cannot scan internal networks, VPNs, .local domains
- ❌ Cannot scan non-standard ports (only 80/443)
- ❌ Rate limited to 10 scans per IP per hour

### Functional Limitations
- ❌ Cannot scan authenticated pages (login required)
- ❌ Cannot scan sites that block automated access
- ❌ Cannot scan sites with aggressive bot detection
- ❌ Cannot scan dynamic content requiring complex user interaction
- ⏱️ Scan timeout: 60 seconds (configurable)

---

## Success Metrics

### User-Facing Metrics
- **Scan Completion Rate**: Successful scans / Total attempts
- **Average Scan Time**: Time from initiation to results
- **Report Downloads**: CSV and Markdown export usage
- **Rescan Usage**: Percentage of audits that are rescanned

### Technical Metrics
- **Violation Detection**: Average issues found per scan
- **Severity Distribution**: Critical vs. Serious vs. Moderate vs. Minor
- **Scanner Reliability**: axe-core pass/fail/incomplete counts

---

## Future Enhancements (Not Implemented)

These are potential improvements, not current features:

- [ ] Bulk URL scanning from CSV import
- [ ] Scheduled/recurring audits
- [ ] Multi-user collaboration with teams
- [ ] CI/CD pipeline integration (GitHub Actions)
- [ ] Advanced reporting with trend charts
- [ ] Custom rule configuration
- [ ] Authentication for testing logged-in pages
- [ ] Browser extension for quick scans
- [ ] Mobile app companion

---

## Documentation Organization

- **This file (`product.md`)**: Product vision, features, workflows
- **`tech.md`**: Technical architecture, stack, patterns
- **`structure.md`**: Project structure, coding conventions
- **`../specs/accesslens/requirements.md`**: Feature requirements (as implemented)
- **`../specs/accesslens/design.md`**: System design decisions
- **`../specs/accesslens/tasks.md`**: Implementation tracking

---

## References

- **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **axe-core Documentation**: https://github.com/dequelabs/axe-core
- **Puppeteer Documentation**: https://pptr.dev/
- **Supabase Documentation**: https://supabase.com/docs
