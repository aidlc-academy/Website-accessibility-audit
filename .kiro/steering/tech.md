# AccessLens - Technical Documentation

> **Note**: This document describes the technical architecture of an existing, implemented application. AccessLens was developed prior to Kiro adoption and is now maintained using Kiro IDE.

---

## Technology Stack

### Frontend
- **React 18.3.1**: UI framework with hooks and TypeScript
- **TypeScript 5.6.3**: Type-safe JavaScript development
- **Vite 5.4.10**: Lightning-fast dev server and build tool
- **Tailwind CSS**: Utility-first styling (CDN configuration in index.html)
- **Three.js 0.160.0**: Optional 3D background effects

### Backend
- **Node.js 22.12+**: JavaScript runtime (minimum required version)
- **Express 5.3.0**: Web server and API framework
- **Puppeteer 25.13.0**: Headless Chrome browser automation
- **@axe-core/puppeteer 4.13.0**: WCAG accessibility testing engine
- **axe-core 4.14.0**: Core accessibility rules library

### Database & Storage
- **Supabase PostgreSQL**: Cloud-hosted relational database
- **JSONB**: Flexible storage for audit data and issues
- **Row-Level Security (RLS)**: Backend-only database access

### Authentication
- **JWT (jsonwebtoken 9.0.3)**: Token-based authentication
- **bcrypt 6.0.0**: Password hashing
- **File-based user storage**: Simple local user management

### Development Tools
- **npm**: Package management
- **Git**: Version control
- **PowerShell**: Windows scripting environment

---

## System Architecture

### Application Layers

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  React Components (src/components/)                      │
│  • Views: Dashboard, Scan Progress, Audit Studio        │
│  • Layout: Header, Sidebar                              │
│  • Common: Modals, Announcements, Skip Links            │
└─────────────────────────────────────────────────────────┘
                         ↓ API Client
