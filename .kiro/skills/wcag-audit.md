---
name: wcag-audit
description: >-
  Audit a web page, live URL, or frontend component against WCAG 2.2 Level AA standards.
  Use this skill whenever the user asks to run an accessibility audit, test a website for WCAG compliance,
  evaluate screen reader or keyboard accessibility, or generate an accessibility remediation report.
---

# WCAG 2.2 Accessibility Audit Skill

This skill provides a standardized, end-to-end procedure for auditing web applications and pages against the **W3C Web Content Accessibility Guidelines (WCAG) 2.2 Level AA**.

> **Note**: This skill documents manual audit procedures. AccessLens provides automated scanning via axe-core, but manual testing is still required for complete WCAG conformance.

---

## Audit Workflow

```
[Target URL / Component] 
       │
       ▼
 1. Automated Scan (Axe / Pa11y CLI)
       │
       ▼
 2. Interactive & Keyboard Verification
       │
       ▼
 3. Visual & Responsive Inspection (Contrast, Zoom 200%, Target Size)
       │
       ▼
 4. Semantic & Assistive Tech Analysis (ARIA, Landmarks, Forms)
       │
       ▼
 5. Generate Audit Report (Using Report Template)
```

---

## Step 1: Automated Scanning

Run automated checks first to identify rapid low-hanging issues (contrast, unlabelled inputs, broken ARIA references).

### Using AccessLens (Recommended)

```bash
# Start AccessLens development server
npm run dev

# Open browser to http://localhost:5173
# Enter target URL and click "Run accessibility audit"
# Review automated findings in Audit Studio
```

### Alternative: CLI Tools

On Windows PowerShell, use `npx.cmd`:

```powershell
# Run axe-core CLI on a target URL
npx.cmd @axe-core/cli https://example.com --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa

# Or run Pa11y with WCAG22AA runner
npx.cmd pa11y --standard WCAG2AA https://example.com
```

If testing raw HTML files locally or offline, inspect the DOM directly or pass the local server URL (e.g. `http://localhost:3000`).

---

## Step 2: Keyboard & Focus Navigation Check

Automated tools miss the majority of keyboard interaction failures. Manually verify:

1. **Tab Navigation**:
   - Can all interactive elements (links, buttons, inputs, modals) be reached using <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd>?
   - Is there any **Keyboard Trap** (SC 2.1.2) where focus cannot escape?

2. **Logical Focus Order (SC 2.4.3)**:
   - Does focus follow visual reading order, including modals and drawers?

3. **Focus Visible (SC 2.4.7)** & **Focus Not Obscured (SC 2.4.11 - WCAG 2.2)**:
   - Is an outline or visual indicator clearly visible on every focused element?
   - When focused, is the item hidden under fixed headers, cookie banners, or sticky footers?

4. **Skip Links (SC 2.4.1)**:
   - Is there a "Skip to main content" link as the first focusable element?

---

## Step 3: Visual & Input Modalities Check

1. **Color Contrast (SC 1.4.3 & 1.4.11)**:
   - Regular body text (< 18pt or < 14pt bold): minimum **4.5:1** contrast ratio.
   - Large text (≥ 18pt or ≥ 14pt bold): minimum **3.0:1** contrast ratio.
   - Graphical UI components & active states: minimum **3.0:1** contrast ratio.

2. **Target Size (Minimum) (SC 2.5.8 - WCAG 2.2)**:
   - Interactive touch/click targets must be at least **24x24 CSS pixels** or have sufficient spacing offset.

3. **Reflow & Text Resize (SC 1.4.4 & 1.4.10)**:
   - Content must zoom to 200% without loss of content or functionality.
   - Responsive layout at 320px width without horizontal scrollbars (except data tables/maps).

---

## Step 4: Semantic Structure & Assistive Technology

1. **Page Landmarks**:
   - `<header>` / `role="banner"`, `<nav>` / `role="navigation"`, `<main>` / `role="main"`, `<footer>` / `role="contentinfo"`.

2. **Headings Hierarchy (SC 1.3.1)**:
   - Exactly one logical `<h1>`, without skipped heading levels (`h1` -> `h2` -> `h3`).

3. **Images & Media (SC 1.1.1)**:
   - Informative images must have descriptive `alt` text.
   - Decorative images must have `alt=""` or `aria-hidden="true"`.

4. **Form Controls & Inputs (SC 3.3.2, 4.1.2)**:
   - Explicit `<label for="...">` or `aria-labelledby` for every field.
   - Required fields indicated textually, not just by color.
   - Inline error messages associated with `aria-describedby` and `aria-invalid="true"`.

---

## Step 5: Report Generation

### Using AccessLens Reports

