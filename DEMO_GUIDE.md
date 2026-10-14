# AccessLens - Complete Demo Guide

## 🎯 **Project Overview**

**AccessLens** is a professional website accessibility audit tool that performs automated WCAG 2.2 Level AA compliance checks using axe-core and Puppeteer. It provides comprehensive accessibility reports with actionable remediation guidance.

---

## ✨ **Key Features**

### ✅ **Real Automated Scanning**
- **axe-core** WCAG 2.2 A/AA rule engine
- **Puppeteer** headless browser automation
- Real-time progress tracking with 6-stage visual feedback
- Security-hardened URL validation (blocks private IPs, SSRF protection)
- Rate limiting (10 scans per hour per IP)

### ✅ **Professional Dashboard**
- Live statistics (total scans, average score, issue counts)
- Recent audit history with quick access
- Severity breakdown (Critical, Serious, Moderate, Minor)
- Accessibility score calculation

### ✅ **Comprehensive Reports**
- Detailed violation descriptions
- Affected HTML elements with selectors
- WCAG 2.2 success criterion mapping
- POUR principle categorization
- Impacted user groups
- Fix suggestions with before/after examples
- Export to Markdown and CSV

### ✅ **Comparison & History**
- Scan history with Supabase cloud storage
- Compare rescans to identify fixed/new issues
- Persistent audit storage
- Report generation and archiving

### ✅ **Accessibility-First Design**
- WCAG 2.2 AA compliant interface
- Keyboard navigation support
- Screen reader optimized
- Skip links, live announcements
- Responsive design (mobile to desktop)

---

## 🚀 **Quick Start Demo (3 Minutes)**

### **Step 1: Start the Application**

```powershell
cd "C:\Users\mukesh rs\OneDrive\Desktop\website accesibility audit"
npm run dev
```

Open **http://localhost:5173** in your browser.

### **Step 2: Run Your First Scan**

1. **On the Dashboard**: You'll see the hero section with project overview and quick stats
2. **Click "Run Demo"** button (top-right of the URL input) - this automatically scans `example.com`
3. **OR Enter a URL manually**: Try `https://www.w3.org/` or any public HTTPS website

### **Step 3: Watch Real-Time Progress**

The scan progresses through 6 stages with live visual feedback:
- ✅ Validating URL
- ✅ Connecting to target
- ✅ Loading page
- ✅ Inspecting elements
- ✅ Analyzing issues
- ✅ Generating report

### **Step 4: Review Results**

Once complete:
- **View Findings** - See all detected accessibility violations
- **Severity Classification** - Critical, Serious, Moderate, Minor
- **WCAG Mapping** - Each issue links to relevant WCAG 2.2 success criteria
- **Fix Suggestions** - Before/after HTML examples
- **Affected Elements** - CSS selectors and HTML snippets

### **Step 5: Generate Reports**

- **Download Markdown Report** - Full detailed audit document
- **Export CSV** - Spreadsheet format for tracking
- **Print/Save PDF** - Professional report via browser print

### **Step 6: Explore History**

- Navigate to **Scan History** (left sidebar)
- View all previous scans
- Click any audit to reopen its full report
- **Rescan** to compare changes

---

## 🎓 **Complete Feature Tour**

### **1. Overview Dashboard**
- **Hero Section**: Project description and key metrics
- **Quick Stats Cards**: 
  - Websites Scanned
  - Average Accessibility Score
  - Total Issues Found
  - Critical Issues
- **Recent Audits**: Last 4 scans with quick open access
- **"Run Demo" Button**: Instant example scan

### **2. Scan Progress View**
- **Real-Time Stages**: 6-step visual progress indicator
- **Dynamic Status**: Each stage shows pending → active → complete → error
- **Progress Bar**: Animated percentage completion
- **What This Checks**: Sidebar explaining automated vs manual testing
- **Cancel Option**: Abort scan at any time

