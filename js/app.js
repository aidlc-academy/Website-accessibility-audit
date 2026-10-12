/**
 * AccessLens — Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Engines
  const auditEngine = new AuditEngine();
  const threeManager = new ThreeSceneManager('canvas-container');
  const fixWorkspace = new FixWorkspaceController(auditEngine, () => updateDashboardMetrics());

  // Global State
  let currentView = 'overview';
  let is3DMode = true;
  let selectedIssueId = 'CRIT-01';

  // DOM Elements
  const views = {
    overview: document.getElementById('view-overview'),
    scan: document.getElementById('view-scan'),
    'audit-studio': document.getElementById('view-audit-studio'),
    'fix-workspace': document.getElementById('view-fix-workspace'),
    reports: document.getElementById('view-reports'),
    'scan-history': document.getElementById('view-history'),
    settings: document.getElementById('view-settings')
  };

  const navLinks = document.querySelectorAll('nav a[data-path]');
  const stepperPill = document.getElementById('stepper-indicator');
  const liveRegion = document.getElementById('a11y-live-announcer');

  // Announce to Screen Readers
  function announce(message) {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  // View Navigation
  function switchView(viewName) {
    if (!views[viewName]) return;

    currentView = viewName;

    // Toggle View Sections
    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === viewName) {
          views[key].classList.remove('hidden');
        } else {
          views[key].classList.add('hidden');
        }
      }
    });

    // Update Sidebar Navigation States
    navLinks.forEach(link => {
      const path = link.getAttribute('data-path');
      if (path === viewName) {
        link.classList.add('bg-primary-container', 'text-on-primary-container', 'font-medium');
        link.classList.remove('text-on-surface-variant');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-medium');
        link.classList.add('text-on-surface-variant');
        link.removeAttribute('aria-current');
      }
    });

    // Update Stepper Indicator
    if (stepperPill) {
      const steps = ['scan', 'audit-studio', 'fix-workspace', 'reports'];
      const stepLabels = {
        overview: 'Overview',
        scan: 'Scan (Active)',
        'audit-studio': 'Inspect (Active)',
        'fix-workspace': 'Fix (Active)',
        reports: 'Verify (Active)',
        'scan-history': 'History',
        settings: 'Settings'
      };
      stepperPill.innerHTML = `
        <span class="text-label-sm ${viewName === 'scan' ? 'text-primary font-semibold' : 'text-on-surface-variant'}">Scan</span>
        <span class="text-outline-variant">/</span>
        <span class="text-label-sm ${viewName === 'audit-studio' ? 'text-primary font-semibold' : 'text-on-surface-variant'}">Inspect</span>
        <span class="text-outline-variant">/</span>
        <span class="text-label-sm ${viewName === 'fix-workspace' ? 'text-primary font-semibold' : 'text-on-surface-variant'}">Fix</span>
        <span class="text-outline-variant">/</span>
        <span class="text-label-sm ${viewName === 'reports' ? 'text-primary font-semibold' : 'text-on-surface-variant'}">Verify</span>
      `;
    }

    // Scroll to Top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    announce(`Navigated to ${viewName.replace('-', ' ')} view`);

    // View specific hooks
    if (viewName === 'audit-studio') {
      renderIssuesList();
      selectIssue(selectedIssueId);
    } else if (viewName === 'overview') {
      updateDashboardMetrics();
    } else if (viewName === 'reports') {
      loadSavedReports();
    }
  }

  // Setup Sidebar Click Listeners
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('data-path');
      switchView(path);
    });
  });

  // Top Bar 3D Toggle
  const toggle3DBtn = document.getElementById('toggle-3d-btn');
  if (toggle3DBtn) {
    toggle3DBtn.addEventListener('click', () => {
      is3DMode = !is3DMode;
      document.body.classList.toggle('mode-3d', is3DMode);
      threeManager.toggle(is3DMode);
      toggle3DBtn.innerHTML = is3DMode 
        ? '<span class="material-symbols-outlined text-[18px]">view_in_ar</span> 3D Mode: ON'
        : '<span class="material-symbols-outlined text-[18px]">layers_clear</span> 3D Mode: OFF';
      announce(`3D Immersive mode turned ${is3DMode ? 'on' : 'off'}`);
    });
  }

  // Color Vision Deficiency (CVD) Simulator
  const cvdSelect = document.getElementById('cvd-simulator-select');
  if (cvdSelect) {
    cvdSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      document.body.classList.remove('cvd-protanopia', 'cvd-deuteranopia', 'cvd-tritanopia', 'cvd-achromatopsia');
      if (mode !== 'normal') {
        document.body.classList.add(`cvd-${mode}`);
      }
      announce(`Color vision simulation set to ${mode}`);
    });
  }

  // Dashboard Metrics Updater
  function updateDashboardMetrics() {
    const stats = auditEngine.calculateStats();

    const scoreElem = document.getElementById('overview-score');
    const critElem = document.getElementById('overview-crit-count');
    const serElem = document.getElementById('overview-ser-count');
    const modElem = document.getElementById('overview-mod-count');
    const minElem = document.getElementById('overview-min-count');
    const totalElem = document.getElementById('overview-total-count');

    if (scoreElem) scoreElem.textContent = `${stats.score}% / 100`;
    if (critElem) critElem.textContent = stats.critical;
    if (serElem) serElem.textContent = stats.serious;
    if (modElem) modElem.textContent = stats.moderate;
    if (minElem) minElem.textContent = stats.minor;
    if (totalElem) totalElem.textContent = `Total ${stats.total} accessibility violations detected across recent target elements.`;

    const studioTotal = document.getElementById('studio-total-badge');
    if (studioTotal) studioTotal.textContent = `${stats.total} Total`;
  }

  // Audit Form Submission
  const auditForm = document.getElementById('audit-form');
  if (auditForm) {
    auditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const urlInput = document.getElementById('url-input');
      const targetUrl = urlInput ? urlInput.value : 'https://app.acmecorp.io/dashboard/analytics';

      startScanWorkflow(targetUrl);
    });
  }

  function startScanWorkflow(url) {
    switchView('scan');

    const scanUrlBar = document.getElementById('scan-url-display');
    const scanTitle = document.getElementById('scan-target-title');
    const scanProgressBar = document.getElementById('scan-progress-bar');
    const scanPercentText = document.getElementById('scan-progress-percent');
    const scanStageText = document.getElementById('scan-stage-text');
    const scanTimer = document.getElementById('elapsed-timer');

    if (scanUrlBar) scanUrlBar.textContent = url;
    if (scanTitle) scanTitle.textContent = `Scanning ${url.replace('https://', '').split('/')[0]}`;

    auditEngine.startAuditScan(url, (progressData) => {
      if (scanProgressBar) scanProgressBar.style.width = `${progressData.progress}%`;
      if (scanPercentText) scanPercentText.textContent = `${progressData.progress}%`;
      if (scanStageText) scanStageText.textContent = progressData.stageText;
      if (scanTimer) {
        const mins = String(Math.floor(progressData.elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(progressData.elapsedSeconds % 60).padStart(2, '0');
        scanTimer.textContent = `${mins}:${secs}`;
      }
    }, (completedAudit) => {
      announce('Scan complete. Opening Audit Studio.');
      setTimeout(() => {
        switchView('audit-studio');
      }, 700);
    });
  }

  // Cancel Scan Button
  const cancelScanBtn = document.getElementById('btn-cancel-scan');
  if (cancelScanBtn) {
    cancelScanBtn.addEventListener('click', () => {
      auditEngine.cancelAuditScan();
      announce('Scan cancelled');
      switchView('overview');
    });
  }

  // Audit Studio: Render Issues List
  function renderIssuesList(filterSeverity = 'all', searchQuery = '') {
    const listContainer = document.getElementById('audit-issues-list');
    if (!listContainer) return;

    const auditData = auditEngine.getAuditData();
    let issues = auditData.issues || [];

    if (filterSeverity !== 'all') {
      issues = issues.filter(i => i.severity.toLowerCase() === filterSeverity.toLowerCase());
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      issues = issues.filter(i => i.title.toLowerCase().includes(q) || i.selector.toLowerCase().includes(q));
    }

    listContainer.innerHTML = '';

    if (issues.length === 0) {
      listContainer.innerHTML = `
        <div class="p-space-lg text-center text-on-surface-variant">
          <p class="text-body-sm">No issues found matching filters.</p>
        </div>
      `;
      return;
    }

    issues.forEach((issue) => {
      const isSelected = issue.id === selectedIssueId;
      const borderClass = issue.severity === 'Critical' ? 'border-error' : (issue.severity === 'Serious' ? 'border-amber-500' : 'border-blue-500');
      const badgeBg = issue.severity === 'Critical' ? 'bg-error text-on-error' : (issue.severity === 'Serious' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white');

      const card = document.createElement('div');
      card.className = `p-space-sm bg-surface-container-lowest rounded-lg shadow-sm border-l-4 ${borderClass} cursor-pointer hover:bg-surface-container transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${issue.severity} issue: ${issue.title}`);

      card.innerHTML = `
        <div class="flex items-start justify-between gap-space-xs">
          <div class="flex items-center gap-2">
            <span class="${badgeBg} w-5 h-5 rounded-full flex items-center justify-center text-label-sm font-bold">${issue.elementBadge}</span>
            <span class="text-label-md text-on-surface font-semibold">${issue.title}</span>
          </div>
          <span class="text-label-sm text-outline">${issue.fixed ? 'Fixed' : '1 el'}</span>
        </div>
        <p class="text-body-sm text-on-surface-variant mt-1 pl-7 truncate font-mono">${issue.selector}</p>
      `;

      card.addEventListener('click', () => selectIssue(issue.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectIssue(issue.id);
        }
      });

      listContainer.appendChild(card);
    });
  }

  // Select Issue & Populate Details
  function selectIssue(issueId) {
    selectedIssueId = issueId;
    const auditData = auditEngine.getAuditData();
    const issue = auditData.issues.find(i => i.id === issueId) || auditData.issues[0];
    if (!issue) return;

    // Highlight target element in DOM preview
    document.querySelectorAll('.preview-target-box').forEach(el => el.classList.remove('ring-4', 'ring-primary', 'scale-105'));
    const targetBox = document.getElementById(issue.elementId);
    if (targetBox) {
      targetBox.classList.add('ring-4', 'ring-primary', 'scale-105', 'transition-all');
      targetBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Populate Right Column Details
    const badgeNum = document.getElementById('detail-badge-num');
    const titleElem = document.getElementById('detail-issue-title');
    const sevPill = document.getElementById('detail-severity-pill');
    const descElem = document.getElementById('detail-desc-text');
    const impactElem = document.getElementById('detail-impact-text');
    const whyElem = document.getElementById('detail-why-text');
    const selectorElem = document.getElementById('detail-selector-code');
    const snippetElem = document.getElementById('detail-suggested-code');

    if (badgeNum) badgeNum.textContent = issue.elementBadge;
    if (titleElem) titleElem.textContent = issue.title;
    if (sevPill) {
      sevPill.textContent = issue.severity;
      sevPill.className = issue.severity === 'Critical' 
        ? 'bg-error-container text-on-error-container text-label-sm px-2 py-0.5 rounded-full font-medium'
        : 'bg-amber-100 text-amber-800 text-label-sm px-2 py-0.5 rounded-full font-medium';
    }
    if (descElem) descElem.textContent = issue.wcag;
    if (impactElem) impactElem.textContent = issue.impactedUsers;
    if (whyElem) whyElem.textContent = issue.whyMatters;
    if (selectorElem) selectorElem.textContent = issue.selector;
    if (snippetElem) snippetElem.textContent = issue.remediation;

    // Refresh list active styles
    renderIssuesList(currentIssueFilter, currentSearchQuery);
    announce(`Selected issue: ${issue.title}`);
  }

  // Filter Buttons in Audit Studio
  let currentIssueFilter = 'all';
  let currentSearchQuery = '';

  const filterBtns = document.querySelectorAll('.issue-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('bg-surface-container-high', 'text-on-surface-variant');
      });
      btn.classList.add('bg-primary', 'text-on-primary');
      btn.classList.remove('bg-surface-container-high', 'text-on-surface-variant');

      currentIssueFilter = btn.getAttribute('data-filter') || 'all';
      renderIssuesList(currentIssueFilter, currentSearchQuery);
    });
  });

  const searchInput = document.getElementById('issue-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderIssuesList(currentIssueFilter, currentSearchQuery);
    });
  }

  // Jump to Fix Workspace Button
  const jumpToFixBtn = document.getElementById('btn-jump-to-fix');
  if (jumpToFixBtn) {
    jumpToFixBtn.addEventListener('click', () => {
      const auditData = auditEngine.getAuditData();
      const issue = auditData.issues.find(i => i.id === selectedIssueId) || auditData.issues[0];
      fixWorkspace.loadIssue(issue);
      switchView('fix-workspace');
    });
  }

  // Fix Workspace Buttons
  const fixApplyBtn = document.getElementById('btn-fix-apply-rescan');
  if (fixApplyBtn) {
    fixApplyBtn.addEventListener('click', () => {
      fixWorkspace.applyFixAndRescan();
      updateDashboardMetrics();
    });
  }

  const fixResetBtn = document.getElementById('btn-fix-reset');
  if (fixResetBtn) fixResetBtn.addEventListener('click', () => fixWorkspace.resetCode());

  const fixUndoBtn = document.getElementById('btn-fix-undo');
  if (fixUndoBtn) fixUndoBtn.addEventListener('click', () => fixWorkspace.undoChange());

  const fixCopyBtn = document.getElementById('btn-fix-copy');
  if (fixCopyBtn) fixCopyBtn.addEventListener('click', () => fixWorkspace.copyCode());

  const fixSpeakBtn = document.getElementById('sr-sim-btn');
  if (fixSpeakBtn) fixSpeakBtn.addEventListener('click', () => fixWorkspace.speakAnnouncement());

  // Report Modal / Export
  const exportBtn = document.getElementById('btn-export-report');
  const reportModal = document.getElementById('report-modal');
  const closeModalBtn = document.getElementById('btn-close-modal');
  const downloadReportBtn = document.getElementById('btn-download-report-file');
  const saveReportDiskBtn = document.getElementById('btn-save-report-disk');
  const markdownPreviewElem = document.getElementById('report-markdown-preview');

  function openReportModal() {
    const stats = auditEngine.calculateStats();
    const md = ReportGenerator.generateMarkdownReport(auditEngine.getAuditData(), stats);
    if (markdownPreviewElem) markdownPreviewElem.textContent = md;
    if (reportModal) {
      reportModal.classList.remove('hidden');
      reportModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeReportModal() {
    if (reportModal) {
      reportModal.classList.add('hidden');
      reportModal.setAttribute('aria-hidden', 'true');
    }
  }

  async function loadSavedReports() {
    const listContainer = document.getElementById('saved-reports-list');
    if (!listContainer) return;

    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success && data.reports.length > 0) {
        listContainer.innerHTML = '';
        data.reports.forEach(r => {
          const card = document.createElement('div');
          card.className = 'p-4 bg-surface-container-lowest rounded-xl flex items-center justify-between border border-outline-variant/15';
          card.innerHTML = `
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary text-[28px]" aria-hidden="true">article</span>
              <div>
                <h3 class="font-manrope font-bold text-sm text-on-surface">${r.filename}</h3>
                <span class="text-xs text-on-surface-variant">Size: ${(r.size / 1024).toFixed(1)} KB • Modified: ${new Date(r.modified).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="reports/${r.filename}" target="_blank" class="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer min-target-size flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">visibility</span> View
              </a>
              <button onclick="document.getElementById('btn-export-report').click()" class="bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer min-target-size flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">edit_note</span> Inspect
              </button>
            </div>
          `;
          listContainer.appendChild(card);
        });
      }
    } catch (e) {
      console.warn('Could not load reports list:', e);
    }
  }

  if (exportBtn) exportBtn.addEventListener('click', openReportModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeReportModal);

  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', () => {
      const stats = auditEngine.calculateStats();
      const md = ReportGenerator.generateMarkdownReport(auditEngine.getAuditData(), stats);
      const filename = `audit-${(auditEngine.getAuditData().url || 'target').replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.md`;
      ReportGenerator.downloadReport(md, filename);
      announce('Report downloaded');
    });
  }

  if (saveReportDiskBtn) {
    saveReportDiskBtn.addEventListener('click', async () => {
      const stats = auditEngine.calculateStats();
      const md = ReportGenerator.generateMarkdownReport(auditEngine.getAuditData(), stats);
      const filename = `audit-acmecorp-${new Date().toISOString().split('T')[0]}.md`;
      const result = await ReportGenerator.saveReportToDisk(md, filename);
      if (result.success) {
        alert(`Report successfully saved to workspace: ${result.path}`);
        announce('Report saved to workspace reports directory');
      } else {
        ReportGenerator.downloadReport(md, filename);
        announce('Report downloaded as fallback');
      }
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Escape') {
      closeReportModal();
    } else if (e.key === '1') {
      switchView('overview');
    } else if (e.key === '2') {
      switchView('audit-studio');
    } else if (e.key === '3') {
      switchView('fix-workspace');
    } else if (e.key === '4') {
      switchView('scan-history');
    } else if (e.key === '5') {
      switchView('settings');
    }
  });

  // Global preset loaders on overview table buttons
  window.loadPresetIntoStudio = function(presetKey) {
    auditEngine.loadPreset(presetKey);
    updateDashboardMetrics();
    switchView('audit-studio');
  };

  // Initial Load
  updateDashboardMetrics();
  switchView('overview');
});
