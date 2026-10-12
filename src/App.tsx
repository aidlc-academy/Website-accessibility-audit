import React, { useState, useEffect, useRef } from 'react';
import { ViewType, CVDMode, AuditTarget, AuditIssue } from './types/audit';
import { getAudit, listAudits, runAudit, statsForTarget } from './services/auditApi';

import { SkipLink } from './components/common/SkipLink';
import { LiveAnnouncer } from './components/common/LiveAnnouncer';
import { ThreeScene } from './components/common/ThreeScene';
import { ReportModal } from './components/common/ReportModal';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { OverviewView } from './components/views/OverviewView';
import { ScanProgressView, ScanState } from './components/views/ScanProgressView';
import { AuditStudioView } from './components/views/AuditStudioView';
import { FixWorkspaceView } from './components/views/FixWorkspaceView';
import { ScanHistoryView } from './components/views/ScanHistoryView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

export const App: React.FC = () => {
  const emptyTarget: AuditTarget = {
    id: '',
    url: '',
    title: 'No audit selected',
    viewport: '1280x900',
    standard: 'WCAG 2.2 Level AA',
    date: '',
    status: 'Audit complete',
    issues: [],
  };
  // Global View & Navigation State
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [currentTarget, setCurrentTarget] = useState<AuditTarget>(emptyTarget);
  const [audits, setAudits] = useState<AuditTarget[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('CRIT-01');
  const [activeFixIssue, setActiveFixIssue] = useState<AuditIssue | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string>('');
  const [scanState, setScanState] = useState<ScanState>({ status: 'loading' });
  const scanController = useRef<AbortController | null>(null);

  // Accessibility & Visual Preferences
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [cvdMode, setCvdMode] = useState<CVDMode>('normal');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    listAudits()
      .then((savedAudits) => {
        if (active) setAudits(savedAudits);
      })
      .catch((error: unknown) => {
        if (active) setHistoryError(error instanceof Error ? error.message : 'Unable to load audit history.');
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Sync Body Classes for CVD & 3D
  useEffect(() => {
    document.body.classList.toggle('mode-3d', is3DMode);
  }, [is3DMode]);

  useEffect(() => {
    document.body.classList.remove('cvd-protanopia', 'cvd-deuteranopia', 'cvd-tritanopia', 'cvd-achromatopsia');
    if (cvdMode !== 'normal') {
      document.body.classList.add(`cvd-${cvdMode}`);
    }
  }, [cvdMode]);

  // Keyboard Shortcuts for Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '1') setCurrentView('overview');
      else if (e.key === '2') setCurrentView('audit-studio');
      else if (e.key === '3') setCurrentView('fix-workspace');
      else if (e.key === '4') setCurrentView('scan-history');
      else if (e.key === '5') setCurrentView('reports');
      else if (e.key === '6') setCurrentView('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    setLiveAnnouncement(`Navigated to ${view.replace('-', ' ')} view`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartScan = (url: string, compareToAuditId?: string) => {
    scanController.current?.abort();
    const controller = new AbortController();
    scanController.current = controller;
    setScannedUrl(url);
    setCurrentView('scan');
    setScanState({ status: 'loading' });
    setLiveAnnouncement(`Starting an automated accessibility scan for ${url}`);
    void runAudit(url, controller.signal, compareToAuditId)
      .then((target) => {
        setCurrentTarget(target);
        setAudits((previous) => [target, ...previous.filter((audit) => audit.id !== target.id)]);
        setSelectedIssueId(target.issues[0]?.id || '');
        setActiveFixIssue(target.issues[0] || null);
        setScanState({ status: 'success', findingCount: target.issues.length });
        setLiveAnnouncement(
          compareToAuditId
            ? `Rescan complete. ${target.issues.length} affected elements saved and compared with the previous audit.`
            : `Scan complete. ${target.issues.length} affected elements found and saved.`,
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'The audit service could not complete the scan.';
        setScanState({ status: 'error', message });
        setLiveAnnouncement(`Accessibility scan failed: ${message}`);
      });
  };

  const handleOpenTarget = async (targetId: string) => {
    setCurrentView('scan');
    setScanState({ status: 'loading' });
    const targetSummary = audits.find((audit) => audit.id === targetId);
    setScannedUrl(targetSummary?.url || '');
    try {
      const target = await getAudit(targetId);
      setCurrentTarget(target);
      setSelectedIssueId(target.issues[0]?.id || '');
      setActiveFixIssue(target.issues[0] || null);
      setCurrentView('audit-studio');
      setLiveAnnouncement(`Opened saved audit for ${target.title}`);
    } catch (error) {
      setScanState({ status: 'error', message: error instanceof Error ? error.message : 'Unable to reopen this audit.' });
      setLiveAnnouncement('Unable to reopen the selected audit.');
    }
  };

  const handleOpenReport = (auditId: string) => {
    const target = audits.find((audit) => audit.id === auditId);
    if (!target) {
      setHistoryError('The selected audit is no longer available. Reload saved audits and try again.');
      return;
    }
    setCurrentTarget(target);
    setIsReportModalOpen(true);
  };

  const handleNavigateToFix = (issue: AuditIssue) => {
    setActiveFixIssue(issue);
    setCurrentView('fix-workspace');
    setLiveAnnouncement(`Opened Fix Workspace for ${issue.title}`);
  };

  const currentStats = statsForTarget(currentTarget);
  const cancelScan = () => {
    scanController.current?.abort();
    setScanState({ status: 'error', message: 'The scan was cancelled.' });
    handleNavigate('overview');
  };

  return (
    <div className="min-h-screen text-on-surface bg-surface relative">
      {/* SVG Filters for Color Vision Deficiency */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      {/* WCAG 2.4.1 Skip Link */}
      <SkipLink />

      {/* ARIA Live Announcer for Screen Readers */}
      <LiveAnnouncer message={liveAnnouncement} />

      {/* 3D Immersive Canvas */}
      <ThreeScene enabled={is3DMode} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Header Landmark */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        is3DMode={is3DMode}
        onToggle3D={() => setIs3DMode(!is3DMode)}
        cvdMode={cvdMode}
        onCVDChange={setCvdMode}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 relative z-10">
        <main
          id="main-content"
          tabIndex={-1}
          className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto focus:outline-none"
        >
          {currentView === 'overview' && (
            <OverviewView
              onStartScan={handleStartScan}
              onOpenTarget={handleOpenTarget}
              stats={currentStats}
              recentTargets={audits}
              onNavigate={handleNavigate}
              loading={historyLoading}
              error={historyError}
            />
          )}

          {currentView === 'scan' && (
            <ScanProgressView
              targetUrl={scannedUrl}
              scanState={scanState}
              onCancel={cancelScan}
              onComplete={() => handleNavigate('audit-studio')}
            />
          )}

          {currentView === 'audit-studio' && (
            <AuditStudioView
              target={currentTarget}
              selectedIssueId={selectedIssueId}
              onSelectIssue={setSelectedIssueId}
              onNavigateToFix={handleNavigateToFix}
              onRescan={() => handleStartScan(currentTarget.url, currentTarget.id)}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />
          )}

          {currentView === 'fix-workspace' && (
            activeFixIssue ? (
              <FixWorkspaceView
                issue={activeFixIssue}
                onNavigateToStudio={() => handleNavigate('audit-studio')}
              />
            ) : (
              <section aria-labelledby="no-fix-heading" className="glass-card bg-surface-container-low rounded-2xl p-6">
                <h1 id="no-fix-heading" className="font-manrope text-xl font-bold">Select a finding to review a remediation</h1>
                <p className="mt-2 text-sm text-on-surface-variant">Run or open an audit and choose one of its findings first.</p>
              </section>
            )
          )}

          {currentView === 'scan-history' && (
            <ScanHistoryView
              targets={audits}
              onOpenTarget={handleOpenTarget}
              loading={historyLoading}
              error={historyError}
              onRetry={() => {
                setHistoryLoading(true);
                setHistoryError(null);
                void listAudits().then(setAudits).catch((error: unknown) => {
                  setHistoryError(error instanceof Error ? error.message : 'Unable to load audit history.');
                }).finally(() => setHistoryLoading(false));
              }}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              audits={audits}
              loading={historyLoading}
              error={historyError}
              onOpenAudit={handleOpenTarget}
              onOpenReport={handleOpenReport}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Accessible Report Export Dialog */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        target={currentTarget}
      />
    </div>
  );
};