### **3. Audit Studio**
- **Findings List**: All violations grouped by severity
- **Filter Options**: By severity (Critical, Serious, Moderate, Minor)
- **Issue Details**:
  - Title and description
  - WCAG 2.2 success criterion reference
  - Impacted user groups
  - Affected HTML element with selector
  - Why it matters explanation
  - Fix suggestion with code examples
  - Help URL to axe-core documentation
- **Fix Workspace**: Navigate to detailed remediation view

### **4. Fix Workspace**
- **Before/After Code**: Side-by-side HTML comparison
- **Fix Description**: Clear explanation of the correction
- **Element Context**: Full selector and markup
- **Back to Studio**: Quick navigation

### **5. Scan History**
- **All Audits**: Complete list of saved scans
- **Search/Filter**: Find specific audits
- **Rescan**: Run fresh scan for comparison
- **Open Findings**: View full results
- **Delete**: Remove old audits

### **6. Reports View**
- **Report Library**: All generated audit reports
- **Download Options**:
  - Markdown (.md) - Full narrative report
  - CSV (.csv) - Spreadsheet with all violations
  - PDF (via browser print)
- **Report Metadata**: Date, URL, issue count

---

## 🔒 **Security Features**

### **URL Validation**
- ✅ Only HTTP/HTTPS protocols allowed
- ✅ Blocks private IP ranges (10.x, 192.168.x, 127.x, etc.)
- ✅ Blocks reserved domains (.local, .internal, etc.)
- ✅ Blocks non-standard ports
- ✅ Validates DNS resolution

### **SSRF Protection**
- ✅ Proxy-based request interception
- ✅ Runtime destination checking
- ✅ Redirect validation
- ✅ Subresource request filtering

### **Rate Limiting**
- ✅ 10 scans per IP per hour
- ✅ Automatic reset after 1 hour
- ✅ Prevents abuse and resource exhaustion

### **Data Security**
- ✅ Service-role only Supabase access (backend)
- ✅ Row-level security enabled
- ✅ No credentials in browser
- ✅ Secure authentication with JWT

---

## 📊 **What Gets Tested**

### **Automated Checks (via axe-core)**
✅ **Images** - Alternative text presence and quality  
✅ **Forms** - Labels, accessible names, error identification  
✅ **Buttons** - Accessible names and roles  
✅ **Links** - Meaningful link text  
✅ **Color Contrast** - WCAG 2.2 AA ratios (4.5:1, 3:1)  
✅ **Headings** - Proper hierarchy (h1-h6)  
✅ **Document Language** - lang attribute  
✅ **Page Title** - Descriptive titles  
✅ **ARIA** - Attributes, roles, states  
✅ **Target Size** - Minimum touch target dimensions  
✅ **Focus Visible** - Visible focus indicators  

### **Manual Testing Still Required** ⚠️
❌ Keyboard-only navigation  
❌ Screen reader compatibility  
❌ Meaningful alternative text (subjective)  
❌ Focus order and management  
❌ Context-dependent requirements  
❌ Live captions and audio descriptions  

**Important**: A score of 100 from automated checks **does NOT** mean the site is fully accessible. Manual testing is essential.

---

## 🛠️ **Technical Stack**

### **Frontend**
- **React 18** + **TypeScript** - Modern UI framework
- **Vite** - Lightning-fast dev server
- **Tailwind CSS** - Utility-first styling
- **Three.js** - Optional 3D background effects

### **Backend**
- **Node.js 22+** - JavaScript runtime
- **Express 5** - Web server
- **Puppeteer 25** - Headless Chrome automation
- **axe-core 4.14** - Accessibility testing engine

### **Database**
- **Supabase PostgreSQL** - Cloud-hosted database
- **Row-level security** - Backend-only access
- **JSONB storage** - Flexible audit data structure

### **Authentication**
- **JWT tokens** - Secure session management
- **bcrypt** - Password hashing
- **Local user storage** - File-based auth

---

## 📁 **Project Structure**

