import fs from 'node:fs';
import path from 'node:path';

function removeWrappingQuotes(value) {
  const pairs = new Map([
    ['"', '"'],
    ["'", "'"],
    ['“', '”'],
    ['‘', '’'],
  ]);
  const first = value[0];
  return pairs.get(first) === value.at(-1) ? value.slice(1, -1).trim() : value;
}

export function configuredBrowserPath(value = process.env.PUPPETEER_EXECUTABLE_PATH) {
  if (value === undefined || value.trim() === '') return undefined;
  const unquoted = removeWrappingQuotes(value.trim());
  const executablePath = process.platform === 'win32'
    ? unquoted.replaceAll('/', '\\')
    : unquoted;

  if (!path.isAbsolute(executablePath)) {
    throw new Error('PUPPETEER_EXECUTABLE_PATH must be an absolute path on the backend host.');
  }
  try {
    if (!fs.statSync(executablePath).isFile()) throw new Error();
  } catch {
    throw new Error('PUPPETEER_EXECUTABLE_PATH does not identify a file accessible to the backend host.');
  }
  return executablePath;
}
