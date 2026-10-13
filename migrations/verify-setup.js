#!/usr/bin/env node

/**
 * Verify Supabase configuration and connectivity
 * Run this to check if your .env is configured correctly
 */

import { createClient } from '@supabase/supabase-js';

async function verify() {
  console.log('🔍 Verifying Supabase Configuration\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check environment variables
  console.log('1. Checking environment variables...');
  if (!supabaseUrl) {
    console.error('   ❌ SUPABASE_URL is not set');
    return false;
  }
  if (!supabaseKey) {
    console.error('   ❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    return false;
  }
  console.log(`   ✓ SUPABASE_URL: ${supabaseUrl}`);
  console.log(`   ✓ SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey.slice(0, 20)}...`);

  // Validate URL format
  console.log('\n2. Validating URL format...');
  if (!supabaseUrl.startsWith('https://')) {
    console.error('   ❌ SUPABASE_URL must start with https://');
    return false;
  }
  if (!supabaseUrl.includes('.supabase.co')) {
    console.error('   ⚠️  Warning: URL doesn\'t look like a standard Supabase URL');
  }
  console.log('   ✓ URL format valid');

  // Test connection
  console.log('\n3. Testing connection...');
  try {
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try to query the audits table
    const { data, error, count } = await client
      .from('audits')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error(`   ❌ Connection failed: ${error.message}`);
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('\n   The "audits" table does not exist.');
        console.error('   Run the SQL migration: migrations/001_initial_schema.sql');
      }
      return false;
    }

    console.log('   ✓ Connection successful');
    console.log(`   ✓ Found ${count || 0} audit record${count === 1 ? '' : 's'} in database`);

    // Test a read operation
    console.log('\n4. Testing read access...');
    const { data: sample, error: readError } = await client
      .from('audits')
      .select('*')
      .limit(1);

    if (readError) {
      console.error(`   ❌ Read test failed: ${readError.message}`);
      return false;
    }
    console.log('   ✓ Read access confirmed');

    // Test write access (rollback)
    console.log('\n5. Testing write access...');
    const testId = '00000000-0000-0000-0000-000000000000';
    const { error: writeError } = await client
      .from('audits')
      .insert({
        id: testId,
        url: 'https://test.example.com',
        success: true,
        scanned_at: new Date().toISOString(),
        axe_version: '0.0.0',
        scan_configuration: { test: true },
        issues: [],
        passed_rules: 0,
        incomplete_rules: 0,
        violation_count: 0,
        stats: {},
        status: 'completed',
        standard: 'test',
        viewport: '1280x900',
        manual_review_required: false,
      });

    if (writeError) {
      console.error(`   ❌ Write test failed: ${writeError.message}`);
      if (writeError.message.includes('duplicate key')) {
        console.log('   (This is expected if test record already exists)');
      } else {
        return false;
      }
    } else {
      console.log('   ✓ Write access confirmed');
      // Clean up test record
      await client.from('audits').delete().eq('id', testId);
      console.log('   ✓ Test record cleaned up');
    }

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║          Supabase Configuration Verified!                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log('Your Supabase setup is ready to use.');
    console.log('\nNext steps:');
    console.log('  1. Run migration: node migrations/migrate-to-supabase.js');
    console.log('  2. Set STORAGE_MODE=supabase in .env');
    console.log('  3. Restart the server');
    return true;

  } catch (error) {
    console.error(`\n❌ Unexpected error: ${error.message}`);
    return false;
  }
}

verify().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
