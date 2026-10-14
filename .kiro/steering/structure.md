# AccessLens - Project Structure & Conventions

> **Note**: This document describes the structure of an existing, implemented application. AccessLens was developed prior to Kiro adoption and is now maintained using Kiro IDE.

---

## Directory Structure

```
website-accessibility-audit/
├── .agents/                    # Legacy skill documentation (preserved)
│   └── skills/
│       └── wcag-audit/        # Manual WCAG audit procedures
│
├── .git/                       # Git version control
├── .gitignore                  # Git ignore rules
│
├── .kiro/                      # Kiro IDE workspace configuration
│   ├── settings/
│   │   └── mcp.json           # Model Context Protocol config
│   ├── steering/              # Product & technical documentation
│   │   ├── product.md
│   │   ├── tech.md
│   │   └── structure.md       # This file
│   └── specs/
│       └── accesslens/        # Feature specifications
│
├── assets/                     # Static assets
│   └── logo.svg
│
├── css/                        # Legacy CSS (not actively used)
│   └── styles.css
│
├── data/                       # Local data storage
│   ├── audits.sqlite          # Legacy SQLite (not used)
│   └── users.json             # Local user accounts
│
├── dist/                       # Production build output (generated)
│
├── js/                         # Legacy JavaScript (not actively used)
│
├── migrations/                 # Database migrations
│   ├── 001_initial_schema.sql     # Supabase audits table
│   ├── 002_add_user_id.sql        # Add user_id column
│   ├── migrate-to-supabase.js     # Legacy migration script
│   └── SUPABASE_SETUP_GUIDE.md    # Setup instructions
│
├── node_modules/               # NPM dependencies (gitignored)
│
├── reports/                    # Generated audit reports (gitignored)
│   ├── audit-*.md             # Markdown reports
│   └── README.md
│
├── server/                     # Express backend
│   ├── index.js               # Main API routes & server
│   ├── scanner.js             # Puppeteer + axe-core engine
│   ├── security.js            # SSRF protection & validation
│   ├── storage.js             # Storage layer (Supabase wrapper)
│   ├── supabaseStorage.js     # Supabase client implementation
│   ├── reporter.js            # Report generation (MD/CSV)
│   ├── comparison.js          # Audit comparison logic
│   ├── simpleAuth.js          # JWT authentication
│   ├── proxy.js               # Request filtering proxy
│   ├── browserConfig.js       # Puppeteer configuration
│   └── start-production.js    # Production server entry
│
├── src/                        # React frontend source
│   ├── components/
│   │   ├── common/            # Reusable components
│   │   │   ├── BackendBadge.tsx
│   │   │   ├── LiveAnnouncer.tsx
│   │   │   ├── ReportModal.tsx
│   │   │   ├── SkipLink.tsx
│   │   │   └── ThreeScene.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── views/             # Page views
│   │       ├── AuditStudioView.tsx
│   │       ├── FixWorkspaceView.tsx
│   │       ├── LoginView.tsx
│   │       ├── OverviewView.tsx
│   │       ├── ReportsView.tsx
│   │       ├── ScanHistoryView.tsx
│   │       ├── ScanProgressView.tsx
│   │       ├── SettingsView.tsx
│   │       └── VisualizersView.tsx
│   ├── services/
│   │   └── auditApi.ts        # API client & type adapters
│   ├── types/
│   │   └── audit.ts           # TypeScript type definitions
│   ├── App.tsx                # Main React app component
│   ├── main.tsx               # React entry point
│   └── vite-env.d.ts          # Vite type declarations
│
├── test/                       # Test files
│   └── scanner.test.js        # Scanner unit tests
│
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment template
├── index.html                  # HTML entry point
├── package.json                # NPM package manifest
├── package-lock.json           # NPM lockfile
├── README.md                   # Setup & usage instructions
├── server.js                   # Dev server entry point
├── tsconfig.json               # TypeScript config
├── tsconfig.node.json          # TypeScript config for Node
├── vite.config.ts              # Vite bundler config
│
└── Documentation Files
    ├── AUTH_SETUP_COMPLETE.md
    ├── DEMO_GUIDE.md
    ├── IMPLEMENTATION_SUMMARY.md
    ├── SIMPLE_AUTH_GUIDE.md
    ├── SUPABASE_MIGRATION_SUMMARY.md
    └── TEST_WORKFLOW.md
```

