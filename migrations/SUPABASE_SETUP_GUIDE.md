# Supabase Migration Guide for AccessLens

This guide walks you through migrating AccessLens from local JSON storage to Supabase PostgreSQL cloud database.

## Prerequisites

- Node.js 22.12 or newer
- Existing AccessLens installation with audit data
- A Supabase account (free tier available)

## Step 1: Create a Supabase Project

1. Go to **https://supabase.com** and sign in (or create a free account)

2. Click **"New Project"**

3. Fill in the project details:
   - **Name**: `accesslens-audits` (or your preferred name)
   - **Database Password**: Generate a strong password and **save it securely**
   - **Region**: Choose the region closest to you
   - **Pricing Plan**: Free tier is sufficient for development

4. Click **"Create new project"**

5. Wait 2-3 minutes for your project to be provisioned

## Step 2: Run the Database Migration SQL

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar

2. Click **"New query"**

3. Open the file `migrations/001_initial_schema.sql` from this project

4. **Copy the entire SQL content** from that file

5. **Paste it** into the Supabase SQL Editor

6. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

7. You should see: `Success. No rows returned`

8. Verify the table was created:
   - Click **"Table Editor"** in the left sidebar
   - You should see an **"audits"** table with 0 rows

## Step 3: Get Your Supabase Credentials

1. In your Supabase project, click **"Project Settings"** (gear icon) in the left sidebar

2. Click **"API"** in the settings menu

3. You'll see two important values:

   **A. Project URL**
   - Look for "Project URL" under "Configuration"
   - It looks like: `https://abcdefghijk.supabase.co`
   - **Copy this entire URL**

   **B. Service Role Key** (⚠️ Keep this secret!)
   - Scroll down to "Project API keys"
   - Find the **"service_role"** key (NOT the anon key)
   - Click the eye icon to reveal it
   - Click the copy icon to copy it
   - This key starts with `eyJ...` and is very long

   ⚠️ **IMPORTANT SECURITY NOTE**: 
   - The service_role key grants full database access
   - NEVER expose it to the browser or commit it to Git
   - Only store it in your local .env file

## Step 4: Configure AccessLens Backend

1. **Open Windows PowerShell** in the AccessLens project directory:
   ```powershell
   Set-Location "C:\Users\mukesh rs\OneDrive\Desktop\website accesibility audit"
   ```

2. **Create or edit the `.env` file**:
   ```powershell
   notepad .env
   ```

3. **Add these lines** to your .env file (replacing with your actual values):
   ```env
   PORT=5173
   HOST=127.0.0.1
   SCAN_TIMEOUT_MS=60000
   PUPPETEER_EXECUTABLE_PATH=
   
   # Keep JSON mode during testing
   STORAGE_MODE=json
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your-very-long-key...
   ```

4. **Replace these values**:
   - Replace `https://your-project-id.supabase.co` with your Project URL from Step 3A
   - Replace `eyJ...your-very-long-key...` with your Service Role Key from Step 3B

5. **Save the file** (Ctrl+S in Notepad) and close it

