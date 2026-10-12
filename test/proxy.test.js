import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createScanningProxy } from '../server/proxy.js';

test('the scanning proxy blocks private HTTP targets even when proxying', async () => {
  let blockedDestination = '';
  const proxy = await createScanningProxy((destination) => { blockedDestination = destination; });
  try {
    const result = await new Promise((resolve, reject) => {
      const request = http.request({
        hostname: '127.0.0.1',
        port: new URL(proxy.url).port,
        path: 'http://127.0.0.1:5173/',
        timeout: 5000,
      }, (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      });
      request.on('error', reject);
      request.end();
    });
    assert.equal(result, 403);
    assert.equal(blockedDestination, 'http://127.0.0.1:5173/');
  } finally {
    await proxy.close();
  }
});

test('the scanning proxy blocks private HTTPS tunnel destinations', async () => {
  let blockedDestination = '';
  const proxy = await createScanningProxy((destination) => { blockedDestination = destination; });
  try {
    const result = await new Promise((resolve, reject) => {
      const request = http.request({
        hostname: '127.0.0.1',
        port: new URL(proxy.url).port,
        method: 'CONNECT',
        path: '127.0.0.1:443',
        timeout: 5000,
      });
      request.on('connect', (response, socket) => {
        socket.destroy();
        resolve(response.statusCode);
      });
      request.on('error', reject);
      request.end();
    });
    assert.equal(result, 403);
    assert.equal(blockedDestination, '127.0.0.1:443');
  } finally {
    await proxy.close();
  }
});