---

## File Naming Conventions

### Frontend (TypeScript/React)
- **Components**: PascalCase with `.tsx` extension
  - `OverviewView.tsx`, `AuditStudioView.tsx`
  - Component name matches filename
- **Services**: camelCase with `.ts` extension
  - `auditApi.ts`
- **Types**: camelCase with `.ts` extension
  - `audit.ts`

### Backend (JavaScript)
- **Modules**: camelCase with `.js` extension
  - `scanner.js`, `security.js`, `simpleAuth.js`
- **Entry points**: lowercase with hyphen separator
  - `start-production.js`

### Configuration
- **Lowercase with dots**: `tsconfig.json`, `vite.config.ts`
- **UPPERCASE for docs**: `README.md`, `DEMO_GUIDE.md`

### Database
- **Migrations**: Numbered prefix, snake_case
  - `001_initial_schema.sql`
  - `002_add_user_id.sql`

---

## Code Organization Patterns

### React Component Structure

```typescript
// 1. Imports (grouped by category)
import React, { useState, useEffect } from 'react';
import { ViewType, AuditTarget } from '../../types/audit';
import { getAudit, runAudit } from '../../services/auditApi';

// 2. Type definitions
interface OverviewViewProps {
  onStartScan: (url: string) => void;
  stats: AuditStats;
  // ...
}

// 3. Component definition
export const OverviewView: React.FC<OverviewViewProps> = ({
  onStartScan,
  stats,
}) => {
  // 4. State hooks
  const [url, setUrl] = useState('');
  
  // 5. Effect hooks
  useEffect(() => {
    // ...
  }, []);
  
  // 6. Event handlers
  const handleSubmit = (event: React.FormEvent) => {
    // ...
  };
  
  // 7. Render
  return (
    <section>
      {/* JSX */}
    </section>
  );
};
```

### Backend Module Structure

```javascript
// 1. Imports
import { createClient } from '@supabase/supabase-js';
import { assertPublicHttpUrl } from './security.js';

// 2. Constants
const MAX_RETRIES = 3;
const TIMEOUT_MS = 5000;

// 3. Helper functions (not exported)
function transformToDb(audit) {
  // ...
}

// 4. Main functions (exported)
export async function saveAudit(audit) {
  // ...
}

export async function listAudits() {
  // ...
}
```

---

## TypeScript Type System

### Type Definitions (`src/types/audit.ts`)

```typescript
// Domain types
export interface AuditIssue {
  id: string;
  title: string;
  severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor';
  category: string;
  wcag: string;
  // ...
}

export interface AuditTarget {
  id: string;
  url: string;
  title: string;
  issues: AuditIssue[];
  stats: AuditStats;
  // ...
}

// Union types for views
export type ViewType = 
  | 'overview' 
  | 'scan' 
  | 'audit-studio' 
  | 'fix-workspace' 
  | 'scan-history' 
  | 'reports' 
  | 'settings';
```

### Type Usage
- **Strict mode enabled**: All types must be explicit
- **No `any` types**: Use specific types or `unknown`
- **Interface over type**: Prefer `interface` for object shapes
- **Union types**: For enums and variants

---

## API Naming Conventions

### REST Endpoints

```
GET  /api/health                    # Server health check
POST /api/audits                    # Create new audit (scan)
GET  /api/audits                    # List all audits
GET  /api/audits/:id                # Get single audit
GET  /api/audits/:id/report         # Download Markdown report
GET  /api/audits/:id/export.csv     # Download CSV export
GET  /api/reports                   # List report metadata

POST /api/auth/register             # User registration
POST /api/auth/login                # User login
GET  /api/auth/me                   # Current user info
```

