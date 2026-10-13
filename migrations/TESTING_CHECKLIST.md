# Testing Checklist for Supabase Migration

## Pre-Migration Tests (JSON Mode)

Run these tests BEFORE switching to Supabase to verify nothing broke:

### 1. Server Starts Successfully
```powershell
npm.cmd run dev
```
**Expected:** Server starts, shows "Using local JSON storage mode"

### 2. Load Existing History
- Open http://localhost:5173
- Click "Scan History"
- **Expected:** See all 15 existing audits

### 3. Run New Scan
- Enter URL: `https://example.com`
- Click "Run accessibility audit"
- **Expected:** Scan completes, results display

### 4. View Audit Details
- Click any audit in history
- **Expected:** Full details load with issues

### 5. Export Report
- Open an audit
- Click report link
- **Expected:** Markdown download

### 6. Export CSV
- Open an audit
- Download CSV
- **Expected:** CSV downloads with findings

### 7. Production Build
```powershell
npm.cmd run build
npm.cmd start
```
**Expected:** Build succeeds, production server starts

## Supabase Configuration Tests

### 8. Verify Setup Script
```powershell
# After adding credentials to .env
node migrations/verify-setup.js
```
**Expected:** All checks pass with ✓

### 9. Dry Run Migration
```powershell
node migrations/migrate-to-supabase.js --dry-run
```
**Expected:** 
- Found 15 audits
- All valid
- Ready for import

## Migration Tests

### 10. Import Data
```powershell
node migrations/migrate-to-supabase.js
```
**Expected:**
- Successfully imported 15 audits
- Verification passes
- Sample record confirmed

### 11. Verify in Supabase Dashboard
- Open Supabase Table Editor
- Click "audits" table
- **Expected:** See 15 rows with full data

## Post-Migration Tests (Supabase Mode)

Set `STORAGE_MODE=supabase` in .env before these tests:

### 12. Server Starts in Supabase Mode
```powershell
npm.cmd run dev
```
**Expected:** 
- "Supabase storage configured"
- "Using Supabase storage mode"

### 13. Load History from Supabase
- Open http://localhost:5173
- Click "Scan History"
- **Expected:** See all 15 imported audits

### 14. Open Existing Audit
- Click any audit from history
- **Expected:** Full details load correctly

### 15. Run New Scan in Supabase Mode
- Enter URL: `https://example.com`
- Run audit
- **Expected:** 
  - Scan completes
  - Saves to Supabase
  - Appears in history

### 16. Verify New Audit in Supabase
- Supabase Table Editor → audits
- Refresh
- **Expected:** New audit row appears (16 total)

### 17. Test Comparison Feature
- Rescan same URL from test 15
- Select "Compare with baseline"
- **Expected:** 
  - Comparison works
  - Shows resolved/remaining/new issues

### 18. Restart Server (Persistence Test)
- Stop server (Ctrl+C)
- Restart: `npm.cmd run dev`
- Load Scan History
- **Expected:** All audits still load (persisted in Supabase)

### 19. Export Reports in Supabase Mode
- Open any audit
- Download Markdown report
- Download CSV
- **Expected:** Both exports work correctly

### 20. Production Build in Supabase Mode
```powershell
npm.cmd run build
npm.cmd start
```
**Expected:** Build and start succeed

## Rollback Tests

### 21. Switch Back to JSON Mode
- Edit .env: `STORAGE_MODE=json`
- Restart server
- **Expected:** 
  - Server starts
  - "Using local JSON storage mode"

### 22. Verify Original Data Still Accessible
- Load Scan History
- **Expected:** Original 15 audits load from JSON

### 23. Switch Back to Supabase
- Edit .env: `STORAGE_MODE=supabase`
- Restart server
- **Expected:** 16 audits load (15 original + 1 new from test 15)

## Error Handling Tests

### 24. Invalid Storage Mode
```powershell
# Temporarily set in .env: STORAGE_MODE=invalid
npm.cmd run dev
```
**Expected:** Server fails with clear error message

### 25. Missing Supabase Credentials
```powershell
# Set STORAGE_MODE=supabase but remove credentials
npm.cmd run dev
```
**Expected:** Server fails with credential error

### 26. Database Connection Failure
- Set STORAGE_MODE=supabase
- Use invalid SUPABASE_URL
- Start server
**Expected:** Clear connection error

## Re-run Migration Safety

### 27. Re-import Data
```powershell
node migrations/migrate-to-supabase.js
```
**Expected:** 
- "Skipping X duplicates (already imported)"
- No new records added
- No errors

## Test Results Template

Copy and fill this out:

```
Date: _______________
Tester: _______________

Pre-Migration (JSON):
[ ] Test 1-7: All passed

Configuration:
[ ] Test 8-9: All passed

Migration:
[ ] Test 10-11: All passed

Post-Migration (Supabase):
[ ] Test 12-20: All passed

Rollback:
[ ] Test 21-23: All passed

Error Handling:
[ ] Test 24-26: All passed

Safety:
[ ] Test 27: Passed

Issues Found:
_______________________________________________
_______________________________________________

Overall Status: [ ] PASS [ ] FAIL
```

## Automated Test Suite

The existing test suite should pass in both modes:

```powershell
npm.cmd test
```

**Expected:** All tests pass (storage layer is transparent to tests)

## Performance Comparison

Optional: Compare query performance

```powershell
# JSON mode
time { node -e "import('./server/storage.js').then(m => m.listAudits())" }

# Supabase mode (after configuring)
time { node -e "import('./server/storage.js').then(m => m.listAudits())" }
```

Note: Supabase may be slower initially due to network latency, but provides better scalability.
