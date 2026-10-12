/**
 * Headless Puppeteer and axe-core WCAG 2.2 AA scan.
 */

import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { assertPublicHttpUrl } from './security.js';
import { createScanningProxy } from './proxy.js';
import { configuredBrowserPath } from './browserConfig.js';

const require = createRequire(import.meta.url);
const axeCoreSource = readFileSync(require.resolve('axe-core'), 'utf8');

const IMPACT_MAP = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

const TAG_TO_SC = {
  wcag143: 'SC 1.4.3 Contrast (Minimum)',
  wcag111: 'SC 1.1.1 Non-text Content',
  wcag412: 'SC 4.1.2 Name, Role, Value',
  wcag211: 'SC 2.1.1 Keyboard',
  wcag212: 'SC 2.1.2 No Keyboard Trap',
  wcag131: 'SC 1.3.1 Info and Relationships',
  wcag141: 'SC 1.4.1 Use of Color',
  wcag144: 'SC 1.4.4 Resize Text',
  wcag1410: 'SC 1.4.10 Reflow',
  wcag1411: 'SC 1.4.11 Non-text Contrast',
  wcag241: 'SC 2.4.1 Bypass Blocks',
  wcag242: 'SC 2.4.2 Page Titled',
  wcag243: 'SC 2.4.3 Focus Order',
  wcag246: 'SC 2.4.6 Headings and Labels',
  wcag247: 'SC 2.4.7 Focus Visible',
  wcag2411: 'SC 2.4.11 Focus Not Obscured',
  wcag258: 'SC 2.5.8 Target Size (Minimum)',
  wcag312: 'SC 3.1.2 Language of Parts',
  wcag321: 'SC 3.2.1 On Focus',
  wcag331: 'SC 3.3.1 Error Identification',
  wcag332: 'SC 3.3.2 Labels or Instructions',
  wcag338: 'SC 3.3.8 Accessible Authentication (Minimum)',
};

export const SCAN_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const VIEWPORT = { width: 1280, height: 900 };

function getWcagCriterion(tags) {
  for (const tag of tags) {
    const key = tag.replace(/-/g, '').toLowerCase();
    if (TAG_TO_SC[key]) return TAG_TO_SC[key];
  }
  return 'Success criterion not identified by axe-core';
}

function getPourCategory(tags) {
  const normalized = tags.map((tag) => tag.replace(/-/g, '').toLowerCase());
  if (normalized.some((tag) => ['wcag111', 'wcag131', 'wcag141', 'wcag143', 'wcag144', 'wcag1410', 'wcag1411'].includes(tag))) return 'Perceivable';
  if (normalized.some((tag) => ['wcag211', 'wcag212', 'wcag241', 'wcag242', 'wcag243', 'wcag246', 'wcag247', 'wcag2411', 'wcag258'].includes(tag))) return 'Operable';
  if (normalized.some((tag) => ['wcag312', 'wcag321', 'wcag331', 'wcag332', 'wcag338'].includes(tag))) return 'Understandable';
  return 'Robust';
}

function generateFixSuggestion(ruleId, node) {
  const html = node.html || '';
  switch (ruleId) {
    case 'image-alt':
      return html.replace(/<img([^>]*)>/i, '<img$1 alt="[Describe the image content]">');
    case 'label':
    case 'label-content-name-mismatch':
      return `<label for="INPUT_ID">Descriptive label</label>\n${html}`;
    case 'button-name':
      return html.replace(/<button([^>]*)>/i, '<button$1 aria-label="Descriptive button label">');
    case 'link-name':
      return html.replace(/<a([^>]*)>/i, '<a$1 aria-label="Descriptive link purpose">');
    case 'frame-title':
      return html.replace(/<iframe([^>]*)>/i, '<iframe$1 title="Descriptive frame title">');
    case 'color-contrast':
      return `Increase foreground/background contrast to at least 4.5:1 for normal text (3:1 for large text). A suitable starting point is color: #1a1a2e on background-color: #ffffff.\n${html}`;
    default:
      return `${node.failureSummary || 'Correct the reported accessibility issue.'}\nSee the axe-core help reference for this rule.\n${html}`;
  }
}

export function calculateStats(issues) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const issue of issues) {
    const key = issue.severity.toLowerCase();
    if (key in counts) counts[key]++;
  }
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const penalty = counts.critical * 12 + counts.serious * 6 + counts.moderate * 2.5 + counts.minor;
  return {
    ...counts,
    total,
    score: Math.max(0, Math.round(100 - penalty)),
    totalFixed: issues.filter((issue) => issue.fixed).length,
  };
}