**Pattern:**
- Plural nouns for resources: `/audits`, `/reports`
- Actions via HTTP methods: POST, GET, PUT, DELETE
- Sub-resources with slash: `/audits/:id/report`
- File extensions for formats: `.csv`, `.md`

### Frontend API Client (`src/services/auditApi.ts`)

```typescript
// Function names match domain actions
export async function runAudit(url: string, signal: AbortSignal) { }
export async function getAudit(auditId: string) { }
export async function listAudits() { }
export function statsForTarget(target: AuditTarget) { }
```

**Pattern:**
- Verb-noun format: `runAudit`, `getAudit`, `listAudits`
- Async operations return Promises
- Accept AbortSignal for cancellable operations

---

## Database Naming Conventions

### Table & Column Names (PostgreSQL)
- **Tables**: Lowercase, plural nouns
  - `audits`, `users` (if implemented)
- **Columns**: snake_case
  - `page_title`, `scanned_at`, `compare_to_audit_id`
- **Indexes**: Prefix `idx_`, descriptive
  - `idx_audits_scanned_at`, `idx_audits_url`

### JavaScript ↔ Database Mapping

```javascript
// JavaScript (camelCase)
const audit = {
  pageTitle: 'Example Domain',
  scannedAt: '2024-01-01T00:00:00Z',
  compareToAuditId: 'uuid-here'
};

// Database (snake_case)
INSERT INTO audits (
  page_title,
  scanned_at,
  compare_to_audit_id
) VALUES (...);
```

**Transform functions in `supabaseStorage.js`:**
- `transformToDb()`: camelCase → snake_case
- `transformFromDb()`: snake_case → camelCase

---

## Styling Conventions

### Tailwind CSS Classes

**Spacing:**
- Margin: `m-*`, `mx-*`, `my-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*`
- Padding: `p-*`, `px-*`, `py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*`
- Gap: `gap-*`

**Layout:**
- Display: `flex`, `grid`, `block`, `inline-block`
- Flexbox: `flex-col`, `flex-row`, `items-center`, `justify-between`
- Grid: `grid-cols-*`, `col-span-*`

**Theme Colors (defined in index.html):**
```css
primary: #3828b5
secondary: #594cc2
surface: #faf8ff
error: #ba1a1a
success: #0d7a5f
```

**Custom Classes:**
```css
.glass-card         /* Glassmorphism effect */
.min-target-size    /* WCAG 2.5.8 compliant touch target */
.sr-only            /* Screen reader only */
```

---

## Error Handling Patterns

### Frontend Error Handling

```typescript
try {
  const result = await apiCall();
  handleSuccess(result);
} catch (error) {
  if (error instanceof AbortError) {
    // User cancelled, silent fail
    return;
  }
  setError(error instanceof Error ? error.message : 'Unknown error');
  announceToScreenReader('Error: ' + errorMessage);
}
```

### Backend Error Handling

```javascript
// Specific error classes
export class TargetUrlError extends Error {}
export class ScanTimeoutError extends Error {}

// Middleware error handler
app.use('/api', (error, req, res, next) => {
  if (error instanceof TargetUrlError) {
    return res.status(400).json({ error: error.message });
  }
  console.error('Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error' });
});
```

---

## Git Workflow

### Branch Naming
- `main` - Production-ready code
- Feature branches: Not currently used (direct commits to main)

### Commit Messages
- Imperative mood: "Add feature" not "Added feature"
- Capitalize first letter
- No period at end
- Reference issues: "Fix #123: Description"

### Files to Ignore (`.gitignore`)
```gitignore
.env                  # Secrets
data/audits.json      # Legacy data
data/*.sqlite*        # Database files
node_modules/         # Dependencies
dist/                 # Build output
reports/              # Generated reports
```

---

## Environment Configuration

### `.env` Structure
```env
# Server Configuration
PORT=5173
HOST=127.0.0.1
SCAN_TIMEOUT_MS=60000

# Puppeteer Configuration
PUPPETEER_EXECUTABLE_PATH=

# Database Configuration (REQUIRED)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[key]

# Application Mode
NODE_ENV=development
```

