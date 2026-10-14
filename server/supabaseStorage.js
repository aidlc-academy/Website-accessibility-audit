import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let isSupabaseConfigured = false;

/**
 * Initialize Supabase client with service role key (backend only)
 * Never expose this key to the browser
 */
function initializeSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to enable cloud storage.');
    isSupabaseConfigured = false;
    return null;
  }

  if (!supabaseUrl.startsWith('https://')) {
    throw new Error('SUPABASE_URL must be a valid HTTPS URL');
  }

  if (supabaseServiceKey.length < 32) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY appears invalid (too short)');
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    isSupabaseConfigured = true;
    console.log('✓ Supabase storage configured');
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error.message);
    isSupabaseConfigured = false;
    return null;
  }
}

/**
 * Get Supabase client instance
 */
function getSupabaseClient() {
  if (!supabaseClient && isSupabaseConfigured === null) {
    initializeSupabase();
  }
  return supabaseClient;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseEnabled() {
  if (isSupabaseConfigured === null) {
    initializeSupabase();
  }
  return isSupabaseConfigured;
}

/**
 * Transform database row to audit object format
 */
function transformFromDb(row) {
  if (!row) return null;
  
  return {
    id: row.id,
    success: row.success,
    url: row.url,
    pageTitle: row.page_title,
    pageLoadError: row.page_load_error,
    scannedAt: row.scanned_at,
    axeVersion: row.axe_version,
    scanConfiguration: row.scan_configuration,
    issues: row.issues || [],
    passedRules: row.passed_rules,
    incompleteRules: row.incomplete_rules,
    violationCount: row.violation_count,
    stats: row.stats,
    status: row.status,
    standard: row.standard,
    viewport: row.viewport,
    ...(row.user_id ? { userId: row.user_id } : {}),
    manualReviewRequired: row.manual_review_required,
    reportFilename: row.report_filename,
    ...(row.compare_to_audit_id ? { compareToAuditId: row.compare_to_audit_id } : {}),
  };
}

/**
 * Transform audit object to database row format
 */
function transformToDb(audit) {
  return {
    id: audit.id,
    success: audit.success !== undefined ? audit.success : true,
    url: audit.url,
    page_title: audit.pageTitle || null,
    page_load_error: audit.pageLoadError || null,
    scanned_at: audit.scannedAt,
    axe_version: audit.axeVersion,
    scan_configuration: audit.scanConfiguration,
    issues: audit.issues || [],
    passed_rules: audit.passedRules || 0,
    incomplete_rules: audit.incompleteRules || 0,
    violation_count: audit.violationCount || 0,
    stats: audit.stats || {},
    status: audit.status || 'completed',
    standard: audit.standard,
    viewport: audit.viewport,
    user_id: audit.userId || null,
    manual_review_required: audit.manualReviewRequired !== undefined ? audit.manualReviewRequired : true,
    report_filename: audit.reportFilename || null,
    compare_to_audit_id: audit.compareToAuditId || null,
  };
}

/**
 * List all audits from Supabase, ordered by scanned_at DESC
 */
export async function listAuditsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await client
    .from('audits')
    .select('*')
    .order('scanned_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list audits from Supabase: ${error.message}`);
  }

  return (data || []).map(transformFromDb);
}

/**
 * Find a single audit by ID from Supabase
 */
export async function findAuditInSupabase(id) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await client
    .from('audits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to find audit in Supabase: ${error.message}`);
  }

  return transformFromDb(data);
}

/**
 * Save an audit to Supabase
 * This is atomic - the entire audit is saved in one transaction
 */
export async function saveAuditToSupabase(audit) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured');
  }

  const dbRow = transformToDb(audit);
  
  const { error } = await client
    .from('audits')
    .insert(dbRow);

  if (error) {
    throw new Error(`Failed to save audit to Supabase: ${error.message}`);
  }
}

/**
 * Initialize Supabase on module load
 */
initializeSupabase();
