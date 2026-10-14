# AccessLens — Website Accessibility Audit Assistant

**Note**: This project is now maintained using Kiro IDE. See `.kiro/steering/` for product and technical documentation, and `.kiro/specs/accesslens/` for feature specifications.

AccessLens is a React, TypeScript, and Vite accessibility-audit interface backed by a local Express service. The interface retains its existing design while running real, server-side Puppeteer and axe-core scans.

## Windows setup and development

Use Node.js 22.12 or newer and npm.

For a first-time setup, run these commands in PowerShell from the project root. The guarded copy leaves an existing machine-specific `.env` untouched:

```powershell
npm.cmd install
npx.cmd puppeteer browsers install chrome
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev
```

Open <http://localhost:5173>. The `.env` file is optional; defaults are provided. Before starting, check whether another development server already occupies port 5173. Stop that server in its own terminal with Ctrl+C, or set a different `PORT` in `.env`. The backend binds to `127.0.0.1` by default and is intended for local use.

For later starts, use only:

```powershell
Set-Location "C:\Users\mukesh rs\OneDrive\Desktop\website accesibility audit"
npm.cmd run dev
```

This single integrated command starts both the Vite frontend (`http://localhost:5173`) and Express backend/API. There is no separate frontend or backend development command; do not launch a second Vite server.

To run the built frontend and backend together instead:

```powershell
Set-Location "C:\Users\mukesh rs\OneDrive\Desktop\website accesibility audit"
npm.cmd run build
npm.cmd start
```

Configure `PUPPETEER_EXECUTABLE_PATH` if Puppeteer's downloaded browser is unavailable or blocked by device policy; set it to the absolute path of an installed compatible Chrome/Edge executable on the backend host. Use ordinary straight quotes for paths containing spaces, for example `PUPPETEER_EXECUTABLE_PATH="C:/path/to/chrome.exe"` in `.env`. The backend also tolerates matching typographic quote pairs. Paths are validated from the backend runtime, so a Windows executable path does not work when the server runs inside WSL or a container. Project environment settings are loaded from the project root before the scanner initializes; an already-defined process environment variable takes precedence over `.env`. `SCAN_TIMEOUT_MS` defaults to 60000 and accepts values from 5000 to 120000.

## Build and tests

```powershell
npm.cmd test
npm.cmd run build
```

To serve a production build, build first and then run:

```powershell
npm.cmd run build
npm.cmd start
```

The production server serves `dist/` and the API from the same origin. Set `PORT` in `.env` to change the port.

## What an automated audit does

- Accepts public HTTP and HTTPS URLs only.
- Rejects local, private, link-local, reserved, and non-standard-port destinations. DNS answers are checked before navigation and every browser HTTP(S) request is checked, including redirects and subresources.
- Uses a headless Puppeteer browser and axe-core's WCAG 2.0 A/AA, WCAG 2.1 A/AA, and WCAG 2.2 AA tagged rules.
- Returns axe-core violation descriptions and impact/severity, the affected selector and captured markup, WCAG references when identified by axe-core, impacted-user context, and correction guidance.
- Includes axe-core passed and incomplete rule counts. Incomplete results and the report's manual checklist explicitly call for human review.
- Applies a bounded scan timeout and closes the browser on completion, failure, cancellation, or timeout.

An automated scan is **not** a complete accessibility audit and cannot establish WCAG conformance. Keyboard-only operation, screen-reader behavior, focus order and obscuration, meaningful alternative text, responsive behavior, and context-dependent criteria require manual verification.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Backend readiness and scan timeout |
| `POST` | `/api/audits` | Validate, scan, persist, and report a URL (`{ "url": "https://example.com" }`); optional `compareToAuditId` compares a rescan with a saved audit |
| `GET` | `/api/audits` | List saved audit summaries |
| `GET` | `/api/audits/:id` | Reopen a saved audit with its findings |
| `GET` | `/api/audits/:id/report` | Download the saved audit's Markdown report |
| `GET` | `/api/audits/:id/export.csv` | Download CSV from the selected saved audit |
| `GET` | `/api/reports` | List saved report metadata |

## Local persistence

Audit records are stored in a local SQLite database at `data/audits.sqlite`; generated Markdown reports remain in `reports/`. SQLite is built into the supported Node.js runtime, so no database server, credentials, or additional package installation is required. WAL journaling, foreign keys, indexes, and transactional saves are enabled by the backend.

On first startup, AccessLens imports the records in an existing `data/audits.json` exactly once. The JSON file is left unchanged as a backup/source copy. If the import fails, the server reports the error and does not mark the import complete. New audits are saved to SQLite and do not update the legacy JSON file. Back up both `data/audits.sqlite` and `reports/` to preserve the complete local history.