```
website-accessibility-audit/
├── src/                        # React frontend
│   ├── components/
│   │   ├── views/             # Main page views
│   │   ├── layout/            # Header, Sidebar
│   │   └── common/            # Reusable components
│   ├── services/              # API client
│   ├── types/                 # TypeScript definitions
│   └── main.tsx               # App entry point
├── server/                     # Express backend
│   ├── index.js               # API routes
│   ├── scanner.js             # Puppeteer + axe-core
│   ├── security.js            # URL validation
│   ├── storage.js             # Supabase integration
│   ├── reporter.js            # Report generation
│   ├── comparison.js          # Audit comparison
│   ├── simpleAuth.js          # Authentication
│   └── proxy.js               # SSRF protection proxy
├── migrations/                 # Database schema
├── reports/                    # Generated reports
├── data/                       # Local storage
└── README.md                   # Setup instructions
```

---

## 🎬 **Demo Scenarios**

### **Scenario 1: First-Time User**
1. Open app → See empty dashboard
2. Click "Run Demo" → Scans example.com automatically
3. Watch progress stages
4. Review findings in Audit Studio
5. Download Markdown report

### **Scenario 2: Testing Your Own Website**
1. Enter your website URL
2. Click "Run accessibility audit"
3. Review violations
4. Navigate to Fix Workspace for a critical issue
5. See before/after fix examples
6. Export CSV for tracking

### **Scenario 3: Comparing Fixes**
1. Open an existing audit from History
2. Click "Rescan this URL"
3. View comparison results:
   - ✅ Resolved issues (green)
   - 🆕 New issues (yellow)
   - ⚠️ Remaining issues (red)

### **Scenario 4: College Project Presentation**
1. **Intro**: Explain accessibility importance (2 min)
2. **Live Demo**: Run scan on a popular website (2 min)
3. **Results Walkthrough**: Show violations and fixes (3 min)
4. **Export Report**: Download PDF (1 min)
5. **Q&A**: Handle questions (2 min)
**Total: 10 minutes**

---

## 🐛 **Troubleshooting**

### **"The audit could not be completed"**
- ✅ Check if the URL is public (not localhost, intranet, VPN)
- ✅ Verify the site allows automated access (no bot blocking)
- ✅ Ensure you haven't exceeded rate limit (10/hour)

### **Puppeteer browser not found**
```powershell
npx puppeteer browsers install chrome
```

### **Port 5173 already in use**
- Stop other dev servers
- OR change `PORT=5174` in `.env`

### **Supabase connection failed**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check Supabase project is active
- Run migrations: `migrations/001_initial_schema.sql`

---

## 📚 **Additional Resources**

- **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **axe-core Rules**: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- **Supabase Docs**: https://supabase.com/docs
- **Puppeteer Docs**: https://pptr.dev/

---

## 📝 **Limitations & Future Work**

### **Current Limitations**
- ⚠️ Cannot scan authenticated pages (login required)
- ⚠️ Cannot scan localhost/private sites
- ⚠️ Rate limited to 10 scans/hour per IP
- ⚠️ Automated checks only (~30% of WCAG)

### **Future Enhancements**
- 🔮 Custom authentication support
- 🔮 Bulk URL scanning
- 🔮 Scheduled audits
- 🔮 Integration with CI/CD pipelines
- 🔮 Advanced reporting (charts, trends)
- 🔮 Multi-user collaboration

---

## ✅ **Pre-Presentation Checklist**

- [ ] Server starts without errors (`npm run dev`)
- [ ] Dashboard loads with stats
- [ ] "Run Demo" button works
- [ ] Manual URL scan works
- [ ] Progress stages animate correctly
- [ ] Results show actual violations
- [ ] Reports download successfully
- [ ] Scan history persists
- [ ] Rescan comparison works
- [ ] Responsive design (resize browser)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] No console errors in browser DevTools

---

## 🎉 **You're Ready!**

Your **AccessLens** demo is now complete. The tool provides real, functional accessibility auditing with professional-grade features suitable for college projects, portfolios, or real-world use.

**Questions?** Check the main `README.md` for setup details.

**Good luck with your presentation!** 🚀
