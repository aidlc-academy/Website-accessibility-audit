import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { compareAudits } from '../server/comparison.js';
import { SCAN_TAGS } from '../server/scanner.js';

const require = createRequire(import.meta.url);
const axeCoreSource = readFileSync(require.resolve('axe-core'), 'utf8');
const configurationFor = (axeVersion) => ({
  scanner: 'axe-core',
  axeVersion,
  tags: [...SCAN_TAGS],
  viewport: { width: 1280, height: 900 },
  timeoutMs: 60000,
});

async function scanFixture(browser, html) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const results = await new AxePuppeteer(page, axeCoreSource).withTags(SCAN_TAGS).analyze();
    const issues = results.violations.flatMap((violation) => violation.nodes.map((node, index) => {
      const elementId = node.target.map((selector) => String(selector).trim()).filter(Boolean).sort().join(' | ');
      return {
        id: `${violation.id}-${index + 1}`,
        ruleId: violation.id,
        elementId,
        selector: node.target.join(', '),
        title: violation.help,
        severity: violation.impact,
      };
    }));
    return { axeVersion: results.testEngine?.version || 'unknown', issues };
  } finally {
    await page.close();
  }
}

test('compares controlled axe fixtures by rule and affected selector', { timeout: 90000 }, async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    timeout: 30000,
    args: ['--disable-dev-shm-usage', '--disable-gpu'],
  });
  try {
    const missingAlt = await scanFixture(
      browser,
      '<!doctype html><html lang="en"><head><title>Fixture</title></head><body><img id="fixture-logo" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="></body></html>',
    );
    const decorativeImage = await scanFixture(
      browser,
      '<!doctype html><html lang="en"><head><title>Fixture</title></head><body><img id="fixture-logo" alt="" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="></body></html>',
    );
    const unnamedButton = await scanFixture(
      browser,
      '<!doctype html><html lang="en"><head><title>Fixture</title></head><body><button id="fixture-action"></button></body></html>',
    );
    const createAudit = (id, scan) => ({
      id,
      url: 'https://fixture.example/',
      scannedAt: new Date().toISOString(),
      scanConfiguration: configurationFor(scan.axeVersion),
      issues: scan.issues,
    });

    assert.ok(missingAlt.issues.some((issue) => issue.ruleId === 'image-alt' && issue.elementId.includes('#fixture-logo')));
    assert.equal(decorativeImage.issues.some((issue) => issue.ruleId === 'image-alt'), false);
    assert.ok(unnamedButton.issues.some((issue) => issue.ruleId === 'button-name' && issue.elementId.includes('#fixture-action')));

    const resolved = compareAudits(createAudit('baseline-image', missingAlt), createAudit('fixed-image', decorativeImage));
    assert.equal(resolved.compatible, true);
    assert.equal(resolved.resolved.length, 1);
    assert.equal(resolved.resolved[0].ruleId, 'image-alt');
    assert.equal(resolved.remaining.length, 0);
    assert.equal(resolved.newlyDetected.length, 0);

    const changedElement = compareAudits(createAudit('baseline-image', missingAlt), createAudit('new-button', unnamedButton));
    assert.equal(changedElement.resolved.length, 1);
    assert.equal(changedElement.resolved[0].ruleId, 'image-alt');
    assert.equal(changedElement.newlyDetected.length, 1);
    assert.equal(changedElement.newlyDetected[0].ruleId, 'button-name');
  } finally {
    await browser.close();
  }
});

test('refuses to compare different pages or scan configurations', () => {
  const baseline = {
    id: 'baseline',
    url: 'https://fixture.example/',
    scanConfiguration: configurationFor('4.14.0'),
    issues: [],
  };
  assert.equal(compareAudits(baseline, { ...baseline, url: 'https://fixture.example/other' }).compatible, false);
  assert.equal(compareAudits(baseline, {
    ...baseline,
    scanConfiguration: configurationFor('4.13.0'),
  }).compatible, false);
});