function impactedUsers(criterion) {
  if (criterion.includes('Contrast') || criterion.includes('1.4')) return 'People with low vision or colour-vision deficiencies';
  if (criterion.includes('Non-text Content') || criterion.includes('1.1')) return 'Blind people and screen-reader users';
  if (criterion.includes('Keyboard') || criterion.includes('Focus')) return 'Keyboard-only users and people using switch devices';
  if (criterion.includes('Target Size')) return 'People with motor impairments and touch users';
  if (criterion.includes('Label') || criterion.includes('Name, Role')) return 'Screen-reader and voice-control users';
  return 'People with disabilities; the specific impact depends on the affected content';
}

function fixFor(violation, node) {
  return {
    before: node.html || '(element markup unavailable)',
    after: generateFixSuggestion(violation.id, node),
    description: violation.help,
  };
}

function issuesFromViolations(violations) {
  const issues = [];
  for (const violation of violations) {
    const severity = IMPACT_MAP[violation.impact] || 'Minor';
    const criterion = getWcagCriterion(violation.tags);
    const wcagCriterion = criterion.startsWith('SC ') ? `WCAG 2.2 ${criterion}` : criterion;
    const category = getPourCategory(violation.tags);
    for (const node of violation.nodes) {
      const element = (node.html || '').slice(0, 1000);
      const affectedSelectors = node.target.map((selector) => String(selector).trim()).filter(Boolean).sort();
      issues.push({
        id: `${violation.id}-${issues.length + 1}`,
        title: violation.help,
        severity,
        category,
        wcag: wcagCriterion,
        wcagCriterion,
        pour: category,
        selector: affectedSelectors.join(', ') || '(selector unavailable)',
        element,
        elementBadge: String(issues.length + 1),
        impactedUsers: impactedUsers(wcagCriterion),
        whyMatters: node.failureSummary || violation.description,
        snippet: element,
        remediation: generateFixSuggestion(violation.id, node),
        fix: fixFor(violation, node),
        elementId: affectedSelectors.join(' | '),
        helpUrl: violation.helpUrl,
        ruleId: violation.id,
        fixed: false,
      });
    }
  }
  return issues;
}

function browserLaunchDiagnostic(error) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const stderrMarker = '\nstderr:';
  const stderrStart = rawMessage.indexOf(stderrMarker);
  const stderr = stderrStart >= 0
    ? rawMessage.slice(stderrStart + stderrMarker.length).split('\nTROUBLESHOOTING:')[0].trim().slice(-4000)
    : '';
  const cause = error instanceof Error ? error.cause : undefined;
  const redact = (value) => value
    .replace(/((?:password|token|secret|authorization)\s*[=:]\s*)\S+/gi, '$1[redacted]')
    .replace(/[A-Z]:\\[^\s)]+/gi, '[path]');
  return {
    name: error instanceof Error ? error.name : 'UnknownError',
    code: error?.code || '',
    message: redact(stderrStart >= 0 ? rawMessage.slice(0, stderrStart).trim() : rawMessage).slice(0, 1000),
    causeName: cause instanceof Error ? cause.name : '',
    causeCode: cause?.code || '',
    causeMessage: cause instanceof Error ? redact(cause.message).slice(0, 1000) : '',
    stderr: redact(stderr),
  };
}

async function launchBrowser(options) {
  try {
    const executablePath = configuredBrowserPath();
    return await puppeteer.launch({
      ...options,
      ...(executablePath ? { executablePath } : {}),
    });
  } catch (error) {
    console.error('Puppeteer browser launch diagnostic:', JSON.stringify(browserLaunchDiagnostic(error)));
    throw new Error(
      'Puppeteer could not launch the browser. Check PUPPETEER_EXECUTABLE_PATH and the backend launch diagnostics.',
      { cause: error },
    );
  }
}

