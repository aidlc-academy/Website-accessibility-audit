// AccessLens storage layer - now using Supabase
import { 
  listAuditsFromSupabase, 
  findAuditInSupabase, 
  saveAuditToSupabase,
  isSupabaseEnabled,
} from './supabaseStorage.js';

// Verify Supabase is configured on startup
if (!isSupabaseEnabled()) {
  throw new Error(
    'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file.'
  );
}

console.log('✓ Using Supabase cloud storage');

export async function listAudits() {
  try {
    return await listAuditsFromSupabase();
  } catch (error) {
    console.error('Failed to list audits from Supabase:', error.message);
    throw new Error(`Cloud storage error: ${error.message}`);
  }
}

export async function findAudit(id) {
  try {
    return await findAuditInSupabase(id);
  } catch (error) {
    console.error(`Failed to find audit ${id} in Supabase:`, error.message);
    throw new Error(`Cloud storage error: ${error.message}`);
  }
}

export async function saveAudit(audit) {
  try {
    await saveAuditToSupabase(audit);
  } catch (error) {
    console.error('Failed to save audit to Supabase:', error.message);
    throw new Error(`Cloud storage error: ${error.message}`);
  }
}

// Legacy function for compatibility
export function getDatabasePath() {
  return 'supabase'; // Not used, but kept for compatibility
}
