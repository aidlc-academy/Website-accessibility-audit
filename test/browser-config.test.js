import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { configuredBrowserPath } from '../server/browserConfig.js';

test('uses the managed Puppeteer browser when no explicit executable is configured', () => {
  assert.equal(configuredBrowserPath('  '), undefined);
});

test('accepts absolute executable paths wrapped in straight or typographic quotes', () => {
  assert.equal(configuredBrowserPath(`"${process.execPath}"`), process.execPath);
  assert.equal(configuredBrowserPath(`“${process.execPath}”`), process.execPath);
});

test('normalizes Windows slash-separated paths and rejects missing or relative executables', () => {
  if (process.platform === 'win32') {
    assert.equal(
      configuredBrowserPath(`“${process.execPath.replaceAll('\\', '/')}”`),
      path.normalize(process.execPath),
    );
  }
  assert.throws(() => configuredBrowserPath('chrome.exe'), /absolute path/);
  assert.throws(
    () => configuredBrowserPath(path.join(path.parse(process.execPath).root, 'missing', 'chrome.exe')),
    /does not identify a file/,
  );
});
