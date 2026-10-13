                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isSupabaseEnabled,
  listAuditsFromSupabase,
  findAuditInSupabase,
  saveAuditToSupabase,
} from './supabaseStorage.js';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATABASE_PATH = path.join(DATA_DIR, 'audits.json');
let writeQueue = Promise.resolve();

// Storage mode: 'json' or 'supabase'
// Set STORAGE_MODE=supabase in .env to use Supabase
// Defaults to 'json' for backward compatibility
const storageMode = process.env.STORAGE_MODE || 'json';

// Validate storage mode
if (!['json', 'supabase'].includes(storageMode)) {
  throw new Error(`Invalid STORAGE_MODE: ${storageMode}. Must be 'json' or 'supabase'.`);
}

// Check Supabase configuration if mode is 'supabase'
if (storageMode === 'supabase') {
  if (!isSupabaseEnabled()) {
    throw new Error(
      'STORAGE_MODE is set to "supabase" but Supabase is not configured. ' +
      'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env, or change STORAGE_MODE to "json".'
    );
  }
  console.log('✓ Using Supabase storage mode');
} else {
  console.log('✓ Using local JSON storage mode');
}

// JSON storage functions (original implementation)
async function listAuditsFromJson() {
  try {
    const data = JSON.parse(await fs.readFile(DATABASE_PATH, 'utf8'));
    if (!Array.isArray(data)) throw new Error('Audit database file must contain a JSON array.');
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function findAuditInJson(id) {
  return (await listAuditsFromJson()).find((audit) => audit.id === id) || null;
}

function saveAuditToJson(audit) {
  const save = async () => {
    const audits = await listAuditsFromJson();
    audits.unshift(audit);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const temporaryPath = `${DATABASE_PATH}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(audits, null, 2), 'utf8');
    await fs.rename(temporaryPath, DATABASE_PATH);
  };
  writeQueue = writeQueue.then(save, save);
  return writeQueue;
}

// Public API - routes to appropriate storage based on mode
export async function listAudits() {
  if (storageMode === 'supabase') {
    return await listAuditsFromSupabase();
  }
  return await listAuditsFromJson();
}

export async function findAudit(id) {
  if (storageMode === 'supabase') {
    return await findAuditInSupabase(id);
  }
  return await findAuditInJson(id);
}

export function saveAudit(audit) {
  if (storageMode === 'supabase') {
    // Supabase saves are already atomic, no queue needed
    return saveAuditToSupabase(audit);
  }
  return saveAuditToJson(audit);
}

export function getDatabasePath() {
  return DATABASE_PATH;
}

export function getStorageMode() {
  return storageMode;
}
