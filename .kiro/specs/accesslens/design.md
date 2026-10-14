# AccessLens - Design Documentation

> **Note**: This document describes design decisions of an existing, implemented application. AccessLens was developed prior to Kiro adoption. This documents the as-built architecture, not a historical design process.

---

## System Design Overview

AccessLens is a three-tier web application:
- **Presentation**: React SPA with TypeScript
- **Application**: Express REST API
- **Data**: Supabase PostgreSQL

---

## Architecture Decisions

### AD-001: React + TypeScript Frontend

**Decision**: Use React 18 with TypeScript for the frontend

**Rationale**:
- Strong typing reduces runtime errors
- React ecosystem mature and well-documented
- Component-based architecture promotes reusability
- Vite provides fast development experience

**Alternatives Considered**:
- Vue.js: Less TypeScript integration
- Plain JavaScript: No type safety
- Angular: Too heavy for this use case

**Status**: ✅ Implemented

---

### AD-002: Express Backend (Not Next.js)

**Decision**: Separate Express backend instead of Next.js API routes

**Rationale**:
- Long-running Puppeteer scans better suited to dedicated server
- More control over request lifecycle and timeouts
- Simpler WebSocket integration if needed later
- Easier to scale backend independently

**Trade-offs**:
- More complex deployment (2 processes vs 1)
- Must handle CORS if deployed separately
- No server-side rendering (not needed)

**Status**: ✅ Implemented

---

### AD-003: Puppeteer Over Playwright

**Decision**: Use Puppeteer for browser automation

**Rationale**:
- Maintained by Chrome team
- Excellent axe-core integration via @axe-core/puppeteer
- Smaller footprint than Playwright
- Sufficient for Chrome-only testing

**Alternatives Considered**:
- Playwright: Multi-browser but overkill
- Selenium: Too heavyweight
- JSDOM: Cannot execute JavaScript like real browser

**Status**: ✅ Implemented

---

### AD-004: Supabase Over Self-Hosted PostgreSQL

**Decision**: Use Supabase managed PostgreSQL

**Rationale**:
- No database server management
- Built-in row-level security
- Free tier sufficient for development/education
- Easy migration to self-hosted later if needed

**Trade-offs**:
- External dependency
- Network latency for queries
- Requires internet connection

**Status**: ✅ Implemented, working

---

### AD-005: JSONB Storage for Issues

**Decision**: Store audit issues as JSONB array in single column

**Rationale**:
- Flexible schema (axe-core output varies)
- Fast to insert entire audit in one transaction
- No normalization overhead for read-heavy workload
- PostgreSQL JSONB is queryable if needed

**Alternatives Considered**:
- Separate `issues` table: More normalized but slower writes
- MongoDB: No need for document database features

**Status**: ✅ Implemented

---

### AD-006: Multi-Layer SSRF Protection

**Decision**: Three-layer defense against SSRF

**Layers**:
1. URL validation (protocol, hostname, port)
2. DNS resolution check (reject private IPs)
3. Runtime proxy filtering (block redirects to private networks)

**Rationale**:
- Defense in depth
- Each layer catches different attack vectors
- DNS resolution prevents hostname-to-IP bypasses
- Proxy stops redirects and subresource attacks

**Status**: ✅ Implemented in `security.js` and `proxy.js`

---

### AD-007: File-Based Authentication

**Decision**: Simple JWT + file-based user storage

**Rationale**:
- No external auth service dependency
- Sufficient for single-user/educational use
- Easy to upgrade to Supabase Auth later
- Keeps backend stateless (JWT)

**Trade-offs**:
- Not suitable for production multi-user
- File I/O on every auth operation
- No password reset flow

**Status**: ✅ Implemented, adequate for scope

---

### AD-008: In-Memory Rate Limiting

**Decision**: Store rate limits in Map() in server process

**Rationale**:
- Simple implementation
- No external Redis dependency
- Resets on server restart (acceptable)
- Sufficient for single-server deployment

**Trade-offs**:
- Doesn't scale horizontally
- Lost on server restart
- No persistence across deploys

**Future**: Migrate to Redis for production

**Status**: ✅ Implemented, known limitation

---

### AD-009: Markdown + CSV Report Formats

**Decision**: Generate Markdown and CSV, not HTML or PDF

**Rationale**:
- Markdown: Human-readable, version-controllable, easily shareable
- CSV: Import into Excel/Google Sheets for analysis
- PDF: Use browser print (no backend PDF generation needed)

**Alternatives Considered**:
- HTML: Security risk (XSS), requires sanitization
- PDF backend generation: Heavy dependencies (Puppeteer again)

**Status**: ✅ Implemented

---

### AD-010: 6-Stage Progress Visualization

**Decision**: Display granular progress stages during scan

**Rationale**:
- Builds user trust (not a black box)
- Educates about accessibility testing process
- Better UX than spinner or generic "loading"

**Stages**:
1. Validating URL (security checks)
2. Connecting to target (network)
3. Loading page (browser navigation)
4. Inspecting elements (DOM ready)
5. Analyzing issues (axe-core execution)
6. Generating report (processing results)

**Status**: ✅ Implemented with animations

---

## Data Model Design

### Audit Entity

```typescript
interface Audit {
  // Identity
  id: UUID
  
  // Target
  url: string
  pageTitle: string
  
  // Results
  issues: Issue[]              // JSONB array
  stats: {
    critical: number
    serious: number
    moderate: number
    minor: number
    total: number
    score: number              // 0-100
  }
  
  // Metadata
  scannedAt: ISO8601
  axeVersion: string
  scanConfiguration: JSONB
  
  // Status
  status: 'completed' | 'failed'
  pageLoadError?: string
  
  // Comparison
  compareToAuditId?: UUID      // Baseline for rescans
  
  // Authentication
  userId?: UUID
}
```

