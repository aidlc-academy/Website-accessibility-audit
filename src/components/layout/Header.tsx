import React from 'react';
import { ViewType, CVDMode } from '../../types/audit';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  is3DMode: boolean;
  onToggle3D: () => void;
  cvdMode: CVDMode;
  onCVDChange: (mode: CVDMode) => void;
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  is3DMode,
  onToggle3D,
  cvdMode,
  onCVDChange,
  onOpenMobileSidebar
}) => {
  return (
    <header
      className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 lg:px-6 border-b border-outline-variant/15"
      role="banner"
    >
      {/* Left Area: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container-high min-target-size flex items-center justify-center cursor-pointer"
          aria-label="Open sidebar navigation menu"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">menu</span>
        </button>

        {/* Workspace Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs md:text-sm text-on-surface-variant">
          <span className="hidden sm:inline">Workspaces</span>
          <span className="material-symbols-outlined text-[16px] hidden sm:inline" aria-hidden="true">
            chevron_right
          </span>
          <span className="text-on-surface font-semibold truncate max-w-[140px] sm:max-w-none">
            Acme Corp App
          </span>
        </div>

        {/* Stepper Pill Indicator */}
        <div 
          className="hidden xl:flex items-center gap-1.5 ml-4 bg-surface-container-low px-3.5 py-1 rounded-full border border-outline-variant/30 text-xs"
          role="navigation"
          aria-label="Audit workflow stages"
        >
          <span className={currentView === 'scan' ? 'text-primary font-bold' : 'text-on-surface-variant'}>
            Scan
          </span>
          <span className="text-outline-variant">/</span>
          <span className={currentView === 'audit-studio' ? 'text-primary font-bold' : 'text-on-surface-variant'}>
            Inspect
          </span>
          <span className="text-outline-variant">/</span>
          <span className={currentView === 'fix-workspace' ? 'text-primary font-bold' : 'text-on-surface-variant'}>
            Fix
          </span>
          <span className="text-outline-variant">/</span>
          <span className={currentView === 'reports' ? 'text-primary font-bold' : 'text-on-surface-variant'}>
            Verify
          </span>
        </div>
      </div>

      {/* Right Area: CVD, 3D Toggle, New Audit */}
      <div className="flex items-center gap-2">
        {/* Color Vision Deficiency Filter Selector */}
        <div className="hidden md:flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/30 text-xs">
          <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
            visibility
          </span>
          <label htmlFor="cvd-select" className="sr-only">Color Vision Simulation Mode</label>
          <select
            id="cvd-select"
            value={cvdMode}
            onChange={(e) => onCVDChange(e.target.value as CVDMode)}
            className="bg-transparent text-on-surface text-xs font-medium outline-none cursor-pointer"
          >
            <option value="normal">Vision: Standard (Full Color)</option>
            <option value="protanopia">Simulate: Protanopia (Red-Blind)</option>
            <option value="deuteranopia">Simulate: Deuteranopia (Green-Blind)</option>
            <option value="tritanopia">Simulate: Tritanopia (Blue-Blind)</option>
            <option value="achromatopsia">Simulate: Monochromacy (Grayscale)</option>
          </select>
        </div>

        {/* 3D Immersive Mode Toggle */}
        <button
          onClick={onToggle3D}
          className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-outline-variant/20 cursor-pointer min-target-size"
          aria-label={`3D Mode: ${is3DMode ? 'ON' : 'OFF'}. Toggle 3D visual canvas.`}
        >
          <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
            {is3DMode ? 'view_in_ar' : 'layers_clear'}
          </span>
          <span className="hidden sm:inline">3D Mode: {is3DMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* New Audit CTA */}
        <button
          onClick={() => onNavigate('overview')}
          className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm cursor-pointer min-target-size"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
          <span>New Audit</span>
        </button>
      </div>
    </header>
  );
};