export async function scanUrl(targetUrl, { timeoutMs = 60000, signal } = {}) {
  let browser;
  let proxy;
  let timeout;
  let abortHandler;
  let rejectAbort;
  let cleanupPromise;
  const deadlineController = new AbortController();
  const scanSignal = deadlineController.signal;
  const cancelled = new Promise((_, reject) => { rejectAbort = reject; });
  void cancelled.catch(() => {});

  const closeResources = () => {
    if (!cleanupPromise) {
      cleanupPromise = (async () => {
        const activeBrowser = browser;
        browser = undefined;
        if (activeBrowser) await activeBrowser.close();
        const activeProxy = proxy;
        proxy = undefined;
        if (activeProxy) await activeProxy.close();
      })();
    }
    return cleanupPromise;
  };

  const abortScan = (reason) => {
    if (scanSignal.aborted) return;
    deadlineController.abort(reason);
    rejectAbort(reason);
    void closeResources().catch((error) => {
      console.error('Failed to close timed-out audit resources:', error instanceof Error ? error.message : 'Unknown cleanup error.');
    });
  };

  const throwIfAborted = () => {
    if (scanSignal.aborted) throw scanSignal.reason || new Error('The audit was cancelled.');
  };

  const work = async () => {
    const parsedUrl = await assertPublicHttpUrl(targetUrl);
    throwIfAborted();
    let blockedDestination = '';
    proxy = await createScanningProxy((destination) => { blockedDestination = destination; });
    if (scanSignal.aborted) {
      const lateProxy = proxy;
      proxy = undefined;
      await lateProxy.close();
      throwIfAborted();
    }
    const browserLaunch = launchBrowser({
      headless: true,
      timeout: Math.min(timeoutMs, 30000),
      args: [
        '--disable-dev-shm-usage', '--disable-gpu',
        `--proxy-server=${proxy.url}`, '--proxy-bypass-list=<-loopback>', '--disable-quic',
        '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      ],
    });
    void browserLaunch.then(
      (launchedBrowser) => scanSignal.aborted
        ? launchedBrowser.close().catch((error) => {
          console.error('Failed to close a late-starting audit browser:', error instanceof Error ? error.message : 'Unknown cleanup error.');
        })
        : undefined,
      () => {},
    );
    browser = await browserLaunch;
    throwIfAborted();
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.setRequestInterception(true);

    let blockedMainFrameRequest = '';
    page.on('request', (request) => {
      const requestedUrl = request.url();
      if (['about:', 'data:', 'blob:'].some((scheme) => requestedUrl.startsWith(scheme))) {
        void request.continue().catch(() => {
          if (!scanSignal.aborted) console.warn('Could not continue a browser-internal request.');
        });
        return;
      }
      void assertPublicHttpUrl(requestedUrl)
        .then(() => request.continue())
        .catch((error) => {
          if (scanSignal.aborted) return;
          if (!(error instanceof Error) || !error.message.includes('private')) {
            console.warn('Could not validate or continue an outbound browser request.');
          }
          try {
            if (request.isNavigationRequest() && request.frame() === page.mainFrame()) blockedMainFrameRequest = requestedUrl;
          } catch {
            blockedMainFrameRequest = requestedUrl;
          }
          void request.abort('blockedbyclient').catch(() => {
            if (!scanSignal.aborted) console.warn('Could not abort a blocked browser request.');
          });
        });
    });

    page.setDefaultNavigationTimeout(Math.min(timeoutMs, 25000));
    let pageLoadError = null;
    try {
      await page.goto(parsedUrl.href, { waitUntil: 'domcontentloaded', timeout: Math.min(timeoutMs, 25000) });
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      if (blockedMainFrameRequest || blockedDestination) throw new Error('The target redirected to a private or reserved network destination.');
      throwIfAborted();
      pageLoadError = error instanceof Error ? error.message : 'Page navigation failed.';
      if (!await page.title().catch(() => '')) throw new Error(`Unable to load the target page: ${pageLoadError}`);
    }
    if (blockedMainFrameRequest || blockedDestination) throw new Error('The target attempted to access a private or reserved network destination.');

    throwIfAborted();
    const results = await new AxePuppeteer(page, axeCoreSource)
      .withTags(SCAN_TAGS)
      .analyze();
    const issues = issuesFromViolations(results.violations);
    const axeVersion = results.testEngine?.version || 'unknown';

    return {
      success: true,
      url: parsedUrl.href,
      pageTitle: (await page.title()) || parsedUrl.hostname,
      pageLoadError,
      scannedAt: new Date().toISOString(),
      axeVersion,
      scanConfiguration: {
        scanner: 'axe-core',
        axeVersion,
        tags: [...SCAN_TAGS],
        viewport: { ...VIEWPORT },
        timeoutMs,
      },
      issues,
      passedRules: results.passes.length,
      incompleteRules: results.incomplete.length,
      violationCount: issues.length,
      stats: calculateStats(issues),
    };
  };

  timeout = setTimeout(() => abortScan(new Error(`The audit exceeded its ${Math.ceil(timeoutMs / 1000)} second time limit.`)), timeoutMs);
  if (signal) {
    abortHandler = () => abortScan(new Error('The audit was cancelled.'));
    if (signal.aborted) abortHandler();
    else signal.addEventListener('abort', abortHandler, { once: true });
  }

  try {
    return await Promise.race([work(), cancelled]);
  } finally {
    clearTimeout(timeout);
    if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
    await closeResources();
  }
}
