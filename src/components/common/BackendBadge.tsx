import React from 'react';

interface BackendBadgeProps {
  label?: string;
  className?: string;
}

export const BackendBadge: React.FC<BackendBadgeProps> = ({ 
  label = 'Preview feature',
  className = ''
}) => {
  return (
    <span 
      className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant/30 ${className}`}
      title="This control is a frontend preview and does not change server-side scan settings."
    >
      <span className="material-symbols-outlined text-[12px] text-primary" aria-hidden="true">build_circle</span>
      {label}
    </span>
  );
};

export const DemoBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span 
      className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 ${className}`}
      title="This interactive example is separate from the saved automated scan findings."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" aria-hidden="true"></span>
      Demo
    </span>
  );
};

export const ScannerNoticeBanner: React.FC<{ onDismiss?: () => void }> = ({ onDismiss }) => {
  return (
    <div 
      className="p-3.5 mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 text-xs"
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0 mt-0.5" aria-hidden="true">
          info
        </span>
        <div>
          <p className="font-bold text-amber-950">
            Frontend Prototype Mode
          </p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            All audit metrics, code snippets, and DOM overlays currently displayed are <strong>Stitch design demo data</strong>, not findings from a website scan.
          </p>
        </div>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="text-amber-700 hover:text-amber-950 p-1 rounded-md min-target-size flex items-center justify-center cursor-pointer"
          aria-label="Dismiss notice"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
        </button>
      )}
    </div>
  );
};
