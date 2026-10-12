---
name: wcag-audit
description: >-
  Audit a web page, live URL, or frontend component against WCAG 2.2 Level AA standards.
  Use this skill whenever the user asks to run an accessibility audit, test a website for WCAG compliance,
  evaluate screen reader or keyboard accessibility, or generate an accessibility remediation report.
---

# WCAG 2.2 Accessibility Audit Skill

This skill provides a standardized, end-to-end procedure for auditing web applications and pages against the **W3C Web Content Accessibility Guidelines (WCAG) 2.2 Level AA**.

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

### Running automated scan via CLI:
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

1. Use the preformatted template in [audit-report-template.md](./resources/audit-report-template.md).
2. Tally findings into **Critical**, **Serious**, **Moderate**, and **Minor**.
3. For each finding, provide:
   - WCAG Success Criterion (e.g., `WCAG 2.2 SC 2.5.8 Target Size (Minimum)`)
   - Affected Element Selector
   - Impact Description
   - Code Remediation (Before & After)
4. Save report in `reports/audit-<target-name>-YYYY-MM-DD.md`.

---

## Reference Guides

- Comprehensive Checklist: [wcag-2.2-checklist.md](./references/wcag-2.2-checklist.md)
- Standard Report Template: [audit-report-template.md](./resources/audit-report-template.md)
