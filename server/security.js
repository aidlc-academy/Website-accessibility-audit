import { lookup } from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.test', '.invalid', '.example'];
const BLOCKED_IPV4_RANGES = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
];

export class TargetUrlError extends Error {}

function ipv4ToNumber(address) {
  return address.split('.').reduce((value, octet) => ((value << 8) | Number(octet)) >>> 0, 0);
}

function isInIpv4Range(address, network, prefix) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4ToNumber(address) & mask) === (ipv4ToNumber(network) & mask);
}

function isPublicAddress(address) {
  const version = net.isIP(address);
  if (version === 4) {
    return !BLOCKED_IPV4_RANGES.some(([network, prefix]) => isInIpv4Range(address, network, prefix));
  }
  if (version !== 6 || address.startsWith('::ffff:')) return false;

  const firstHextet = Number.parseInt(address.split(':')[0], 16);
  const globalUnicast = firstHextet >= 0x2000 && firstHextet <= 0x3fff;
  return globalUnicast &&
    !address.startsWith('2001:db8:') &&
    !address.startsWith('2001:0000:') &&
    !address.startsWith('2001:20:') &&
    !address.startsWith('2001:10:') &&
    !address.startsWith('2001:2:') &&
    !address.startsWith('2002:');
}

export async function resolvePublicHttpUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TargetUrlError('Enter a valid absolute HTTP or HTTPS URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new TargetUrlError('Only HTTP(S) URLs without embedded credentials are allowed.');
  }
  if ((parsed.port && parsed.protocol === 'http:' && parsed.port !== '80') ||
      (parsed.port && parsed.protocol === 'https:' && parsed.port !== '443')) {
    throw new TargetUrlError('Only standard HTTP and HTTPS ports are allowed.');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!hostname || BLOCKED_HOST_SUFFIXES.some((suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix))) {
    throw new TargetUrlError('Local and reserved hostnames cannot be scanned.');
  }

  const ipVersion = net.isIP(hostname);
  if (ipVersion) {
    if (!isPublicAddress(hostname)) throw new TargetUrlError('Private or reserved network addresses cannot be scanned.');
    return { url: parsed, addresses: [{ address: hostname, family: ipVersion }] };
  }

  let addresses;
  try {
    let timeout;
    try {
      addresses = await Promise.race([
        lookup(hostname, { all: true, verbatim: true }),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new TargetUrlError('The target hostname could not be resolved in time.')), 5000);
        }),
      ]);
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    throw new TargetUrlError('The target hostname could not be resolved.');
  }
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new TargetUrlError('The target resolves to a private or reserved network address.');
  }
  return { url: parsed, addresses };
}

export async function assertPublicHttpUrl(value) {
  return (await resolvePublicHttpUrl(value)).url;
}

export { isPublicAddress };
