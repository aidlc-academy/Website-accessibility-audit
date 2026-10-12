import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { scanUrl } from './scanner.js';
import { assertPublicHttpUrl, TargetUrlError } from './security.js';
import { findAudit, listAudits, saveAudit } from './storage.js';
import { generateCsvReport, saveReport } from './reporter.js';
import { compareAudits } from './comparison.js';
import { configuredBrowserPath } from './browserConfig.js';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');
const app = express();
const port = Number(process.env.PORT || 5173);
const timeoutMs = Number(process.env.SCAN_TIMEOUT_MS || 60000);
const isProduction = process.env.NODE_ENV === 'production';

if (!Number.isInteger(timeoutMs) || timeoutMs < 5000 || timeoutMs > 120000) {
  throw new Error('SCAN_TIMEOUT_MS must be an integer between 5000 and 120000.');
}

app.disable('x-powered-by');
app.use(express.json({ limit: '4kb' }));

app.get('/api/health', (_request, response) => {
  let browser;
  try {
    const executablePath = configuredBrowserPath();
    browser = {
      runtime: process.platform,
      configured: Boolean(executablePath),
      available: executablePath ? true : null,
      executable: executablePath ? path.basename(executablePath) : 'Puppeteer managed browser',
    };
  } catch (error) {
    browser = {
      runtime: process.platform,
      configured: true,
      available: false,
      error: error.message,
    };
  }
  response.json({ status: 'ok', scanner: 'axe-core', timeoutMs, browser });
});

app.get('/api/audits', async (_request, response, next) => {
  try {
    const audits = await listAudits();
    response.json({
      audits: audits.map(({ issues = [], comparison: _comparison, ...audit }) => ({
        ...audit,
        issueCount: issues.length,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/audits', async (request, response, next) => {
  const targetUrl = request.body?.url;
  if (typeof targetUrl !== 'string' || targetUrl.length > 2048) {
    response.status(400).json({ error: 'Provide a target URL no longer than 2048 characters.' });
    return;
  }
  const compareToAuditId = request.body?.compareToAuditId;
  if (compareToAuditId !== undefined && (typeof compareToAuditId !== 'string' || compareToAuditId.length > 64)) {
    response.status(400).json({ error: 'The comparison audit identifier is invalid.' });
    return;
  }

  const cancellation = new AbortController();
  response.on('close', () => {
    if (!response.writableEnded) cancellation.abort();
  });

  try {
    const validatedUrl = await assertPublicHttpUrl(targetUrl);
    const baseline = compareToAuditId ? await findAudit(compareToAuditId) : null;
    if (compareToAuditId && !baseline) {
      response.status(404).json({ error: 'The saved audit selected for comparison was not found.' });
      return;
    }
    let result;
    try {
      result = await scanUrl(validatedUrl.href, { timeoutMs, signal: cancellation.signal });
    } catch (error) {
      if (cancellation.signal.aborted) return;
      if (error.message.includes('time limit')) {
        response.status(504).json({ error: error.message });
        return;
      }
      if (error.message.includes('private') || error.message.includes('reserved')) {
        response.status(400).json({ error: error.message });
        return;
      }
      response.status(502).json({ error: error.message || 'The scanner could not complete this audit.' });
      return;
    }
    const audit = {
      id: crypto.randomUUID(),
      ...result,
      status: 'completed',
      standard: 'WCAG 2.2 Level AA',
      viewport: `${result.scanConfiguration.viewport.width}x${result.scanConfiguration.viewport.height}`,
      manualReviewRequired: true,
      ...(baseline ? { compareToAuditId: baseline.id } : {}),
    };
    const report = saveReport(audit);
    audit.reportFilename = report.filename;
    await saveAudit(audit);
    response.status(201).json({
      audit: {
        ...audit,
        ...(baseline ? { comparison: compareAudits(baseline, audit) } : {}),
      },
    });
  } catch (error) {
    if (cancellation.signal.aborted) return;
    if (error instanceof TargetUrlError) {
      response.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

app.get('/api/audits/:id', async (request, response, next) => {
  try {
    const audit = await findAudit(request.params.id);
    if (!audit) {
      response.status(404).json({ error: 'Audit not found.' });
      return;
    }
    const baseline = audit.compareToAuditId ? await findAudit(audit.compareToAuditId) : null;
    response.json({
      audit: {
        ...audit,
        ...(audit.compareToAuditId ? { comparison: compareAudits(baseline, audit) } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/audits/:id/report', async (request, response, next) => {
  try {
    const audit = await findAudit(request.params.id);
    if (!audit) {
      response.status(404).json({ error: 'Audit not found.' });
      return;
    }
    const filename = path.basename(audit.reportFilename || '');
    if (!filename || filename !== audit.reportFilename) {
      response.status(404).json({ error: 'The saved report is unavailable.' });
      return;
    }
    const content = await fs.readFile(path.join(REPORTS_DIR, filename), 'utf8');
    response.type('text/markdown').attachment(filename).send(content);
  } catch (error) {
    next(error);
  }
});

app.get('/api/audits/:id/export.csv', async (request, response, next) => {
  try {
    const audit = await findAudit(request.params.id);
    if (!audit) {
      response.status(404).json({ error: 'Audit not found.' });
      return;
    }
    const safeHost = new URL(audit.url).hostname.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const date = new Date(audit.scannedAt).toISOString().slice(0, 10);
    const filename = `accesslens-${safeHost}-${date}-${audit.id.slice(0, 8)}.csv`;
    response
      .type('text/csv')
      .set('Content-Disposition', `attachment; filename="${filename}"`)
      .send(generateCsvReport(audit));
  } catch (error) {
    next(error);
  }
});

app.get('/api/reports', async (_request, response, next) => {
  try {
    const audits = await listAudits();
    response.json({
      reports: audits.map(({ id, url, pageTitle, scannedAt, issues = [], reportFilename }) => ({
        auditId: id, url, pageTitle, scannedAt, issueCount: issues.length, filename: reportFilename,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (error, _request, response, _next) => {
  console.error('API request failed:', error);
  response.status(500).json({ error: 'The audit service could not complete the request.' });
});

if (isProduction) {
  app.use(express.static(path.join(ROOT_DIR, 'dist')));
  app.get('*path', (_request, response) => response.sendFile(path.join(ROOT_DIR, 'dist', 'index.html')));
} else {
  const vite = await createViteServer({
    configFile: path.join(ROOT_DIR, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, process.env.HOST || '127.0.0.1', () => {
  console.log(`AccessLens ${isProduction ? 'production' : 'development'} server listening on http://localhost:${port}`);
});