┌─────────────────────────────────────────────────────────┐
│                    API/SERVICE LAYER                     │
│  Express Routes (server/index.js)                        │
│  • POST /api/audits - Initiate scan                     │
│  • GET /api/audits - List saved audits                  │
│  • GET /api/audits/:id - Retrieve full audit            │
│  • GET /api/audits/:id/report - Download Markdown       │
│  • GET /api/audits/:id/export.csv - Download CSV        │
│  • POST /api/auth/* - Authentication endpoints          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                  │
│  Core Modules (server/)                                  │
│  • scanner.js - Puppeteer + axe-core orchestration      │
│  • security.js - URL validation, SSRF protection        │
│  • storage.js - Supabase integration wrapper            │
│  • reporter.js - Markdown/CSV generation                │
│  • comparison.js - Audit diff/comparison engine         │
│  • simpleAuth.js - JWT authentication logic             │
│  • proxy.js - Request filtering proxy                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                     │
│  Supabase Client (server/supabaseStorage.js)            │
│  • listAuditsFromSupabase()                             │
│  • findAuditInSupabase(id)                              │
│  • saveAuditToSupabase(audit)                           │
│  Database transforms: camelCase ↔ snake_case            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                     │
│  Supabase PostgreSQL                                     │
│  • audits table (JSONB, indexes, RLS policies)          │
│  • Row-level security: service-role only                │
└─────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### 1. SSRF (Server-Side Request Forgery) Protection

**Multiple Defense Layers:**

#### Layer 1: URL Validation (`security.js`)
```javascript
// Blocks:
- Non-HTTP/HTTPS protocols (ftp://, file://, etc.)
- Embedded credentials (user:pass@host)
- Non-standard ports (except 80, 443)
- Reserved/local domains (.local, .internal, .test, etc.)
```

#### Layer 2: DNS Resolution Check
```javascript
// Before browser navigation:
- Resolves hostname to IP addresses
- Validates all IPs are public (not private ranges)
- Blocks: 10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x
- 5-second timeout on DNS lookup
```

#### Layer 3: Runtime Request Filtering (`proxy.js`)
```javascript
// During browser execution:
- Local proxy intercepts ALL HTTP(S) requests
- Validates every destination (including redirects)
- Blocks subresource requests to private IPs
- Aborts navigation if rules violated
```

**Threat Mitigation:**
- ✅ Prevents access to cloud metadata endpoints (169.254.169.254)
- ✅ Blocks internal network scanning
- ✅ Prevents localhost/loopback access
- ✅ Stops SSRF via redirects

### 2. Rate Limiting

**Implementation:**
```javascript
const scanRateLimits = new Map(); // IP -> { count, resetTime }
const MAX_SCANS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
```

**Behavior:**
- Tracks scans per IP address
- 10 scans per IP per rolling 1-hour window
- Returns 429 error with reset time after limit
- Prevents resource exhaustion attacks

### 3. Database Security

**Supabase Configuration:**
- Row-Level Security (RLS) enabled on `audits` table
- Anonymous users: Explicitly denied all access
- Authenticated users: Explicitly denied all access
- Backend uses `service_role` key (bypasses RLS)
- Service role key: Never exposed to browser

**Environment Separation:**
```javascript
// Backend only - never in browser:
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[long-key]
```

### 4. Authentication

**JWT Flow:**
1. User registers/logs in → POST /api/auth/login
2. Backend verifies credentials (bcrypt hash comparison)
3. JWT token generated with user ID + 24h expiration
4. Token sent to client (HttpOnly cookie recommended in production)
5. Protected routes verify token with `authenticateToken` middleware

**Password Storage:**
- bcrypt with automatic salt generation
- Password never stored in plaintext
- Minimum complexity enforced client-side

---

## Data Flow: Scan Execution

### Step-by-Step Process

```
1. USER INITIATES SCAN
   ↓
   Frontend: POST /api/audits { url: "https://example.com" }
   
2. RATE LIMIT CHECK
   ↓
   server/index.js: checkRateLimit(clientIp)
   → Allow if < 10/hour, else 429 error
   
3. SECURITY VALIDATION
   ↓
   security.js: assertPublicHttpUrl(url)
   → Validate protocol, hostname, DNS resolution
   → Reject if private/reserved IP detected
   
4. PROXY LAUNCH
   ↓
   proxy.js: createScanningProxy()
   → Start local HTTP proxy on random port
   → Proxy intercepts all browser requests
   
5. BROWSER LAUNCH
   ↓
   scanner.js: puppeteer.launch({
     args: [
       '--proxy-server=127.0.0.1:[proxy-port]',
       '--disable-dev-shm-usage',
       '--force-webrtc-ip-handling-policy=...'
     ]
   })
   
6. PAGE NAVIGATION
   ↓
   page.goto(url, { waitUntil: 'domcontentloaded' })
   → All requests validated through proxy
   → Abort if redirect to private destination
   
7. AXE-CORE SCAN
   ↓
   new AxePuppeteer(page)
     .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
     .analyze()
   → Returns { violations, passes, incomplete }
   
8. RESULTS PROCESSING
   ↓
   scanner.js: issuesFromViolations(violations)
   → Map to AccessLens issue format
   → Add WCAG criterion, severity, fix suggestions
   → Calculate accessibility score
   
9. REPORT GENERATION
   ↓
   reporter.js: saveReport(audit)
   → Generate Markdown file in reports/
   → Filename: audit-[hostname]-[date]-[id].md
   
10. DATABASE SAVE
   ↓
   storage.js → supabaseStorage.js
   → Transform camelCase to snake_case
   → INSERT INTO audits (id, url, issues, ...)
   
11. RESPONSE TO CLIENT
   ↓
   { audit: { id, url, issues, stats, ... } }
   → Frontend displays results
   
12. CLEANUP
   ↓
   browser.close(), proxy.close()
```

---

## Database Schema

### `audits` Table (Supabase PostgreSQL)

```sql
CREATE TABLE public.audits (
  -- Identifiers
  id UUID PRIMARY KEY,
  
  -- Scan metadata
  success BOOLEAN NOT NULL DEFAULT true,
  url TEXT NOT NULL,
  page_title TEXT,
  page_load_error TEXT,
  scanned_at TIMESTAMPTZ NOT NULL,
  
  -- Scanner configuration
  axe_version TEXT NOT NULL,
  scan_configuration JSONB NOT NULL,
  
  -- Results
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  passed_rules INTEGER NOT NULL DEFAULT 0,
  incomplete_rules INTEGER NOT NULL DEFAULT 0,
  violation_count INTEGER NOT NULL DEFAULT 0,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status & standards
  status TEXT NOT NULL DEFAULT 'completed',
  standard TEXT NOT NULL,
  viewport TEXT NOT NULL,
  manual_review_required BOOLEAN NOT NULL DEFAULT true,
  
  -- Report & comparison
  report_filename TEXT,
  compare_to_audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
  
  -- Authentication
  user_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `idx_audits_scanned_at` on `scanned_at DESC`
- `idx_audits_url` on `url`
- `idx_audits_status` on `status`
- `idx_audits_compare_to` on `compare_to_audit_id` (where not null)

---

## Configuration

### Environment Variables

**Required:**
```env
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

**Optional:**
```env
PORT=5173                    # Server port (default: 5173)
HOST=127.0.0.1              # Bind address (default: 127.0.0.1)
SCAN_TIMEOUT_MS=60000       # Scan timeout (default: 60000, range: 5000-120000)
PUPPETEER_EXECUTABLE_PATH=  # Custom Chrome/Edge path (auto-detected if empty)
NODE_ENV=production         # Environment mode
```

### Build Configuration

**TypeScript (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

**Vite (`vite.config.ts`):**
```typescript
export default defineConfig({
  plugins: [react()],
  server: { middlewareMode: true }, // Integrated with Express
  build: { outDir: 'dist' }
});
```

---

## Deployment Patterns

### Development Mode
```bash
npm run dev
```
- Vite dev server integrated with Express
- Hot module replacement (HMR)
- Source maps enabled
- Runs on http://localhost:5173

### Production Build
```bash
npm run build  # TypeScript compile + Vite build
npm start      # Serve dist/ + API
```
- Static assets in `dist/`
- Express serves both frontend and API
- No HMR, optimized bundles

---

## Performance Considerations

### Scan Performance
- **Typical scan time**: 5-15 seconds
- **Timeout limit**: 60 seconds (configurable)
- **Bottlenecks**: 
  - Page load time (varies by target)
  - axe-core analysis (depends on DOM size)
  - Network latency

### Database Performance
- **JSONB storage**: Flexible but can be large
- **Indexes**: Optimize common queries (scanned_at, url, status)
- **Connection pooling**: Supabase handles automatically

### Rate Limiting Impact
- Prevents DoS attacks
- 10 scans/hour typically sufficient for manual testing
- Consider increasing for CI/CD integration

---

## Error Handling Patterns

### Frontend
```typescript
try {
  const audit = await runAudit(url, signal);
  setScanState({ status: 'success', findingCount: audit.issues.length });
} catch (error) {
  if (signal.aborted) return; // User cancelled
  setScanState({ 
    status: 'error', 
    message: error instanceof Error ? error.message : 'Scan failed' 
  });
}
```

### Backend
```javascript
app.use('/api', (error, request, response, next) => {
  console.error('API request failed:', error);
  response.status(500).json({ 
    error: 'The audit service could not complete the request.' 
  });
});
```

**Error Categories:**
- `400 Bad Request`: Invalid URL, malformed input
- `429 Too Many Requests`: Rate limit exceeded
- `502 Bad Gateway`: Target site unreachable, SSRF blocked
- `504 Gateway Timeout`: Scan exceeded time limit

---

## Testing Strategy

### Current Test Coverage
- **Unit tests**: Node.js test runner (`npm test`)
- **Fixture testing**: Local HTML pages for controlled scenarios
- **Integration tests**: Scanner, comparison, report generation

### Manual Testing Required
- End-to-end scan workflows
- Security validation (SSRF prevention)
- Rate limiting enforcement
- Report export formats
- UI responsiveness
- Keyboard accessibility

---

## Dependencies & Licenses

See `package.json` for complete dependency list. Key dependencies:

- **React, Express, Puppeteer**: Open source (MIT, Apache-2.0)
- **axe-core**: MPL 2.0 (Mozilla Public License)
- **Supabase**: MIT License
- **All dependencies**: Compatible with commercial use

---

## Monitoring & Logging

### Current Logging
```javascript
console.log('✓ Supabase storage configured');
console.error('API request failed:', error);
console.warn('Could not validate browser request');
```

### Production Recommendations
- Structured logging (JSON format)
- Error tracking service (e.g., Sentry)
- Performance monitoring (scan duration, error rates)
- Database query performance

---

## Security Audit Checklist

✅ **Implemented:**
- SSRF protection (multi-layer)
- Rate limiting
- Input validation
- Database RLS
- JWT authentication
- Password hashing
- Environment variable separation

⚠️ **Production Hardening:**
- [ ] HTTPS enforcement (TLS certificates)
- [ ] CORS configuration
- [ ] CSP headers
- [ ] HttpOnly cookies for JWT
- [ ] Helmet.js security headers
- [ ] Regular dependency updates
- [ ] Penetration testing

---

## Development Workflow

1. **Local setup**: `npm install`, configure `.env`
2. **Development**: `npm run dev` (Vite + Express integrated)
3. **Testing**: `npm test` (Node.js test runner)
4. **Build**: `npm run build` (TypeScript + Vite)
5. **Production**: `npm start` (Serve built files)

---

## Troubleshooting

### Common Issues

**"Puppeteer browser not found"**
```bash
npx puppeteer browsers install chrome
```

**"Port 5173 already in use"**
- Change `PORT=5174` in `.env`
- Or stop other Vite servers

**"Supabase connection failed"**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase project is active
- Run migrations in Supabase SQL Editor

**"The audit could not be completed"**
- Check URL is public (not localhost/VPN)
- Verify site allows automated access
- Check rate limit not exceeded

---

## Architecture Decisions

### Why Supabase?
- PostgreSQL reliability with cloud hosting
- Built-in row-level security
- No server management overhead
- Free tier sufficient for development/education

### Why Puppeteer + axe-core?
- Industry-standard accessibility testing
- Renders JavaScript-heavy sites
- WCAG 2.2 support
- Extensible rule engine

### Why Express + Vite Integration?
- Single server for development
- Simplified deployment
- API and frontend on same origin (no CORS complexity)

### Why File-Based Authentication?
- Simple for single-user/demo scenarios
- No external auth service dependency
- Easy to upgrade to Supabase Auth later

---

## Future Technical Considerations

**Scalability:**
- Horizontal scaling: Multiple Express instances with load balancer
- Database: Connection pooling, read replicas
- Caching: Redis for scan history summaries

**Performance:**
- Background job queue for scans
- WebSocket progress updates
- Incremental scan results streaming

**Security:**
- OAuth integration (Google, GitHub)
- API keys for programmatic access
- Webhook notifications for completed scans
