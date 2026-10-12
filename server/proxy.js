import http from 'node:http';
import net from 'node:net';
import { resolvePublicHttpUrl } from './security.js';

function localSocketAddress(address) {
  return address.includes(':') ? `[${address}]` : address;
}

function selectAddress(addresses) {
  return addresses.find(({ family }) => family === 4) || addresses[0];
}

export async function createScanningProxy(onBlocked = () => {}) {
  const server = http.createServer((request, response) => {
    void (async () => {
      let target;
      let address;
      try {
        const resolved = await resolvePublicHttpUrl(request.url);
        target = resolved.url;
        address = selectAddress(resolved.addresses);
      } catch {
        onBlocked(request.url || 'unknown');
        response.writeHead(403, { 'content-type': 'text/plain' });
        response.end('Blocked non-public network destination.');
        return;
      }

      const upstream = http.request({
        hostname: address.address,
        family: address.family,
        port: Number(target.port || 80),
        method: request.method,
        path: `${target.pathname}${target.search}`,
        headers: { ...request.headers, host: target.host },
        agent: false,
        timeout: 15000,
      }, (upstreamResponse) => {
        response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        upstreamResponse.pipe(response);
      });
      upstream.on('timeout', () => upstream.destroy(new Error('Upstream request timed out.')));
      upstream.on('error', () => {
        if (!response.headersSent) response.writeHead(502, { 'content-type': 'text/plain' });
        response.end('The target server could not be reached.');
      });
      request.pipe(upstream);
    })();
  });

  server.on('connect', (request, client, head) => {
    void (async () => {
      let target;
      let address;
      try {
        const resolved = await resolvePublicHttpUrl(`https://${request.url}/`);
        target = resolved.url;
        address = selectAddress(resolved.addresses);
      } catch {
        onBlocked(request.url || 'unknown');
        client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        return;
      }

      const upstream = net.connect({
        host: address.address,
        family: address.family,
        port: Number(target.port || 443),
      });
      upstream.setTimeout(15000);
      upstream.once('connect', () => {
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) upstream.write(head);
        client.pipe(upstream);
        upstream.pipe(client);
      });
      upstream.on('timeout', () => upstream.destroy());
      upstream.on('error', () => client.destroy());
      client.on('error', () => upstream.destroy());
      client.on('close', () => upstream.destroy());
    })();
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not bind the secure scanning proxy.');
  return {
    url: `http://${localSocketAddress(address.address)}:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}
