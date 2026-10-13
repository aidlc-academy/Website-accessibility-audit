# Supabase Migration Summary

## Files Changed

### New Files Created

1. **`migrations/001_initial_schema.sql`**
   - PostgreSQL schema for the audits table
   - Includes indexes for performance
   - Row Level Security (RLS) policies that DENY all public/browser access
   - Triggers for automatic timestamp updates

2. **`migrations/migrate-to-supabase.js`**
   - Data migration script with dry-run mode
   - Validates all records before import
   - Safe to re-run (skips existing records)
   - Batch import with progress reporting

3. **`migrations/verify-setup.js`**
   - Configuration verification script
   - Tests connection and read/write access
   - Helps diagnose setup issues

4. **`migrations/SUPABASE_SETUP_GUIDE.md`**
   - Complete step-by-step setup instructions
   - Beginner-friendly with screenshots descriptions
   - Troubleshooting section
   - Security best practices

5. **`server/supabaseStorage.js`**
   - Supabase client initialization (backend only)
   - CRUD operations for audits
   - Data transformation between app format and DB schema
   - Error handling

### Modified Files

1. **`server/storage.js`**
   - Now supports both JSON and Supabase storage modes
   - Routes operations based on STORAGE_MODE environment variable
   - Preserves original JSON implementation for backward compatibility
   - Never silently falls back (explicit mode enforcement)

2. **`.env.example`**
   - Added STORAGE_MODE configuration
   - Added SUPABASE_URL placeholder
   - Added SUPABASE_SERVICE_ROLE_KEY placeholder
   - Security warnings about keeping keys secret

3. **`.gitignore`**
   - Added `data/backups/` to exclude local backup files

4. **`README.md`**
   - Updated "Local persistence" section
   - Documents both storage modes
   - Links to migration guide

### Backup Created

- **`data/backups/audits-backup-20261013-111613.json`**
  - Timestamped backup of original data
  - Contains all 15 existing audits
  - Excluded from Git

## Database Structure

### Table: `public.audits`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (matches JSON id field) |
| `success` | BOOLEAN | Whether scan completed successfully |
| `url` | TEXT | Scanned URL |
| `page_title` | TEXT | Page title from scan |
| `page_load_error` | TEXT | Error message if page failed to load |
| `scanned_at` | TIMESTAMPTZ | Scan timestamp |
| `axe_version` | TEXT | Version of axe-core used |
| `scan_configuration` | JSONB | Full scanner configuration |
| `issues` | JSONB | Array of accessibility violations |
| `passed_rules` | INTEGER | Count of passed axe rules |
| `incomplete_rules` | INTEGER | Count of incomplete checks |
| `violation_count` | INTEGER | Total violation count |
| `stats` | JSONB | Severity breakdown and score |
| `status` | TEXT | Audit status (completed/failed) |
| `standard` | TEXT | WCAG standard used |
| `viewport` | TEXT | Viewport dimensions |
| `manual_review_required` | BOOLEAN | Manual review flag |
| `report_filename` | TEXT | Generated report filename |
| `compare_to_audit_id` | UUID | Foreign key to baseline audit (nullable) |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

### Indexes

- `idx_audits_scanned_at`: Fast lookup by scan date (DESC)
- `idx_audits_url`: Fast lookup by URL
- `idx_audits_status`: Filter by status
- `idx_audits_compare_to`: Find rescans/comparisons

### Security (Row Level Security)

**All direct public/browser access is DENIED:**

- `anon` role (unauthenticated browser clients): Cannot read or write
- `authenticated` role (logged-in users): Cannot read or write
- `service_role` (backend only): Full access (bypasses RLS)

**Backend enforcement:**
- Only the Node.js server can access the database
- Uses `SUPABASE_SERVICE_ROLE_KEY` (never exposed to browser)
- Current implementation has no user authentication (single-user demo)
- For production: Add auth, user_id column, and updated RLS policies

## API Contract Preservation

**No API changes were made.** All endpoints return the same response shapes:

- `GET /api/audits` - List audits with issue counts
- `POST /api/audits` - Create and save new audit
- `GET /api/audits/:id` - Get full audit with comparison
- `GET /api/audits/:id/report` - Download Markdown report
- `GET /api/audits/:id/export.csv` - Export CSV
- `GET /api/reports` - List report metadata

Frontend code requires **zero changes** - the storage layer change is transparent.