### Issue Entity (nested in Audit)

```typescript
interface Issue {
  id: string                   // Composite: ruleId-index
  title: string
  severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor'
  category: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust'
  wcag: string                 // e.g. "WCAG 2.2 SC 1.4.3"
  selector: string             // CSS selector
  element: string              // HTML snippet
  impactedUsers: string
  remediation: string          // Fix suggestion
  helpUrl: string              // axe-core docs
  fixed: boolean               // Manual mark as fixed (future)
}
```

---

## API Design

### RESTful Principles

- Resources as nouns: `/audits`, `/reports`
- HTTP methods for actions: GET (read), POST (create)
- Status codes: 200 (OK), 201 (Created), 400 (Bad Request), 429 (Rate Limit), 502 (Bad Gateway)
- JSON request/response bodies

### Authentication Flow

```
1. POST /api/auth/register { email, password, fullName }
   → 201 { user: { id, email, fullName } }

2. POST /api/auth/login { email, password }
   → 200 { user: {...}, token: "jwt..." }

3. All protected routes: Authorization: Bearer <token>
```

### Scan Flow

```
1. POST /api/audits { url: "https://example.com" }
   → Rate limit check
   → Security validation
   → Puppeteer scan
   → Save to Supabase
   → 201 { audit: {...} }

2. GET /api/audits/:id
   → 200 { audit: {...} }
```

---

## Security Design

### Threat Model

**Threats Mitigated**:
- ✅ SSRF (server-side request forgery)
- ✅ DoS (denial of service via unlimited scans)
- ✅ SQL injection (parameterized queries)
- ✅ XSS (React auto-escaping)
- ✅ Credential theft (bcrypt hashing)

**Threats Not Addressed**:
- ⚠️ DDoS (no WAF, CDN)
- ⚠️ Account enumeration (timing attacks)
- ⚠️ Session fixation (no session management)

### Security Layers

```
Internet → [Rate Limiting] → [Auth Middleware] → [URL Validation] → [DNS Check] → [Proxy Filter] → Target Website
```

---

## Performance Design

### Optimization Strategies

1. **Database Indexes**: On `scanned_at`, `url`, `status` for fast queries
2. **JSONB Storage**: Single write transaction per audit
3. **Frontend Code Splitting**: Lazy load routes (not yet implemented)
4. **Asset Optimization**: Vite minification and tree-shaking

### Bottlenecks Identified

- **Puppeteer launch time**: 2-3 seconds (unavoidable)
- **Target site load time**: Variable (user cannot control)
- **axe-core analysis**: Scales with DOM size

---

## Scalability Design

### Current Limitations (Single-Server)

- In-memory rate limiting doesn't scale horizontally
- Synchronous scan processing
- No job queue for background work

### Future Scaling Approach

```
┌─────────────┐
│ Load        │
│ Balancer    │
└──────┬──────┘
       │
   ┌───┴───┬───────┬───────┐
   │       │       │       │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│API  │ │API  │ │API  │ │API  │
│Node1│ │Node2│ │Node3│ │Node4│
└──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
   │       │       │       │
   └───┬───┴───────┴───────┘
       │
   ┌───▼────────┐
   │   Redis    │  Rate limits, sessions
   └───┬────────┘
       │
   ┌───▼────────┐
   │ Job Queue  │  Background scans
   └───┬────────┘
       │
   ┌───▼────────┐
   │ Supabase   │  Persistent storage
   └────────────┘
```

---

## UI/UX Design Principles

### Accessibility First

- WCAG 2.2 AA compliant interface
- Keyboard-only navigation
- Screen reader compatible
- High contrast mode support

### Progressive Disclosure

- Dashboard → Scan → Results → Details
- Start simple, reveal complexity on demand
- Clear navigation path

### Visual Hierarchy

- Primary action: Large, colorful "Run accessibility audit" button
- Secondary actions: Smaller, neutral buttons
- Destructive actions: Red, requires confirmation

---

## Testing Strategy

### Test Pyramid

```
      /\
     /  \    E2E (Manual)
    /----\   Integration (npm test)
   /------\  Unit (inline tests in scanner.js)
  /--------\
```

### Current Coverage

- **Unit tests**: Scanner logic (fixture-based)
- **Integration tests**: Comparison engine
- **Manual tests**: Full workflow, UI, accessibility

### Not Tested

- Security validations (manual only)
- Rate limiting enforcement
- Error recovery paths

---

## Deployment Design

### Development (Current)

```
npm run dev → Vite dev + Express on :5173
```

### Production (Planned)

```
npm run build → dist/
npm start → Express serves dist/ + API
```

### Environment Variables

- Development: `.env` file
- Production: Environment-specific configs (AWS, Heroku, etc.)

---

## Design Patterns Used

1. **Repository Pattern**: `storage.js` abstracts Supabase
2. **Factory Pattern**: Report generation (MD/CSV)
3. **Strategy Pattern**: Multiple SSRF defense layers
4. **Observer Pattern**: React state management
5. **Middleware Pattern**: Express auth and error handling

---

## Design Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| TypeScript | Type safety | Longer compile time |
| Supabase | No DB management | External dependency |
| File-based auth | Simple | Not scalable |
| In-memory rate limit | Fast | Doesn't scale |
| JSONB storage | Flexible | Less normalized |
| Puppeteer | Real browser | Resource heavy |

---

## References

- **React Patterns**: https://react.dev/learn/thinking-in-react
- **REST API Design**: https://restfulapi.net/
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/current/datatype-json.html
- **OWASP Security**: https://owasp.org/www-project-web-security-testing-guide/
