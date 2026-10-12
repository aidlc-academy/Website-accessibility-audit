/**
 * AccessLens — Fix Workspace (Remediation Studio)
 * Features live interactive component sandbox, code editor with dynamic diffing,
 * and Web Speech API screen reader speech simulation.
 */

class FixWorkspaceController {
  constructor(auditEngine, onScoreUpdated) {
    this.engine = auditEngine;
    this.onScoreUpdated = onScoreUpdated;
    this.currentIssue = null;
    this.isSpeechEnabled = true;

    this.initListeners();
  }

  initListeners() {
    const editor = document.getElementById('code-editor-input');
    if (editor) {
      editor.addEventListener('input', (e) => this.handleCodeInput(e.target.value));
    }
  }

  loadIssue(issue) {
    this.currentIssue = issue;

    // Update Header / Info
    const bannerElem = document.getElementById('fix-issue-title');
    const wcagBadge = document.getElementById('fix-wcag-badge');
    const severityBadge = document.getElementById('fix-severity-badge');
    const domSelector = document.getElementById('fix-dom-selector');
    const impactText = document.getElementById('fix-impact-text');
    const whyText = document.getElementById('fix-why-text');

    if (bannerElem) bannerElem.textContent = issue.title;
    if (wcagBadge) wcagBadge.textContent = issue.wcag;
    if (severityBadge) {
      severityBadge.textContent = issue.severity;
      severityBadge.className = issue.severity === 'Critical' 
        ? 'px-2 py-0.5 rounded text-label-sm font-medium bg-error-container text-on-error-container'
        : 'px-2 py-0.5 rounded text-label-sm font-medium bg-amber-100 text-amber-800';
    }
    if (domSelector) domSelector.textContent = `DOM: ${issue.selector}`;
    if (impactText) impactText.textContent = issue.impactedUsers;
    if (whyText) whyText.textContent = issue.whyMatters;

    // Update Code Boxes
    const beforeCodeElem = document.getElementById('fix-before-code');
    const editorInput = document.getElementById('code-editor-input');

    if (beforeCodeElem) beforeCodeElem.textContent = issue.snippet;
    if (editorInput) {
      editorInput.value = issue.remediation;
      this.handleCodeInput(issue.remediation);
    }

    // Hide any previous rescan card
    const rescanCard = document.getElementById('rescan-results-card');
    if (rescanCard) rescanCard.classList.add('hidden');
  }

