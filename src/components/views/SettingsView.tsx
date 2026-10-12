import React from 'react';

export const SettingsView: React.FC = () => (
  <section aria-labelledby="settings-heading" className="flex flex-col w-full">
    <div className="mb-6">
      <h1 id="settings-heading" className="font-manrope text-xl md:text-2xl font-bold text-on-surface">
        Audit service settings
      </h1>
      <p className="text-xs text-on-surface-variant">
        Current local scanner configuration. The selected rule set is fixed to WCAG 2.2 A/AA automated checks.
      </p>
    </div>

    <div className="glass-card bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/20">
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
          <dt className="text-xs uppercase tracking-wide font-bold text-on-surface-variant">Automated scanner</dt>
          <dd className="mt-1 font-manrope font-bold text-on-surface">Puppeteer + axe-core</dd>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
          <dt className="text-xs uppercase tracking-wide font-bold text-on-surface-variant">Rule tags</dt>
          <dd className="mt-1 font-manrope font-bold text-on-surface">WCAG 2.0 A/AA, 2.1 A/AA, 2.2 AA</dd>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
          <dt className="text-xs uppercase tracking-wide font-bold text-on-surface-variant">Audit timeout</dt>
          <dd className="mt-1 text-sm text-on-surface">Configured by <code>SCAN_TIMEOUT_MS</code>; default 60 seconds.</dd>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
          <dt className="text-xs uppercase tracking-wide font-bold text-on-surface-variant">Local result storage</dt>
          <dd className="mt-1 text-sm text-on-surface"><code>data/audits.json</code> and generated Markdown reports in <code>reports/</code>.</dd>
        </div>
      </dl>

      <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950">
        Scans are restricted to publicly routable HTTP(S) destinations. Automated checks do not cover every WCAG criterion and cannot establish conformance without manual verification.
      </div>
    </div>
  </section>
);
