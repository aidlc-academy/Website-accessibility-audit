/**
 * AccessLens — Audit Engine
 * Compliant with WCAG 2.2 Level AA & POUR Principles
 */

const AUDIT_PRESETS = {
  'acme-analytics': {
    url: 'https://app.acmecorp.io/dashboard/analytics',
    title: 'Acme Corp Analytics Dashboard',
    viewport: '1440x900 (Desktop)',
    standard: 'WCAG 2.2 Level AA',
    date: 'Oct 24, 2026 - 14:32',
    status: 'Needs Review',
    issues: [
      {
        id: 'CRIT-01',
        title: 'Image missing alternative text',
        severity: 'Critical',
        category: 'Perceivable',
        wcag: 'SC 1.1.1 Non-text Content (Level A)',
        selector: 'img.user-avatar[src="placeholder"]',
        elementBadge: '1',
        impactedUsers: 'Blind users, individuals with low vision who use screen readers, and users on slow connections with images disabled.',
        whyMatters: 'Without alternative text, screen readers announce "image" or the obscure filename, omitting vital context and identity.',
        snippet: '<img src="placeholder" class="user-avatar">',
        remediation: '<img src="placeholder" alt="Alex Morgan profile avatar" class="user-avatar">',
        fixed: false,
        elementId: 'preview-avatar'
      },
      {
        id: 'CRIT-02',
        title: 'Form search input missing accessible label',
        severity: 'Critical',
        category: 'Operable',
        wcag: 'SC 4.1.2 Name, Role, Value (Level A) & SC 3.3.2 Labels or Instructions',
        selector: 'input#dashboard-search[type="text"]',
        elementBadge: '2',
        impactedUsers: 'Screen reader users and speech input users navigating by label names.',
        whyMatters: 'Placeholder text is not a substitute for a programmatically associated label. Screen readers may announce only "edit text".',
        snippet: '<input id="dashboard-search" type="text" placeholder="Search analytics...">',
        remediation: '<label for="dashboard-search" class="sr-only">Search analytics records</label>\n<input id="dashboard-search" type="text" placeholder="Search analytics...">',
        fixed: false,
        elementId: 'preview-search-input'
      },
      {
        id: 'CRIT-03',
        title: 'Icon button missing accessible name',
        severity: 'Critical',
        category: 'Robust',
        wcag: 'SC 4.1.2 Name, Role, Value (Level A) & SC 2.4.4 Link Purpose',
        selector: 'button#btn-quick-action-99',
        elementBadge: '4',
        impactedUsers: 'Screen readers, voice dictation users ("Click Bookmark"), braille display users.',
        whyMatters: 'Screen readers announce this as simply "Button". Users cannot determine what action will occur.',
        snippet: '<button class="icon-btn">\n  <span class="material-symbols-outlined">\n    bookmark\n  </span>\n</button>',
        remediation: '<button class="icon-btn" aria-label="Bookmark this item">\n  <span class="material-symbols-outlined" aria-hidden="true">\n    bookmark\n  </span>\n</button>',
        fixed: false,
        elementId: 'live-target-button'
      },
      {
        id: 'SER-01',
        title: 'Text has insufficient color contrast',
        severity: 'Serious',
        category: 'Perceivable',
        wcag: 'SC 1.4.3 Contrast (Minimum) (Level AA)',
        selector: '#main-navigation > ul > li:nth-child(2) > a',
        elementBadge: '3',
        impactedUsers: 'Low-vision users, color-blind users, users in sunlight/glare environments.',
        whyMatters: 'Contrast ratio is 2.1:1, far below the required 4.5:1 for normal text, making navigation unreadable.',
        snippet: '<a href="#" class="text-[#9286FF] bg-surface">Reports Overview</a>',
        remediation: '<a href="#" class="text-[#3828B5] bg-surface font-medium">Reports Overview</a> <!-- Contrast ratio 7.4:1 -->',
        fixed: false,
        elementId: 'preview-contrast-node'
      },
      {
        id: 'SER-02',
        title: 'Focus indicator obscured by sticky banner',
        severity: 'Serious',
        category: 'Operable',
        wcag: 'SC 2.4.11 Focus Not Obscured (Minimum) (Level AA - WCAG 2.2)',
        selector: 'div.sticky-header-banner + main a:first-of-type',
        elementBadge: '5',
        impactedUsers: 'Keyboard-only navigators, switch device users.',
        whyMatters: 'When tabbing into the top link, the fixed header completely covers the focus indicator, violating WCAG 2.2.',
        snippet: '<div class="fixed top-0 left-0 right-0 h-16">Header</div>\n<a href="#quick-stats" class="focus-visible">Jump to Stats</a>',
        remediation: 'html {\n  scroll-padding-top: 4.5rem; /* Prevents sticky header from obscuring keyboard focus */\n}',
        fixed: false,
        elementId: 'preview-obscured-node'
      },
      {
        id: 'SER-03',
        title: 'Interactive target smaller than 24x24 CSS pixels',
        severity: 'Serious',
        category: 'Operable',
        wcag: 'SC 2.5.8 Target Size (Minimum) (Level AA - WCAG 2.2)',
        selector: 'button.tag-filter-pill',
        elementBadge: '6',
        impactedUsers: 'Users with hand tremors, motor impairments, mobile and touch device users.',
        whyMatters: 'Interactive hit area is only 16x16px, causing accidental taps and missed clicks.',
        snippet: '<button class="tag-filter-pill p-0.5 text-xs w-4 h-4">×</button>',
        remediation: '<button class="tag-filter-pill p-2 text-xs min-w-[24px] min-h-[24px] inline-flex items-center justify-center">×</button>',
        fixed: false,
        elementId: 'preview-target-size'
      },
      {
        id: 'MOD-01',
        title: 'Missing landmark region for secondary navigation',
        severity: 'Moderate',
        category: 'Operable',
        wcag: 'SC 1.3.1 Info and Relationships (Level A) & SC 2.4.1 Bypass Blocks',
        selector: 'div.sidebar-secondary-menu',
        elementBadge: '7',
        impactedUsers: 'Screen reader users navigating by ARIA landmarks.',
        whyMatters: 'Users cannot use landmark navigation shortcuts (e.g., "D" in NVDA/JAWS) to jump directly into the workspace menu.',
        snippet: '<div class="sidebar-secondary-menu">\n  <a href="#">Filter 1</a>\n</div>',
        remediation: '<nav aria-label="Secondary Filters" class="sidebar-secondary-menu">\n  <a href="#">Filter 1</a>\n</nav>',
        fixed: false,
        elementId: 'preview-landmark'
      },
      {
        id: 'MOD-02',
        title: 'Heading order skips from H2 directly to H4',
        severity: 'Moderate',
        category: 'Understandable',
        wcag: 'SC 1.3.1 Info and Relationships (Level A)',
        selector: 'h4.metric-card-title',
        elementBadge: '8',
        impactedUsers: 'Screen reader users scanning page structure via Heading lists.',
        whyMatters: 'Skipping levels confuses users regarding parent-child content relationships.',
        snippet: '<h2 class="section-title">Metrics</h2>\n<h4 class="metric-card-title">Daily Conversions</h4>',
        remediation: '<h2 class="section-title">Metrics</h2>\n<h3 class="metric-card-title">Daily Conversions</h3>',
        fixed: false,
        elementId: 'preview-heading'
      },
      {
        id: 'MIN-01',
        title: 'Redundant title attribute on button with visible label',
        severity: 'Minor',
        category: 'Robust',
        wcag: 'SC 4.1.2 Name, Role, Value (Level A)',
        selector: 'button#btn-export-csv',
        elementBadge: '9',
        impactedUsers: 'Screen reader users experiencing double announcement.',
        whyMatters: 'Matching title attribute causes duplicate spoken phrases on certain assistive technology combinations.',
        snippet: '<button title="Export CSV" class="btn">Export CSV</button>',
        remediation: '<button class="btn">Export CSV</button>',
        fixed: false,
        elementId: 'preview-redundant-title'
      }
    ]
  },
  'acme-checkout': {
    url: 'https://checkout.acmecorp.com/cart',
    title: 'Acme Corp E-Commerce Checkout',
    viewport: '1440x900 (Desktop)',
    standard: 'WCAG 2.2 Level AAA',
    date: 'Oct 22, 2026 - 09:15',
    status: 'Passed (AAA)',
    issues: []
  },
  'marketing-pricing': {
    url: 'https://marketing.acmecorp.io/pricing',
    title: 'Acme Marketing Pricing Page',
    viewport: '1440x900 (Desktop)',
    standard: 'WCAG 2.2 Level AA',
    date: 'Oct 19, 2026 - 18:40',
    status: 'In Progress',
    issues: [
      {
        id: 'SER-10',
        title: 'Pricing toggle button lacks pressed state announcement',
        severity: 'Serious',
        category: 'Operable',
        wcag: 'SC 4.1.2 Name, Role, Value (Level A)',
        selector: 'button#toggle-billing-annual',
        elementBadge: '1',
        impactedUsers: 'Screen reader users checking billing cycle pricing.',
        whyMatters: 'Does not convey aria-pressed="true/false", leaving user unsure whether annual discount is selected.',
        snippet: '<button id="toggle-billing-annual" class="toggle-pill">Annual (Save 20%)</button>',
        remediation: '<button id="toggle-billing-annual" aria-pressed="true" class="toggle-pill">Annual (Save 20%)</button>',
        fixed: false,
        elementId: 'preview-pricing-toggle'
      }
    ]
  }
};

