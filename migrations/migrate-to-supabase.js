#!/usr/bin/env node

/**
 * AccessLens Data Migration Script
 * Migrates audit data from local JSON file to Supabase PostgreSQL
 * 
 * Usage:
 *   node migrations/migrate-to-supabase.js --dry-run    # Preview without importing
 *   node migrations/migrate-to-supabase.js              # Import to Supabase
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATABASE_PATH = path.join(DATA_DIR, 'audits.json');

const isDryRun = process.argv.includes('--dry-run');

// Validation functions
function validateAudit(audit, index) {
  const errors = [];
  
  if (!audit.id || typeof audit.id !== 'string') {
    errors.push(`Missing or invalid id`);
  }
  if (!audit.url || typeof audit.url !== 'string') {
    errors.push(`Missing or invalid url`);
  }
  if (!audit.scannedAt) {
    errors.push(`Missing scannedAt timestamp`);
  }
  if (!audit.scanConfiguration || typeof audit.scanConfiguration !== 'object') {
    errors.push(`Missing or invalid scanConfiguration`);
  }
  if (!Array.isArray(audit.issues)) {
    errors.push(`Missing or invalid issues array`);
  }
  
  return errors;
}

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
    manual_review_required: audit.manualReviewRequired !== undefined ? audit.manualReviewRequired : true,
    report_filename: audit.reportFilename || null,
    compare_to_audit_id: audit.compareToAuditId || null,
  };
}

async function loadJsonData() {
  try {
    const content = await fs.readFile(DATABASE_PATH, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of audits');
    }
    
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ File not found: ${DATABASE_PATH}`);
      console.error('   Make sure audits.json exists before migrating.');
      process.exit(1);
    }
    throw error;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   AccessLens Data Migration: JSON → Supabase PostgreSQL   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No data will be imported\n');
  }

  // Step 1: Load JSON data
  console.log('📂 Loading JSON data...');
  const audits = await loadJsonData();
  console.log(`   Found ${audits.length} audit${audits.length === 1 ? '' : 's'}\n`);

  if (audits.length === 0) {
    console.log('✓ No audits to migrate');
    process.exit(0);
  }

  // Step 2: Validate all records
  console.log('🔍 Validating audit records...');
  let validCount = 0;
  const invalidRecords = [];

  audits.forEach((audit, index) => {
    const errors = validateAudit(audit, index);
    if (errors.length > 0) {
      invalidRecords.push({ index, id: audit.id || 'unknown', errors });
    } else {
      validCount++;
    }
  });

  console.log(`   Valid: ${validCount}`);
  if (invalidRecords.length > 0) {
    console.log(`   Invalid: ${invalidRecords.length}\n`);
    console.log('❌ Invalid records found:\n');
    invalidRecords.forEach(({ index, id, errors }) => {
      console.log(`   Record ${index} (${id}):`);
      errors.forEach(error => console.log(`     - ${error}`));
      console.log('');
    });
    console.error('Fix these records in audits.json before migrating.');
    process.exit(1);
  }
  console.log('   ✓ All records valid\n');

  // Step 3: Check Supabase configuration
  if (!isDryRun) {
    console.log('🔌 Checking Supabase configuration...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase not configured\n');
      console.error('Set these environment variables in .env:');
      console.error('  SUPABASE_URL=https://your-project.supabase.co');
      console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n');
      console.error('Get these from: Supabase Dashboard → Project Settings → API');
      process.exit(1);
    }

    const client = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log('   ✓ Configuration valid\n');

    // Step 4: Check for existing records
    console.log('🔍 Checking for existing records in Supabase...');
    const { data: existing, error: listError } = await client
      .from('audits')
      .select('id')
      .limit(1000);

    if (listError) {
      console.error(`❌ Failed to query Supabase: ${listError.message}\n`);
      console.error('Make sure you have run the schema migration SQL first:');
      console.error('  migrations/001_initial_schema.sql\n');
      process.exit(1);
    }

    const existingIds = new Set((existing || []).map(row => row.id));
    const newRecords = audits.filter(audit => !existingIds.has(audit.id));
    const duplicateCount = audits.length - newRecords.length;

    console.log(`   Found ${existing?.length || 0} existing record${(existing?.length || 0) === 1 ? '' : 's'}`);
    console.log(`   Will import ${newRecords.length} new record${newRecords.length === 1 ? '' : 's'}`);
    if (duplicateCount > 0) {
      console.log(`   Skipping ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} (already imported)\n`);
    } else {
      console.log('');
    }

    if (newRecords.length === 0) {
      console.log('✓ All records already imported');
      process.exit(0);
    }

    // Step 5: Import data
    console.log('📤 Importing to Supabase...');
    const dbRows = newRecords.map(transformToDb);
    
    // Import in batches of 100 to avoid timeouts
    const batchSize = 100;
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < dbRows.length; i += batchSize) {
      const batch = dbRows.slice(i, i + batchSize);
      const { error } = await client.from('audits').insert(batch);
      
      if (error) {
        console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`);
        failed += batch.length;
      } else {
        imported += batch.length;
        process.stdout.write(`   Imported ${imported}/${newRecords.length}\r`);
      }
    }
    
    console.log('');

    if (failed > 0) {
      console.error(`\n❌ Migration completed with errors: ${imported} succeeded, ${failed} failed`);
      process.exit(1);
    }

    console.log(`\n✓ Successfully imported ${imported} audit${imported === 1 ? '' : 's'}\n`);

    // Step 6: Verify import
    console.log('✅ Verifying import...');
    const { count: finalCount, error: countError } = await client
      .from('audits')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`   Warning: Could not verify count: ${countError.message}`);
    } else {
      console.log(`   Total records in Supabase: ${finalCount}`);
    }

    // Sample verification
    const sampleIndex = Math.floor(Math.random() * newRecords.length);
    const sampleAudit = newRecords[sampleIndex];
    const { data: sampleRead, error: sampleError } = await client
      .from('audits')
      .select('*')
      .eq('id', sampleAudit.id)
      .single();

    if (sampleError) {
      console.error(`   ❌ Sample verification failed: ${sampleError.message}`);
    } else {
      console.log(`   ✓ Sample record verified (ID: ${sampleAudit.id.slice(0, 8)}...)`);
    }

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                   Migration Complete!                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log('Next steps:');
    console.log('  1. Set STORAGE_MODE=supabase in your .env file');
    console.log('  2. Restart the AccessLens server');
    console.log('  3. Test: create a new audit and verify it saves to Supabase');
    console.log('  4. View data: Supabase Dashboard → Table Editor → audits\n');
  } else {
    // Dry run summary
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  Dry Run Complete!                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`✓ ${validCount} valid record${validCount === 1 ? '' : 's'} ready for import`);
    console.log('\nTo import, run without --dry-run:');
    console.log('  node migrations/migrate-to-supabase.js\n');
  }
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