1. Complete automated scan in Access Lens
2. Click "Download Report" for Markdown or CSV
3. Supplement automated findings with manual test results
4. Document keyboard navigation issues
5. Add screen reader testing notes
6. Include screenshots of focus indicators and contrast issues

### Manual Report Structure

If creating reports manually:

1. **Executive Summary**
   - Target URL and scan date
   - Overall WCAG 2.2 Level AA conformance status
   - Total violations by severity

2. **Findings by Severity**
   - Critical, Serious, Moderate, Minor
   - For each finding:
     - WCAG Success Criterion (e.g., `WCAG 2.2 SC 2.5.8 Target Size (Minimum)`)
     - Affected Element Selector
     - Impact Description (who is affected)
     - Code Remediation (Before & After)
     - Screenshot (if applicable)

3. **Manual Testing Results**
   - Keyboard navigation findings
   - Screen reader compatibility notes
   - Focus management issues
   - Context-dependent issues

4. **Recommendations**
   - Prioritized action items
   - Implementation guidance
   - Resources and references

Save report in `reports/audit-<target-name>-YYYY-MM-DD.md`.

---

## Reference Materials

### WCAG 2.2 Quick Reference
https://www.w3.org/WAI/WCAG22/quickref/

### axe-core Rule Descriptions
https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md

### AccessLens Features
- Automated axe-core scanning
- WCAG 2.2 success criterion mapping
- Severity classification
- Fix suggestions with code examples
- Report export (Markdown, CSV, PDF)
- Scan history and comparison

---

## Integration with AccessLens

This skill complements AccessLens automated scanning:

1. **Automated First**: Run AccessLens scan to identify machine-detectable issues
2. **Manual Second**: Use this skill's procedures for keyboard, screen reader, and context testing
3. **Combined Report**: Merge automated findings with manual test results
4. **Track Progress**: Use AccessLens comparison feature to verify fixes

---

## Testing Checklist

Use this checklist for manual verification:

### Keyboard Accessibility
- [ ] All interactive elements reachable via Tab
- [ ] Logical focus order
- [ ] Visible focus indicators
- [ ] No keyboard traps
- [ ] Skip link present and functional

### Screen Reader
- [ ] All content announced correctly
- [ ] Form labels and instructions clear
- [ ] Error messages associated with fields
- [ ] Dynamic content updates announced
- [ ] ARIA landmarks identified

### Visual & Responsive
- [ ] Text contrast meets 4.5:1 or 3:1 (large)
- [ ] Touch targets ≥ 24x24 CSS pixels
- [ ] Content zooms to 200% without loss
- [ ] No horizontal scroll at 320px width
- [ ] High contrast mode supported

### Semantic HTML
- [ ] Single h1, proper heading hierarchy
- [ ] Form labels explicit
- [ ] Images have appropriate alt text
- [ ] Landmark regions present
- [ ] Valid HTML

---

## Common Patterns & Fixes

### Missing Alt Text
```html
<!-- Before (violation) -->
<img src="logo.png">

<!-- After (fixed) -->
<img src="logo.png" alt="AccessLens - Website Accessibility Audit Tool">
```

### Missing Form Label
```html
<!-- Before (violation) -->
<input type="email" placeholder="Email">

<!-- After (fixed) -->
<label for="email">Email Address</label>
<input type="email" id="email" placeholder="you@example.com">
```

### Low Contrast
```css
/* Before (violation - 2.5:1 contrast) */
.button {
  color: #757575;
  background: #ffffff;
}

/* After (fixed - 4.6:1 contrast) */
.button {
  color: #595959;
  background: #ffffff;
}
```

### Missing Button Label
```html
<!-- Before (violation) -->
<button><span class="icon-close"></span></button>

<!-- After (fixed) -->
<button aria-label="Close dialog">
  <span class="icon-close" aria-hidden="true"></span>
</button>
```

---

## Notes

- **Automated tools detect ~30-40% of WCAG issues**. Manual testing is essential.
- **Focus on user impact**: Prioritize issues that completely block access.
- **Test with real assistive technology**: Screen readers (NVDA, JAWS, VoiceOver), keyboard-only.
- **Document limitations**: Note what was tested and what requires further review.

---

## Skill Usage Example

```
User: "Audit the login page for WCAG 2.2 AA compliance"

Agent Response:
1. I'll run an automated AccessLens scan first
2. Then perform manual keyboard testing
3. Check focus indicators and contrast
4. Verify form labels and error handling
5. Generate a comprehensive report

[Proceeds with automated scan]
[Documents manual test findings]
[Creates combined report with all issues]
```

---

This skill document is preserved from the original `.agents/skills/wcag-audit/` structure and migrated to Kiro format. Supporting reference materials are available in the original location for historical reference.