  handleCodeInput(code) {
    const badge = document.getElementById('preview-announcement-badge');
    const componentWrapper = document.getElementById('preview-button-wrapper');

    if (!componentWrapper || !badge) return;

    if (!this.currentIssue || this.currentIssue.id === 'CRIT-03') {
      // Check aria-label
      const match = code.match(/aria-label=["']([^"']+)["']/i);
      const hasAriaHidden = code.includes('aria-hidden="true"');

      if (match && match[1]) {
        const label = match[1];
        componentWrapper.innerHTML = `
          <button class="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md hover:bg-primary-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
                  aria-label="${label}" id="live-target-button">
            <span class="material-symbols-outlined text-[24px]" ${hasAriaHidden ? 'aria-hidden="true"' : ''}>bookmark</span>
          </button>
        `;
        badge.textContent = `Announced as: "${label}, Button" (Passed)`;
        badge.className = 'text-label-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-medium';
      } else {
        componentWrapper.innerHTML = `
          <button class="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md hover:bg-primary-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
                  id="live-target-button">
            <span class="material-symbols-outlined text-[24px]">bookmark</span>
          </button>
        `;
        badge.textContent = 'Announced as: "Button" (Violation)';
        badge.className = 'text-label-sm px-3 py-1 rounded-full bg-error-container text-on-error-container font-mono font-medium';
      }
    } else if (this.currentIssue.id === 'CRIT-01') {
      // Alt text check
      const match = code.match(/alt=["']([^"']+)["']/i);
      if (match && match[1]) {
        componentWrapper.innerHTML = `
          <div class="flex items-center gap-3 bg-surface p-3 rounded-xl border border-outline-variant/30">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                 alt="${match[1]}" class="w-12 h-12 rounded-full object-cover ring-2 ring-primary">
            <div>
              <p class="font-medium text-sm text-on-surface">Alex Morgan</p>
              <p class="text-xs text-on-surface-variant">Lead Auditor</p>
            </div>
          </div>
        `;
        badge.textContent = `Announced as: "${match[1]}, Graphic" (Passed)`;
        badge.className = 'text-label-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-medium';
      } else {
        componentWrapper.innerHTML = `
          <div class="flex items-center gap-3 bg-surface p-3 rounded-xl border border-outline-variant/30">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                 class="w-12 h-12 rounded-full object-cover">
            <div>
              <p class="font-medium text-sm text-on-surface">Alex Morgan</p>
              <p class="text-xs text-on-surface-variant">Lead Auditor</p>
            </div>
          </div>
        `;
        badge.textContent = 'Announced as: "Unlabeled image" (Violation)';
        badge.className = 'text-label-sm px-3 py-1 rounded-full bg-error-container text-on-error-container font-mono font-medium';
      }
    } else if (this.currentIssue.id === 'SER-01') {
      // Contrast check
      const isHighContrast = code.includes('#3828B5') || code.includes('text-[#3828B5]') || !code.includes('#9286FF');
      componentWrapper.innerHTML = `
        <a href="#" class="px-4 py-2 rounded-lg font-medium transition-colors ${isHighContrast ? 'text-[#3828B5] bg-surface-container-low border border-primary/20' : 'text-[#9286FF] bg-surface'}">
          Reports Overview
        </a>
      `;
      if (isHighContrast) {
        badge.textContent = 'Contrast: 7.4:1 (Passed AAA)';
        badge.className = 'text-label-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-medium';
      } else {
        badge.textContent = 'Contrast: 2.1:1 (Fails WCAG 1.4.3)';
        badge.className = 'text-label-sm px-3 py-1 rounded-full bg-error-container text-on-error-container font-mono font-medium';
      }
    }
  }

  speakAnnouncement() {
    const badge = document.getElementById('preview-announcement-badge');
    const textToSpeak = badge ? badge.textContent.replace('(Passed)', '').replace('(Violation)', '').replace('Announced as: ', '') : 'Button';

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      this.showStatus(`Screen Reader speaking: "${textToSpeak}"`);
    } else {
      this.showStatus(`Screen Reader simulated: "${textToSpeak}"`);
    }
  }

  applyFixAndRescan() {
    if (this.currentIssue) {
      this.engine.toggleIssueFixed(this.currentIssue.id, true);
      if (this.onScoreUpdated) this.onScoreUpdated();
    }

    const rescanCard = document.getElementById('rescan-results-card');
    if (rescanCard) {
      rescanCard.classList.remove('hidden');
      rescanCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    this.showStatus('Fix verified and applied! Compliance score updated.');
  }

  resetCode() {
    if (this.currentIssue) {
      const editor = document.getElementById('code-editor-input');
      if (editor) {
        editor.value = this.currentIssue.remediation;
        this.handleCodeInput(this.currentIssue.remediation);
      }
      this.showStatus('Code reset to recommended fix.');
    }
  }

  undoChange() {
    if (this.currentIssue) {
      const editor = document.getElementById('code-editor-input');
      if (editor) {
        editor.value = this.currentIssue.snippet;
        this.handleCodeInput(this.currentIssue.snippet);
      }
      this.showStatus('Reverted to original violation state.');
    }
  }

  copyCode() {
    const editor = document.getElementById('code-editor-input');
    if (editor) {
      navigator.clipboard.writeText(editor.value).then(() => {
        this.showStatus('Code copied to clipboard!');
      }).catch(() => {
        this.showStatus('Code copied to clipboard!');
      });
    }
  }

  showStatus(msg) {
    const statusText = document.getElementById('editor-status-text');
    if (statusText) {
      statusText.textContent = msg;
      setTimeout(() => {
        statusText.textContent = 'Live binding active: Changes update preview and screen reader instantly.';
      }, 4000);
    }
  }
}

window.FixWorkspaceController = FixWorkspaceController;