6. **Verify the file is correct**:
   ```powershell
   Get-Content .env
   ```
   
   You should see your Supabase URL and key (don't share this output!)

## Step 5: Test Migration (Dry Run)

Before importing your data, test that everything is configured correctly:

```powershell
node migrations/migrate-to-supabase.js --dry-run
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║   AccessLens Data Migration: JSON → Supabase PostgreSQL   ║
╚═══════════════════════════════════════════════════════════╝

🔍 DRY RUN MODE - No data will be imported

📂 Loading JSON data...
   Found 15 audits

🔍 Validating audit records...
   Valid: 15
   ✓ All records valid

╔═══════════════════════════════════════════════════════════╗
║                  Dry Run Complete!                        ║
╚═══════════════════════════════════════════════════════════╝

✓ 15 valid records ready for import
```

**If you see errors:**

- `❌ File not found`: Your audits.json file is missing
- `❌ Supabase not configured`: Check your .env file credentials
- `❌ Failed to query Supabase`: Make sure you ran the SQL migration in Step 2
- `Invalid records found`: Your audit data has validation errors (fix them in audits.json)

## Step 6: Import Your Data to Supabase

Once the dry run succeeds, import your actual data:

```powershell
node migrations/migrate-to-supabase.js
```

**Expected output:**
```
📂 Loading JSON data...
   Found 15 audits

🔍 Validating audit records...
   Valid: 15
   ✓ All records valid

🔌 Checking Supabase configuration...
   ✓ Configuration valid

🔍 Checking for existing records in Supabase...
   Found 0 existing records
   Will import 15 new records

📤 Importing to Supabase...
   Imported 15/15

✓ Successfully imported 15 audits

✅ Verifying import...
   Total records in Supabase: 15
   ✓ Sample record verified (ID: dca4422e...)

╔═══════════════════════════════════════════════════════════╗
║                   Migration Complete!                     ║
╚═══════════════════════════════════════════════════════════╝
```

**Note**: If you run the migration again, it will skip already-imported records (safe to re-run).

## Step 7: Verify Data in Supabase

1. Go to your Supabase project dashboard

2. Click **"Table Editor"** in the left sidebar

3. Click the **"audits"** table

4. You should see all your imported audits with:
   - ID, URL, page title
   - Scanned timestamp
   - Issue counts and stats
   - Full scan configuration and issues (in JSONB columns)

5. Click any row to expand and inspect the data

## Step 8: Switch to Supabase Storage Mode

Now that your data is safely in Supabase, switch AccessLens to use it:

1. **Edit your .env file**:
   ```powershell
   notepad .env
   ```

2. **Change this line**:
   ```env
   STORAGE_MODE=supabase
   ```
   (was `json`, now `supabase`)

3. **Save and close** the file

4. **Restart your AccessLens server**:
   - If it's running, press **Ctrl+C** in the terminal to stop it
   - Start it again:
     ```powershell
     npm.cmd run dev
     ```

5. **Look for this message** in the startup logs:
   ```
   ✓ Supabase storage configured
   ✓ Using Supabase storage mode
   ```

## Step 9: Test the Integration

1. **Open AccessLens**: http://localhost:5173

2. **Check Scan History**:
   - Click "Scan History" in the sidebar
   - You should see all your imported audits
   - Click any audit to view its full details

3. **Run a new audit**:
   - Enter a URL (e.g., `https://example.com`)
   - Click "Run accessibility audit"
   - Wait for it to complete

4. **Verify it saved to Supabase**:
   - Go to Supabase → Table Editor → audits
   - Click the refresh icon
   - Your new audit should appear at the top (most recent)
   - Click the row to see the full stored data

5. **Test comparison**:
   - Rescan the same URL
   - Choose to compare with the baseline
   - Verify the comparison works

6. **Test report export**:
   - Open an audit's report
   - Download the CSV
   - Verify the data is complete

7. **Restart test**:
   - Stop the server (Ctrl+C)
   - Start it again: `npm.cmd run dev`
   - Open Scan History
   - Verify all audits are still there (loaded from Supabase)

## Rollback to JSON Storage

If you need to switch back to local JSON storage:

1. Edit `.env` and change:
   ```env
   STORAGE_MODE=json
   ```

2. Restart the server

3. Your original `data/audits.json` file is unchanged and will be used again

**Note**: Any audits created while in Supabase mode will NOT appear in JSON mode (they only exist in Supabase). You can export them from Supabase Table Editor if needed.

## Backup Strategy

Your local JSON backup is at:
```
data/backups/audits-backup-YYYYMMDD-HHMMSS.json
```

**Additional safety measures:**

1. **Supabase automatic backups**:
   - Supabase automatically backs up your database daily
   - View backups: Project Settings → Database → Backups

2. **Manual Supabase export**:
   - Table Editor → audits → click "..." → Export as CSV/JSON

3. **Keep local JSON safe**:
   - The migration script never deletes `data/audits.json`
   - Keep your backup files in `data/backups/` (excluded from Git)

## Troubleshooting

### "Supabase is not configured" error
- Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env
- Make sure there are no extra spaces or quotes around the values
- Verify the URL starts with `https://`

### "Failed to query Supabase" error
- Run the SQL migration script again (Step 2)
- Check that your service role key is correct
- Verify your Supabase project is active (not paused)

### Audit history is empty after switching
- Check the server logs for errors
- Verify STORAGE_MODE=supabase in .env
- Make sure the migration completed successfully

### "Row Level Security" policy errors
- The service role key bypasses RLS automatically
- If you see RLS errors, you're using the wrong key (anon instead of service_role)

### Migration shows "all records already imported"
- This is normal if you've run the migration before
- The script skips duplicate IDs automatically
- To re-import, delete records from Supabase Table Editor first

## Production Deployment Considerations

⚠️ **This local demo setup is NOT production-ready**. Before deploying publicly:

1. **Add authentication**:
   - Implement user accounts and login
   - Associate audits with user IDs
   - Update RLS policies to enforce ownership

2. **Environment variables**:
   - Never commit .env files to Git
   - Use platform-specific secret management (Vercel/Netlify/Render)
   - Rotate your service role key if it was ever exposed

3. **Rate limiting**:
   - Add rate limits to prevent abuse
   - Consider Supabase connection pooling

4. **Database indexes**:
   - The migration includes basic indexes
   - Add more based on your query patterns

5. **Cost monitoring**:
   - Free tier: 500 MB database, 2 GB bandwidth, 50k API requests
   - Monitor usage in Supabase Dashboard → Usage

## Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Community**: https://github.com/supabase/supabase/discussions
- **AccessLens Issues**: Check your project's issue tracker

## Summary

✅ You've successfully migrated AccessLens to Supabase!

Your audit data is now:
- Stored in a cloud PostgreSQL database
- Backed up automatically by Supabase
- Accessible from anywhere (when you deploy)
- Protected by Row Level Security policies

The local JSON file remains as a backup and fallback option.
