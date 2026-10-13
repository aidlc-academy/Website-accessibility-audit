import React from 'react';
import { ViewType } from '../../types/audit';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'audit-studio', label: 'Audit Studio', icon: 'analytics' },
  { id: 'fix-workspace', label: 'Fix Workspace', icon: 'auto_fix_high' },
  { id: 'visualizers', label: '3D Visualizers', icon: 'view_in_ar' },
  { id: 'scan-history', label: 'Scan History', icon: 'history' },
  { id: 'reports', label: 'Reports', icon: 'description' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        id="app-sidebar"
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between py-6 border-r border-outline-variant/20 shadow-sm transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 visible' : '-translate-x-full invisible lg:translate-x-0 lg:visible'
        }`}
        aria-label="Main application sidebar"
      >
        <div className="flex flex-col">
          {/* Logo and Brand */}
          <div className="flex items-center justify-between px-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                  visibility
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-manrope text-lg font-extrabold tracking-tight text-on-surface">
                  AccessLens
                </span>
                <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                  Audit Studio
                </span>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high min-target-size flex items-center justify-center"
              aria-label="Close sidebar navigation"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors text-left w-full cursor-pointer min-target-size ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lead Auditor Info Card */}
        <div className="px-6 pt-4 border-t border-outline-variant/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-primary/20">
            AM
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-on-surface">Alex Morgan</span>
            <span className="text-xs text-on-surface-variant">Lead Accessibility Auditor</span>
          </div>
        </div>
      </aside>
    </>
  );
};
