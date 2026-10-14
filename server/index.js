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
import {
  registerUser,
  loginUser,
  getUserById,
  authenticateToken,
  requireAdmin,
} from './simpleAuth.js';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');
const app = express();
const port = Number(process.env.PORT || 5173);
const timeoutMs = Number(process.env.SCAN_TIMEOUT_MS || 60000);
const isProduction = process.env.NODE_ENV === 'production';

// Rate limiting: max 10 scans per IP per hour
const scanRateLimits = new Map(); // IP -> { count, resetTime }
const MAX_SCANS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const record = scanRateLimits.get(ip);
  
  if (!record || now > record.resetTime) {
    scanRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_SCANS_PER_HOUR - 1 };
  }
  
  if (record.count >= MAX_SCANS_PER_HOUR) {
    const resetInMinutes = Math.ceil((record.resetTime - now) / 60000);
    return { allowed: false, remaining: 0, resetInMinutes };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_SCANS_PER_HOUR - record.count };
}

if (!Number.isInteger(timeoutMs) || timeoutMs < 5000 || timeoutMs > 120000) {
  throw new Error('SCAN_TIMEOUT_MS must be an integer between 5000 and 120000.');
}

app.disable('x-powered-by');
app.use(express.json({ limit: '4kb' }));

// ============================================================================
// Authentication Routes (Public)
// ============================================================================

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const { email, password, fullName } = request.body;
    const user = await registerUser({ email, password, fullName });
    response.status(201).json({ user, message: 'Registration successful' });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const { email, password } = request.body;
    const result = await loginUser({ email, password });
    response.json(result);
  } catch (error) {
    response.status(401).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (request, response, next) => {
  try {
    const user = await getUserById(request.user.userId);
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Protected Routes (Require Authentication)
// ============================================================================

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

app.get('/api/audits', authenticateToken, async (request, response, next) => {
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

app.post('/api/audits', authenticateToken, async (request, response, next) => {
  // Check rate limit
  const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    response.status(429).json({ 
      error: `Rate limit exceeded. You can run ${MAX_SCANS_PER_HOUR} scans per hour. Please try again in ${rateLimit.resetInMinutes} minutes.` 
    });
    return;
  }

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
      console.error('Scan error:', error.message, error.stack);
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
      userId: request.user.userId,
      standard: 'WCAG 2.2 Level AA',
      viewport: `${result.scanConfiguration.viewport.width}x${result.scanConfiguration.viewport.height}`,
      manualReviewRequired: true,
      ...(baseline ? { compareToAuditId: baseline.id } : {}),
    };
    const report = saveReport(audit);
    audit.reportFilename = report.filename;
    console.log('Saving audit to database:', audit.id);
    await saveAudit(audit);
    console.log('Audit saved successfully');
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

app.get('/api/audits/:id', authenticateToken, async (request, response, next) => {
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

app.get('/api/audits/:id/report', authenticateToken, async (request, response, next) => {
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

app.get('/api/audits/:id/export.csv', authenticateToken, async (request, response, next) => {
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

app.get('/api/reports', authenticateToken, async (_request, response, next) => {
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