The database contains an `audits` table with searchable audit metadata and the full audit JSON payload, an `audit_issues` table with one row per finding, and a `storage_metadata` table that records the one-time legacy import. The audit API and frontend contract are unchanged. This local single-user app does not coordinate separate AccessLens processes; use a managed transactional database and proper authentication for a multi-user deployment. The Supabase schema in `migrations/` defines backend-only `audits` and `users` tables, but these migrations do not switch the active SQLite storage and file-based authentication to Supabase. See [the Supabase setup guide](./migrations/SUPABASE_SETUP_GUIDE.md) for the schema setup steps.

The Scan History view loads these saved records from the backend and reopens full findings by audit ID. Rescans are saved as new records without modifying their baseline; the saved comparison link is used to reconstruct resolved, remaining, and newly detected findings when a rescan is reopened. Comparisons require the same URL and scan configuration and match axe rule IDs plus affected-element selectors. Page content, personalization, and dynamic state can change between scans and affect the comparison. Local account records are stored in a file and are not connected to the Supabase schema.

The test suite includes a browser-based local HTML fixture that demonstrates an image missing alternative text being fixed, and verifies that comparisons distinguish resolved image findings from newly detected button findings. The fixture is scanned via an in-process browser page; it does not add a local-network exception to the production URL scanner.

## Three-minute local demonstration

1. Start AccessLens using the development command above and open <http://localhost:5173>.
2. Use the **Target website URL** field on the overview (or **New Audit**), enter a public HTTP(S) page you are authorized to test, and choose **Run accessibility audit**. Wait for the actual axe-core results to load.
3. Open a finding and review its severity, affected selector/markup, WCAG reference when available, and **suggested** correction guidance. AccessLens reports findings; it cannot edit arbitrary external websites. To apply fixes, change the code for a website you control.
4. Open **Scan History**, inspect the saved audit, and rescan it to compare results. To demonstrate a controlled fix reproducibly, run `npm.cmd test -- --test-name-pattern="controlled axe fixtures"` in PowerShell: it scans an image missing alternative text, then the same fixture image with `alt=""`, and asserts that `image-alt` for `#fixture-logo` is resolved under matching scan settings. The fixture runs in an in-process browser page, does not alter production URL protections, and does not create saved UI history records.
5. Open **Reports** for the saved audit, download its CSV, then choose **Print / Save PDF**. Select **Save as PDF** in the browser print dialog to save a PDF.

The controlled regression fixture can be verified from PowerShell with `npm.cmd test -- --test-name-pattern="controlled axe fixtures"`. It checks a missing image alternative being corrected and matches the resolved finding by rule ID and affected selector, entirely in a browser page created by the test; it does not weaken production URL protections.

For a quick responsive and keyboard check, resize the browser to 320 CSS pixels and a desktop width, then navigate the sidebar, scan form, history actions, and report dialog with Tab/Shift+Tab and Enter/Escape. Confirm visible focus, no horizontal page scrolling, and that errors/loading states are announced. This is a manual smoke check, not a WCAG conformance assessment.

## Local source backup

Before sharing or archiving source, create a code-only ZIP from the project root. This deliberately excludes `.env`, saved audits/reports, installed dependencies, build output, and browser profiles:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path (Split-Path (Get-Location) -Parent) "AccessLens-source-$stamp.zip"
$items = @(".agents", "assets", "css", "js", "server", "src", "test", ".env.example", ".gitignore", "index.html", "package.json", "package-lock.json", "README.md", "server.js", "tsconfig.json", "tsconfig.node.json", "vite.config.ts")
Compress-Archive -Path $items -DestinationPath $backup -CompressionLevel Optimal
```

Review the archive before sharing. Never add `.env`, `data/audits.json`, generated `reports/`, browser profiles, or other private audit data to a shareable backup.

## Environment configuration

Copy `.env.example` to `.env` if you need to customize the server port, scan timeout, or Puppeteer browser executable. SQLite storage does not require database credentials or a connection string.

## Project structure

```text
server/
  index.js          Express API and Vite/static integration
  scanner.js        Puppeteer + axe-core scan engine
  comparison.js     Compatible saved-audit comparison by rule and element
  security.js       URL, DNS, and network destination validation
  storage.js        SQLite audit persistence and one-time JSON import
  reporter.js       Markdown report generation and persistence
src/
  services/
    auditApi.ts     Typed frontend API client and response adapter
  components/
    views/          Overview, scan, findings, history, and reports
data/
  audits.sqlite     Created on first server startup; imports existing audits.json once
reports/
  audit-*.md        Generated scan reports
```
