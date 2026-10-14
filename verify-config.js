#!/usr/bin/env node
/**
 * Verify Supabase configuration without exposing secrets
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.join(ROOT_DIR, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Configuration Check\n');

// Check URL
if (!url) {
  console.log('❌ SUPABASE_URL: Not set');
  process.exit(1);
} else if (!url.startsWith('https://')) {
  console.log('❌ SUPABASE_URL: Invalid format (must start with https://)');
  process.exit(1);
} else if (!url.includes('supabase.co')) {
  console.log('⚠️  SUPABASE_URL: Unusual domain (expected *.supabase.co)');
} else {
  console.log('✅ SUPABASE_URL: Valid');
}

// Check Key (without revealing it)
if (!key) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY: Not set');
  process.exit(1);
} else if (key === 'REPLACE_THIS_WITH_YOUR_SERVICE_ROLE_KEY') {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY: Still placeholder text');
  process.exit(1);
} else if (key.length < 32) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY: Too short (invalid)');
  process.exit(1);
} else {
  const format = key.startsWith('eyJ') ? 'JWT' : 
                 key.startsWith('sb_secret_') ? 'Modern' : 
                 'Unknown';
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: Valid (${format} format, ${key.length} chars)`);
}

console.log('\n📡 Testing connection...\n');

// Test connection
import { createClient } from '@supabase/supabase-js';

try {
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Try a simple query to verify connectivity
  const { data, error } = await client
    .from('audits')
    .select('count', { count: 'exact', head: true });

  if (error) {
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('✅ Connection: Success');
      console.log('⚠️  Table "audits": Does not exist yet (needs schema migration)');
      console.log('\n✅ Configuration verified - ready for schema setup\n');
      process.exit(0);
    } else if (error.code === '42501' || error.message.includes('permission denied')) {
      console.log('❌ Connection: Permission denied');
      console.log('   Check that you used the service_role key, not anon key');
      process.exit(1);
    } else {
      console.log('❌ Connection failed:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Connection: Success');
    console.log(`✅ Table "audits": Exists (${data || 0} records)`);
    console.log('\n✅ Configuration verified - database ready\n');
    process.exit(0);
  }
} catch (error) {
  console.log('❌ Connection failed:', error.message);
  process.exit(1);
}