class AuditEngine {
  constructor() {
    this.currentAudit = AUDIT_PRESETS['acme-analytics'];
    this.scanInterval = null;
  }

  getAuditData() {
    return this.currentAudit;
  }

  calculateStats() {
    const issues = this.currentAudit.issues || [];
    const critical = issues.filter(i => i.severity === 'Critical' && !i.fixed).length;
    const serious = issues.filter(i => i.severity === 'Serious' && !i.fixed).length;
    const moderate = issues.filter(i => i.severity === 'Moderate' && !i.fixed).length;
    const minor = issues.filter(i => i.severity === 'Minor' && !i.fixed).length;
    const total = critical + serious + moderate + minor;
    const penalty = (critical * 12) + (serious * 6) + (moderate * 2.5) + (minor * 1);
    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    return {
      total,
      critical,
      serious,
      moderate,
      minor,
      score,
      totalFixed: issues.filter(i => i.fixed).length
    };
  }

  loadPreset(presetKey) {
    if (AUDIT_PRESETS[presetKey]) {
      // Deep clone so fixes can be applied interactively
      this.currentAudit = JSON.parse(JSON.stringify(AUDIT_PRESETS[presetKey]));
      return this.currentAudit;
    }
    return null;
  }

  startAuditScan(url, onProgress, onComplete) {
    let progress = 0;
    let elapsedSeconds = 0;

    const stages = [
      { at: 10, label: 'Connecting & Handshaking with Target Host...' },
      { at: 25, label: 'Crawling DOM Tree & Computing CSS Layout Tree...' },
      { at: 45, label: 'Evaluating WCAG 2.2 POUR Principles (Perceivable & Operable)...' },
      { at: 65, label: 'Running Color Contrast Matrix & Target Size Checks (SC 2.5.8)...' },
      { at: 85, label: 'Testing Keyboard Trap, Tab Flow & SC 2.4.11 Focus Obscured...' },
      { at: 98, label: 'Synthesizing Issue Inventory & Calculating Compliance Score...' },
      { at: 100, label: 'Audit Complete!' }
    ];

    if (this.scanInterval) clearInterval(this.scanInterval);

    this.scanInterval = setInterval(() => {
      progress += 4;
      elapsedSeconds += 0.5;

      const currentStage = stages.find(s => progress <= s.at) || stages[stages.length - 1];

      if (onProgress) {
        onProgress({
          progress: Math.min(100, progress),
          elapsedSeconds: Math.floor(elapsedSeconds),
          stageText: currentStage.label,
          url: url
        });
      }

      if (progress >= 100) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
        if (onComplete) onComplete(this.currentAudit);
      }
    }, 200);
  }

  cancelAuditScan() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  toggleIssueFixed(issueId, fixedState = true) {
    const issue = this.currentAudit.issues.find(i => i.id === issueId);
    if (issue) {
      issue.fixed = fixedState;
      return true;
    }
    return false;
  }
}

window.AuditEngine = AuditEngine;
