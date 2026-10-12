# Website Accessibility Audit — Workspace Rules

This workspace is dedicated to conducting comprehensive web accessibility audits and delivering remediation recommendations compliant with the **Web Content Accessibility Guidelines (WCAG) 2.2 Level AA**.

---

## 1. Core Principles (POUR)

Every audit evaluation must verify compliance against the four W3C POUR principles:

1. **Perceivable**: Information and user interface components must be presentable to users in ways they can perceive (text alternatives, captions, adaptable structure, color contrast).
2. **Operable**: User interface components and navigation must be operable (full keyboard accessibility, sufficient time, seizure prevention, navigable landmarks, input modalities).
3. **Understandable**: Information and operation of the user interface must be understandable (readable text, predictable navigation, input assistance and error prevention).
4. **Robust**: Content must be robust enough to be interpreted reliably by a wide variety of user agents, including assistive technologies (valid semantics, appropriate ARIA roles/states/properties).

---

## 2. Target Standards: WCAG 2.2 Level AA

Audits must test against all WCAG 2.1 AA criteria plus the **new WCAG 2.2 criteria**:

- **SC 2.4.11 Focus Not Obscured (Minimum) (Level AA)**: When a UI component receives keyboard focus, it must not be entirely hidden behind author-created content (e.g., sticky headers/footers, dialog overlays).
- **SC 2.5.7 Dragging Movements (Level AA)**: Any functionality that uses dragging must also be achievable with a single pointer without dragging (unless dragging is essential).
- **SC 2.5.8 Target Size (Minimum) (Level AA)**: Pointer interactive targets must be at least 24x24 CSS pixels, or have sufficient spacing offset, unless inline or browser-default.
- **SC 3.2.6 Consistent Help (Level A)**: Help mechanisms (contact info, FAQ, chat) recurring on multiple pages must be in the same relative order.
- **SC 3.3.7 Redundant Entry (Level A)**: Information previously entered by the user in a multi-step process must be auto-populated or available for selection.
- **SC 3.3.8 Accessible Authentication (Minimum) (Level AA)**: Cognitive function tests (e.g., memorizing passwords or solving puzzles) must have an accessible alternative or mechanism (like password manager auto-fill).

*(Note: WCAG 4.1.1 Parsing has been obsoleted in WCAG 2.2.)*

---

## 3. Severity Classification

Every identified violation must be classified under one of the four severity tiers:

| Severity | Definition | User Impact |
| :--- | :--- | :--- |
| **Critical** | Completely blocks access to key functionality or content with no workaround. | E.g., Keyboard focus trap, missing form submit button label, screen reader cannot complete checkout. |
| **Serious** | Causes significant barrier or confusion; workaround is difficult or tedious. | E.g., Missing alt text on informative graphs, color contrast below 3:1 on body text, missing form error messages. |
| **Moderate** | Causes inconvenience or minor hindrance; workaround exists. | E.g., Heading hierarchy skips levels, missing landmark regions, link text vague out of context. |
| **Minor** | Cosmetic or technical deviation that has minimal impact on assistive tech. | E.g., Redundant title attribute matching button text, duplicate IDs on non-interactive elements. |

---

## 4. Audit Workflow Guidelines

1. **Automated + Manual Complementarity**:
   - Automated scanners (Axe, Pa11y, Lighthouse) catch ~30–40% of WCAG issues (contrast, missing labels, duplicate IDs).
   - Always conduct manual/structural checks for keyboard navigation, logical focus order, dynamic content announcements (`aria-live`), and meaningful alt text.
2. **Actionable Remediation**:
   - Every reported issue MUST include:
     - **WCAG Success Criterion reference** (e.g., `WCAG 2.2 SC 1.4.3 Contrast (Minimum)`).
     - **Exact CSS selector / DOM element** location.
     - **Issue Description & Impacted User Group** (e.g., blind users, low-vision users, keyboard-only users).
     - **Concrete code fix**: Provide a before-and-after HTML, CSS, or ARIA snippet.
3. **Report Saving**:
   - Save audit reports in the `reports/` directory with the naming convention:
     `reports/audit-<domain-or-component>-YYYY-MM-DD.md`.