**Security:**
- Never commit `.env` to Git
- Provide `.env.example` with placeholder values
- Document required vs optional variables

---

## Testing Conventions

### Test File Location
- Place tests next to source: `server/scanner.test.js`
- Or in dedicated `test/` directory

### Test Structure (Node.js test runner)
```javascript
import { test } from 'node:test';
import assert from 'node:assert';

test('scanner handles missing alt text', async () => {
  const result = await scanFixture('missing-alt.html');
  assert.strictEqual(result.violations.length, 1);
  assert.strictEqual(result.violations[0].id, 'image-alt');
});
```

---

## Documentation Standards

### Code Comments

**When to comment:**
- Complex algorithms
- Non-obvious business logic
- Security-critical sections
- Workarounds for external bugs

**When NOT to comment:**
- Self-explanatory code
- Obvious variable names
- Standard patterns

**JSDoc for exported functions:**
```javascript
/**
 * Scans a URL for WCAG 2.2 AA violations using Puppeteer and axe-core.
 * 
 * @param {string} targetUrl - Public HTTP(S) URL to scan
 * @param {Object} options - Scan options
 * @param {number} options.timeoutMs - Maximum scan duration
 * @param {AbortSignal} options.signal - Cancellation signal
 * @returns {Promise<ScanResult>} Audit results with violations
 * @throws {TargetUrlError} If URL is invalid or private
 */
export async function scanUrl(targetUrl, options) {
  // ...
}
```

### Markdown Documentation

**Headers:**
```markdown
# Title (H1) - One per document
## Section (H2) - Main sections
### Subsection (H3) - Details
```

**Code blocks:**
````markdown
```javascript
const example = 'syntax highlighted';
```
````

---

## Accessibility Standards (Self-Imposed)

Since AccessLens audits accessibility, the app itself must be accessible:

### Keyboard Navigation
- All interactive elements reachable via Tab
- Logical focus order
- Visible focus indicators
- No keyboard traps

### ARIA Usage
- `aria-label` on icon-only buttons
- `aria-live` for dynamic announcements
- `role="alert"` for errors
- `aria-describedby` for form help text

### Semantic HTML
- `<header>`, `<nav>`, `<main>`, `<footer>` landmarks
- Heading hierarchy (single h1, no skipped levels)
- `<button>` for actions, `<a>` for navigation
- Form labels with `<label for="...">` or `aria-labelledby`

---

## Performance Guidelines

### Frontend
- Lazy load routes (if implemented)
- Debounce input validation
- Virtual scrolling for long lists (future)
- Optimize images and assets

### Backend
- Stream large responses (future)
- Database query optimization (indexes)
- Connection pooling (Supabase handles)
- Cache static reports (future)

---

## Security Guidelines

### Input Validation
- Validate all user input server-side
- Sanitize HTML before rendering
- Use parameterized database queries
- Validate environment variables on startup

### Secrets Management
- Never log secrets
- Never commit secrets to Git
- Use environment variables
- Rotate keys regularly

---

## Future Structure Considerations

If the project scales:

### Microservices Split
```
frontend/          # React app
scanner-service/   # Puppeteer worker
api-gateway/       # Express API
database/          # Supabase config
```

### Monorepo Structure
```
packages/
  ├── web/         # Frontend
  ├── api/         # Backend
  ├── scanner/     # Scanner engine
  └── types/       # Shared TypeScript types
```

---

## Coding Best Practices

1. **DRY (Don't Repeat Yourself)**: Extract common logic into functions
2. **KISS (Keep It Simple)**: Prefer simple, readable code over clever code
3. **YAGNI (You Aren't Gonna Need It)**: Don't add features speculatively
4. **Single Responsibility**: Each function/module does one thing well
5. **Explicit over Implicit**: Be clear about types, parameters, return values

---

## References

- **React Docs**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Express Guide**: https://expressjs.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
