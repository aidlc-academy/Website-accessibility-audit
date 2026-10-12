import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATABASE_PATH = path.join(DATA_DIR, 'audits.json');
let writeQueue = Promise.resolve();

export async function listAudits() {
  try {
    const data = JSON.parse(await fs.readFile(DATABASE_PATH, 'utf8'));
    if (!Array.isArray(data)) throw new Error('Audit database file must contain a JSON array.');
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function findAudit(id) {
  return (await listAudits()).find((audit) => audit.id === id) || null;
}

export function saveAudit(audit) {
  const save = async () => {
    const audits = await listAudits();
    audits.unshift(audit);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const temporaryPath = `${DATABASE_PATH}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(audits, null, 2), 'utf8');
    await fs.rename(temporaryPath, DATABASE_PATH);
  };
  writeQueue = writeQueue.then(save, save);
  return writeQueue;
}

export function getDatabasePath() {
  return DATABASE_PATH;
}