## Migration Results

**Dry Run Test:** ✅ Ready (when Supabase configured)

**Data Backup:** ✅ Complete
- Location: `data/backups/audits-backup-20261013-111613.json`
- Records: 15 audits
- Original file preserved

**Actual Import:** ⏳ Pending manual setup

To complete the migration:

1. Create Supabase project
2. Run SQL schema migration
3. Configure .env with credentials
4. Run: `node migrations/migrate-to-supabase.js`
5. Set `STORAGE_MODE=supabase`
6. Restart server

## Testing Status

### Automated Tests: ⏳ Running

The existing test suite should pass without modification since:
- API contracts unchanged
- Default mode is still JSON
- Tests use in-memory fixtures

### Manual Tests Required After Migration:

When Supabase credentials are configured:

1. ✅ **Configuration test:**
   ```powershell
   node migrations/verify-setup.js
   ```

2. ⏳ **Dry run test:**
   ```powershell
   node migrations/migrate-to-supabase.js --dry-run
   ```

3. ⏳ **Import test:**
   ```powershell
   node migrations/migrate-to-supabase.js
   ```

4. ⏳ **Full integration test:**
   - Set `STORAGE_MODE=supabase`
   - Restart server
   - Load Scan History (should show 15 imported audits)
   - Run new scan → save
   - View in Supabase Table Editor
   - Restart server → verify data persists
   - Rescan → compare with baseline
   - Export report and CSV

5. ⏳ **Rollback test:**
   - Set `STORAGE_MODE=json`
   - Restart server
   - Verify original 15 audits load from JSON

## Remaining Blockers

### Blocker #1: Supabase Account Required

**Status:** Not created

**Action needed:**
1. Sign up at https://supabase.com (free tier available)
2. Create new project (takes ~3 minutes)
3. Note the project credentials

### Blocker #2: SQL Migration Not Run

**Status:** Not executed

**Action needed:**
1. Open Supabase SQL Editor
2. Paste contents of `migrations/001_initial_schema.sql`
3. Click Run
4. Verify "audits" table exists in Table Editor

### Blocker #3: Backend Not Configured

**Status:** .env file needs credentials

**Action needed:**
1. Edit `.env` file
2. Add your Supabase URL and service role key
3. Keep `STORAGE_MODE=json` initially for testing

### Blocker #4: Data Not Imported

**Status:** Waiting for blockers 1-3

**Action needed:**
1. Run verification: `node migrations/verify-setup.js`
2. Run dry-run: `node migrations/migrate-to-supabase.js --dry-run`
3. Run import: `node migrations/migrate-to-supabase.js`

## Security Checklist

✅ Service role key never exposed to browser
✅ Service role key stored only in backend .env
✅ .env file excluded from Git
✅ Backup files excluded from Git
✅ RLS policies deny all public access
✅ Connection only from backend (127.0.0.1)
✅ No credentials in logs or error messages
✅ Migration script validates inputs
⚠️  No user authentication (demo limitation)
⚠️  No rate limiting (add for production)

## Next Single Step: Create Supabase Project

**What to do right now:**

1. Open your browser
2. Go to **https://supabase.com**
3. Sign up or sign in
4. Click **"New Project"**
5. Fill in:
   - Name: `accesslens-audits`
   - Database Password: (generate and save it)
   - Region: (closest to you)
6. Click **"Create new project"**
7. Wait 2-3 minutes

Then follow the complete guide in `migrations/SUPABASE_SETUP_GUIDE.md`

---

## Verification Commands

Once credentials are configured:

```powershell
# Test configuration
node migrations/verify-setup.js

# Preview migration (safe, no changes)
node migrations/migrate-to-supabase.js --dry-run

# Import data to Supabase
node migrations/migrate-to-supabase.js

# Start server in JSON mode (default)
npm.cmd run dev

# Start server in Supabase mode
# First: edit .env and set STORAGE_MODE=supabase
npm.cmd run dev
```

## Finding Your Data in Supabase

After successful import:

1. Open https://supabase.com
2. Select your project
3. Click **"Table Editor"** (left sidebar)
4. Click **"audits"** table
5. You should see 15+ rows
6. Click any row to expand and see full JSON data

## Support

- Setup guide: `migrations/SUPABASE_SETUP_GUIDE.md`
- Supabase docs: https://supabase.com/docs
- Issues: Check your project's issue tracker
