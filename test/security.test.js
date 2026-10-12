import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPublicHttpUrl, isPublicAddress } from '../server/security.js';

test('rejects loopback, private, link-local, and reserved destinations', async () => {
  for (const url of [
    'http://localhost/',
    'http://127.0.0.1/',
    'http://10.0.0.1/',
    'http://192.168.1.1/',
    'http://169.254.169.254/',
    'http://[::1]/',
    'http://example.com:8080/',
    'file:///C:/Windows/win.ini',
  ]) {
    await assert.rejects(assertPublicHttpUrl(url));
  }
});

test('allows only globally routable address literals', () => {
  assert.equal(isPublicAddress('8.8.8.8'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
  assert.equal(isPublicAddress('127.0.0.1'), false);
  assert.equal(isPublicAddress('::ffff:127.0.0.1'), false);
  assert.equal(isPublicAddress('2001:db8::1'), false);
});

test('accepts a public HTTP(S) URL and rejects embedded credentials', async () => {
  assert.equal((await assertPublicHttpUrl('https://8.8.8.8/audit')).hostname, '8.8.8.8');
  await assert.rejects(assertPublicHttpUrl('https://user:password@example.com/'));
});
