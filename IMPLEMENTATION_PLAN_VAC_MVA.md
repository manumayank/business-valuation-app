# Comprehensive Implementation Plan: VAC & MVA Platform
**Status**: Planning Phase
**Last Updated**: 2025-11-24
**Target Audience**: Development Team, Product Management

---

## Executive Summary

The current application is a **simple self-service business valuation tool**. The improvements.txt document outlines a transformation into a **comprehensive B2B business valuation platform** with:

- **Multi-user support**: Business owners, advisors, and administrators
- **Deep engagement management**: Track complete business evaluation lifecycle
- **Full VAC questionnaire**: Replace simple wizard with structured discovery process
- **Document management**: Upload and validate financial documents
- **Advisor tools**: Dashboard, reconciliation, override capabilities
- **Multiple report types**: VAC, CBP, MVA, MPSP, Action Plans
- **Administrative backend**: Questionnaire templates, engagement tracking, business management

This represents a **major architectural shift** from a consumer app to a professional services platform.

---

## Part 1: Current State Analysis

### What Currently Exists

**Frontend (React):**
- ✅ User authentication (login/registration)
- ✅ Simple 6-step wizard for data entry
- ✅ Dashboard with valuation results
- ✅ Working capital analysis
- ✅ M&A deal analysis
- ✅ Basic PDF export
- ❌ Role-based access control
- ❌ Document upload
- ❌ Advisor interfaces
- ❌ Admin management

**Backend (Node.js/Express):**
- ✅ User management (registration, authentication, JWT)
- ✅ Basic valuation calculation engine
- ✅ Database with users, valuations, completed_improvements tables
- ✅ Health check endpoint
- ❌ Engagement management
- ❌ Questionnaire management
- ❌ File upload handling
- ❌ Document processing
- ❌ Admin APIs

**Database (SQLite):**
```
Current Tables:
- users (id, email, password_hash, full_name, company, phone, verified, status)
- valuations (id, user_id, input_data, valuation_result)
- completed_improvements (id, valuation_id, improvement_key)
- migrations (tracking table)
```

### Current Limitations

| Area | Current | Needed |
|------|---------|--------|
| **Users** | Self-service owners only | Owners + Advisors + Admins |
| **Data Entry** | Simple 6-step wizard | Structured VAC questionnaire + deep financial data |
| **Documents** | Manual input only | Drag & drop uploads (P&L, Balance Sheet, Tax Returns, etc.) |
| **Workflows** | Single pass valuation | Multi-step engagement: intake → review → reconcile → run → report |
| **Oversight** | None | Advisor dashboard, admin controls |
| **Validation** | Basic form validation | Automated reconciliation between quick answers and uploaded financials |
| **Reports** | Basic PDF export | 5 report types: VAC, CBP, MVA, MPSP, Action Plan |
| **Scalability** | Single business per user | Multiple businesses, multiple engagements per business |

---

## Part 2: Gap Analysis - What Needs to Be Built

### Gap 1: Data Model / Database Schema

**Current:** Flat user-to-valuations relationship

**Needed:**
```
Relationships:
Business
  ├─ Engagement (multiple valuations over time)
  │   ├─ Questionnaire (template reference)
  │   ├─ Questionnaire Response (owner's answers)
  │   ├─ Documents (uploaded files)
  │   └─ Valuation Run (snapshot of calculations)
  │       └─ Reports (generated PDFs)
User (extended)
  ├─ Roles (owner, advisor, admin)
  ├─ Team assignments
  └─ Permissions matrix
```

**Required New Tables:**
1. **businesses** - Company being valued
2. **engagements** - Valuation instances
3. **questionnaire_templates** - Question bundles
4. **questionnaire_questions** - Individual questions with metadata
5. **questionnaire_responses** - Answers to questions
6. **documents** - Uploaded files metadata
7. **valuation_runs** - Calculation snapshots
8. **reports** - Generated report PDFs
9. **user_roles** - Role assignments
10. **team_assignments** - Advisor-to-engagement assignments

### Gap 2: Authentication & Authorization

**Current:** Basic JWT auth, no roles

**Needed:**
- Role-based access control (RBAC): owner, advisor, admin
- Business-level permissions: can only see own/assigned businesses
- Engagement-level permissions: only assigned advisors can review
- Admin panel: full system access
- Audit trail: who changed what and when

### Gap 3: Questionnaire Engine

**Current:** Hardcoded 6-step form

**Needed:**
```
Questionnaire Builder:
├─ Templates (Standard VAC+MVA, Lite, Custom)
├─ Question groups:
│  ├─ Owner Pre-Call Questions (discovery)
│  ├─ Step 1: Risk Analysis (15+ questions)
│  ├─ Step 2: Earnings Analysis (6 questions)
│  ├─ Step 3: EBITDA Multiples (4 settings)
│  └─ Documents & Financials (checklist)
├─ Conditional logic (show Q4 only if Q3 = "yes")
├─ Validation rules (numeric ranges, required fields)
└─ Versioning (audit trail for template changes)
```

**Question Metadata:**
- owner_visible (bool)
- advisor_only (bool)
- mandatory (bool)
- category (risk, financial, qualitative, discovery)
- data_type (text, number, select, multiselect, date)
- validation_rules (min, max, pattern)

### Gap 4: Document Management

**Current:** No document support

**Needed:**
```
Document Handling:
├─ Upload interface (drag & drop)
├─ File types:
│  ├─ P&L / Income Statements (3-5 years)
│  ├─ Balance Sheets (3-5 years)
│  ├─ Tax Returns (business + personal)
│  ├─ AR/AP Aging Reports
│  ├─ Fixed Assets / FF&E list
│  ├─ Bank Statements
│  └─ Forecasts / Budgets
├─ Status tracking: uploaded / pending / rejected
├─ Document validation (file type, size limits)
├─ Storage & retrieval (local disk / cloud)
└─ Security (owner-only access, advisor review, audit log)
```

### Gap 5: Engagement Workflow

**Current:** Create → fill wizard → view results (done)

**Needed:**
```
Engagement Lifecycle:
┌─────────────────────────────────────────────────────┐
│ 1. Create Business                                   │
│    (Admin or owner self-registers)                  │
│    Output: Business record + default Engagement     │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 2. Owner Intake (Questionnaire + Documents)        │
│    Owner fills VAC questions + uploads documents    │
│    Status: "Intake in progress" → "Ready for review"│
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 3. Advisor Review & Reconciliation                 │
│    - Check answers vs uploaded documents            │
│    - Flag discrepancies                             │
│    - Add notes / overrides                          │
│    - Correct obvious errors                         │
│    Status: "Under review"                           │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 4. Valuation Run (Calculate)                        │
│    - Trigger calculations with frozen assumptions   │
│    - Store Valuation Run snapshot                   │
│    Status: "Valuation drafted"                      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 5. Report Generation                                │
│    - Generate selected reports (VAC, CBP, MVA, etc) │
│    - Store PDFs                                     │
│    Status: "Reports generated"                      │
└─────────────────────────────────────────────────────┘
```

### Gap 6: Advisor Dashboard

**Current:** None

**Needed:**
```
Advisor Dashboard:
├─ Overview Panel:
│  ├─ Assigned engagements count
│  ├─ Pending review count
│  ├─ Draft reports count
│  └─ This week's activities
├─ Engagement List:
│  ├─ Business name
│  ├─ Owner name
│  ├─ Completion % (questions, documents)
│  ├─ Status badge (intake, review, draft, ready)
│  └─ Last updated date
├─ Engagement Detail View:
│  ├─ Owner's questionnaire answers
│  ├─ Side-by-side: original answer vs override
│  ├─ Comment thread for notes
│  ├─ Document checklist (✓ accepted, ✗ rejected, ? needs clarification)
│  ├─ Auto-reconciliation alerts (Q1 vs uploaded P&L doesn't match)
│  ├─ Financial snapshot summary
│  └─ "Run Valuation" button (when ready)
└─ Valuation Results:
   ├─ Valuation range
   ├─ MPSP (Most Probable Selling Price)
   ├─ VAC uplift potential
   ├─ Working capital analysis
   └─ Report generation checkboxes
```

### Gap 7: Admin Panel

**Current:** None

**Needed:**
```
Admin Panel:
├─ Questionnaire Management:
│  ├─ View/edit master question set
│  ├─ Create templates (Standard, Lite, Custom)
│  ├─ Mark questions as owner/advisor/optional
│  ├─ Version templates with changelog
│  └─ Set firm-level defaults (multiples, risk weighting)
├─ Business Management:
│  ├─ List all businesses
│  ├─ Create/edit business records
│  ├─ Assign advisors / team members
│  └─ View all engagements for a business
├─ Team Management:
│  ├─ Create/edit users
│  ├─ Assign roles (owner, advisor, admin)
│  ├─ Manage permissions
│  └─ Team activity log
├─ Engagement Management:
│  ├─ List all engagements
│  ├─ View status and completion
│  ├─ Reassign advisors
│  └─ Monitor progress
├─ Settings & Configuration:
│  ├─ Default multiples by industry (NAICS)
│  ├─ Risk weighting formula
│  ├─ Report templates
│  └─ File upload limits
└─ Audit Trail:
   ├─ All changes logged with timestamp + user
   ├─ Template version history
   └─ Valuation calculation history
```

### Gap 8: Calculation Engines

**Current:** Simple earnings multiple-based valuation

**Needed:**
1. **VAC (Value Acceleration Calculator)**
   - Quick earnings-based valuation
   - Identify value gaps vs benchmarks
   - Suggest improvements
   - Track implemented improvements

2. **MVA (Market Value Assessment)**
   - Deep dive financial analysis
   - Normalized earnings
   - Multiple approaches (earnings, asset, market comps)
   - Risk-adjusted multiples
   - EBITDA calculations

3. **MPSP (Most Probable Selling Price)**
   - Combines MVA with deal structure analysis
   - Accounts for synergies/adjustments

4. **CBP (Comprehensive Business Profile)**
   - Document-based valuation approach
   - Real estate holdings
   - Asset analysis

### Gap 9: Report Generation

**Current:** Basic PDF with valuation summary

**Needed:**
1. **VAC One-Pager** (~1-3 pages)
   - Quick valuation overview
   - Top improvement opportunities

2. **Business Profile / CBP** (~50-100 pages)
   - Company overview
   - Financial analysis
   - Asset listing
   - Real estate analysis (if applicable)

3. **MVA Report** (~182 pages for Standard/Premium)
   - Detailed financial normalization
   - Benchmark analysis
   - Valuation by multiple methods
   - Risk assessment

4. **MPSP (Most Probable Selling Price)** (~30-50 pages)
   - Deal structure analysis
   - Synergies estimation
   - Multiple analysis
   - ROI analysis
   - Negotiation guidance

5. **Action Plan / Improvements**
   - Prioritized list of improvements
   - Implementation timeline
   - Expected value impact
   - Checklist for tracking

---

## Part 3: Implementation Strategy

### Phase 1: Foundation (Database & Core APIs)
**Duration**: 2-3 weeks
**Deliverables**: Database schema, core APIs, authentication

1. **Database Schema**
   - Create new tables (businesses, engagements, questionnaires, documents, etc.)
   - Add role and permission tables
   - Add audit trail table
   - Run migrations

2. **User & Role Management**
   - Extend user model with roles
   - Implement RBAC middleware
   - Create role assignment endpoints
   - Build permission checking logic

3. **Business Management API**
   - POST /api/businesses (create)
   - GET /api/businesses (list - filtered by user role)
   - GET /api/businesses/:id (detail)
   - PUT /api/businesses/:id (update)

4. **Test Suite**
   - Unit tests for RBAC
   - Integration tests for business APIs

---

### Phase 2: Questionnaire Engine
**Duration**: 2-3 weeks
**Deliverables**: Questionnaire templates, question management, conditional logic

1. **Questionnaire Backend**
   - Question CRUD endpoints
   - Template creation/versioning
   - Conditional logic engine
   - Validation rule engine

2. **Questionnaire Response Handling**
   - POST /api/engagements/:id/responses (save answers)
   - GET /api/engagements/:id/responses (get all answers)
   - Validate against rules
   - Track changes/audit trail

3. **Frontend - Questionnaire UI**
   - Build dynamic form renderer (takes template, renders steps)
   - Implement conditional field display
   - Real-time validation
   - Progress tracking
   - Save & resume functionality

4. **Pre-populated Questionnaire Data**
   - Load master question set (from improvements.txt):
     * Owner Questions (discovery)
     * Risk Analysis (15 questions)
     * Earnings Analysis (6 questions)
     * EBITDA Multiples (4 settings)
     * Documents Checklist

---

### Phase 3: Engagement & Workflow Management
**Duration**: 2-3 weeks
**Deliverables**: Engagement lifecycle, status tracking, workflow state machine

1. **Engagement Management**
   - POST /api/engagements (create - choose template, assign advisor)
   - GET /api/engagements (list - filtered by role/user)
   - GET /api/engagements/:id (detail with all data)
   - PUT /api/engagements/:id/status (update status)
   - PUT /api/engagements/:id/assign (assign advisor)

2. **Engagement Workflow State Machine**
   - States: created → intake_in_progress → ready_for_review → under_review → valuation_drafted → reports_generated
   - Transitions: validate prerequisites before allowing state change
   - Permissions: only valid users can trigger certain transitions

3. **Self-Registration Flow**
   - Owner self-registers (name, email, company)
   - Auto-create Business record
   - Auto-create default Engagement
   - Send secure questionnaire link
   - Admin notified of new lead

4. **Frontend - Engagement Views**
   - Owner view: fill questionnaire, upload documents, see status
   - Advisor view: dashboard, review answers, manage documents, trigger valuation
   - Admin view: all engagements, bulk actions

---

### Phase 4: Document Management
**Duration**: 2-3 weeks
**Deliverables**: Upload system, file storage, document tracking

1. **Document Upload Backend**
   - POST /api/engagements/:id/documents (upload)
   - GET /api/engagements/:id/documents (list)
   - PUT /api/engagements/:id/documents/:doc_id/status (accept/reject/clarify)
   - DELETE /api/engagements/:id/documents/:doc_id

2. **File Storage**
   - Local disk storage (configurable to cloud later)
   - Virus scanning (optional but recommended)
   - File size limits (configurable per doc type)
   - Secure access (owner + assigned advisor only)

3. **Document Types & Metadata**
   - P&L (3-5 years)
   - Balance Sheets
   - Tax Returns
   - AR/AP Aging
   - Fixed Assets/FF&E
   - Bank Statements
   - Forecasts/Budgets
   - Each with: required flag, file size limit, accepted formats

4. **Frontend - Document Upload UI**
   - Drag & drop upload
   - Document checklist (required/optional)
   - Upload progress indicators
   - Status badges (uploaded/pending/rejected)
   - Tooltips explaining why each doc is needed
   - Advisor view: ability to reject with notes/request clarification

---

### Phase 5: Advisor Dashboard & Review Tools
**Duration**: 2 weeks
**Deliverables**: Advisor interface, reconciliation tools, override capabilities

1. **Advisor Dashboard**
   - Overview panel (my engagements, pending reviews, drafts)
   - Engagement list with filtering/sorting
   - Quick stats (completion %, status badges)

2. **Engagement Review Page**
   - Questionnaire answers + advisor override fields (side-by-side)
   - Document checklist with accept/reject buttons
   - Comment thread for notes
   - Auto-reconciliation alerts (answer vs document mismatch)
   - "Run Valuation" button (triggers Phase 7)

3. **Reconciliation Logic**
   - Auto-compare Q1 (revenue) vs P&L
   - Flag if profit doesn't match
   - Alert if customer concentration high but not mentioned in risk
   - Suggest corrections with reasoning

4. **Override System**
   - Advisor can override/correct answers
   - Change flagged as "advisor approved" in audit trail
   - Original answer preserved
   - Reason/comment recorded

---

### Phase 6: Valuation Calculation Engine
**Duration**: 3-4 weeks
**Deliverables**: Complete VAC, MVA, and MPSP calculation engines

1. **Normalize Earnings (VAC + MVA basis)**
   - Take owner answers from STEP 2
   - Add back discretionary spending
   - Adjust for below/above market salary
   - Adjust for rent/holdco payments
   - Calculate normalized EBITDA
   - Compare vs P&L (flag if differs >10%)

2. **VAC (Quick Valuation)**
   - Input: Normalized EBITDA, risk score, multiples
   - Valuation = EBITDA × Multiple
   - Risk weighting: apply discount if risk high
   - Output: Valuation range (low, mid, high)
   - Identify gaps vs benchmarks
   - Generate improvement suggestions

3. **MVA (Deep Valuation)**
   - Read from uploaded financial documents (P&L, Balance Sheet)
   - Normalize financials across 3-5 years
   - Calculate industry benchmarks from NAICS
   - Multiple valuation methods:
     * Earnings approach (EBITDA multiple)
     * Asset approach (NAV)
     * Market comps approach
   - Reconcile methods, create valuation range

4. **MPSP (Most Probable Selling Price)**
   - Base: MVA valuation
   - Adjust for:
     * Deal structure (earnout, seller financing, etc.)
     * Synergies (if applicable)
     * Market conditions
   - Output: Most likely selling price range

5. **Store Valuation Run**
   - Save all inputs (frozen assumptions)
   - Save all outputs (calculations, multiples applied)
   - Timestamp
   - User who triggered it
   - This creates an audit trail

6. **Valuation Run API**
   - POST /api/engagements/:id/valuations (create/run)
   - GET /api/engagements/:id/valuations (list)
   - GET /api/valuations/:id (detailed results)

---

### Phase 7: Report Generation
**Duration**: 2-3 weeks
**Deliverables**: Report templates, PDF generation, multi-format support

1. **Report Templates**
   - VAC One-Pager (1-3 pages)
   - Business Profile / CBP (50-100 pages)
   - MVA Comprehensive (182 pages)
   - MPSP Analysis (30-50 pages)
   - Action Plan (10-20 pages)

2. **PDF Generation**
   - Backend: generate from HTML templates + data
   - Use Puppeteer or similar to convert HTML → PDF
   - Include logos, formatting, page breaks
   - Add watermarks (draft vs final)

3. **Report Storage & Access**
   - Store generated PDFs in database (binary or file link)
   - API to list/retrieve reports
   - Timestamp + owner (who generated)
   - Regeneration capability (recalculate + new PDF)

4. **Report API**
   - POST /api/engagements/:id/reports (generate, choose types)
   - GET /api/engagements/:id/reports (list)
   - GET /api/reports/:id/download (fetch PDF)

5. **Sharing & Distribution**
   - Shareable links (secure tokens)
   - Download to local file
   - Email support (optional)

---

### Phase 8: Admin Panel & Settings
**Duration**: 2 weeks
**Deliverables**: Admin interface, configuration, questionnaire management

1. **Admin Dashboard**
   - User management (create, edit, assign roles)
   - Business & engagement oversight
   - Settings & configuration
   - Audit log viewer

2. **Questionnaire Management**
   - View/edit master questions
   - Create templates (Standard, Lite, Custom)
   - Version control (publish new version)
   - Conditional logic editor
   - Question reordering

3. **Settings Pages**
   - Default multiples by industry (NAICS codes)
   - Risk weighting formula
   - File upload limits
   - Report template customization
   - Firm branding (logo, colors, etc.)

4. **Audit Trail**
   - Log all changes: who, what, when
   - Filter by user, engagement, document, etc.
   - Immutable (for compliance)

---

### Phase 9: Testing, Refinement & Deployment
**Duration**: 2-3 weeks
**Deliverables**: Full test coverage, performance optimization, production deployment

1. **Automated Testing**
   - Unit tests: each calculator, validator, API endpoint
   - Integration tests: workflows (create engagement → fill questionnaire → upload docs → review → run valuation → generate reports)
   - End-to-end tests: full user journeys (both owner and advisor paths)
   - Regression tests: ensure no existing features broken

2. **Performance Optimization**
   - Database indexing (user_id, engagement_status, business_id, etc.)
   - API response caching (static questionnaire templates, benchmarks)
   - File upload optimization (compression, chunked upload for large files)
   - PDF generation performance (async job queue if needed)

3. **Security Hardening**
   - Input validation on all endpoints
   - SQL injection prevention (parameterized queries)
   - XSS protection (sanitize outputs)
   - CSRF tokens on state-changing requests
   - Rate limiting on auth endpoints
   - HTTPS enforcement
   - Secure file access (token-based, not direct URLs)

4. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - Admin guide (how to manage questionnaires, settings, users)
   - User guide (for owner and advisor roles)
   - Deployment guide

5. **Production Deployment**
   - Environment-specific configs (dev, staging, prod)
   - Database migration strategy
   - Backup procedures
   - Monitoring setup (logging, error tracking, uptime)
   - Disaster recovery plan

---

## Part 4: Proposed Technology Stack

### Backend Enhancements
- **Node.js/Express** (keep existing)
- **SQLite** → **PostgreSQL** (recommended for multi-user, multi-engagement model; can stay SQLite if volume is low)
- **File Storage**: Local disk (with option to extend to AWS S3)
- **PDF Generation**: Puppeteer + HTML templates
- **Job Queue** (optional): Bull or Kue for async tasks (PDF generation, document processing)
- **Validation**: Joi or Yup for input validation
- **Authentication**: JWT (keep existing) + role-based middleware

### Frontend Enhancements
- **React** (keep existing)
- **State Management**: Context API (keep) or upgrade to Redux if complexity grows
- **Form Management**: React Hook Form + Formik (dynamic questionnaire rendering)
- **File Upload**: React Dropzone
- **PDF Viewer**: PDF.js or React-PDF (for advisor to preview uploaded PDFs)
- **UI Components**: Material-UI or Ant Design (more professional for B2B)
- **Charts**: Chart.js or D3.js (for financial visualizations)

### DevOps
- **Docker Compose** (keep existing)
- **Database**: PostgreSQL container
- **Environment Management**: .env files (keep existing approach)
- **CI/CD** (optional): GitHub Actions or GitLab CI

---

## Part 5: Risk & Dependencies

### High-Risk Items
1. **Data Migration**: Converting existing flat schema to business/engagement model
   - Mitigation: Create migration scripts, test thoroughly, back up prod data

2. **PDF Generation at Scale**: Puppeteer can be memory-intensive
   - Mitigation: Implement job queue, limit concurrent generations, cache templates

3. **File Upload Security**: Virus, malware, injection attacks
   - Mitigation: Validate file types, scan files, store outside web root

4. **Complex Questionnaire Logic**: Conditional rendering, skip logic can become fragile
   - Mitigation: Test matrix, clear documentation, UI builder for non-devs

### Dependencies
- User stories from business/product team (exact report layouts, specific calculations)
- Sample P&L/Balance Sheet data for testing calculations
- Benchmark data (industry multiples by NAICS code)
- Industry expertise: confirming VAC/MVA formulas are correct

---

## Part 6: Success Criteria

### Functional
- [ ] All VAC questions collectable and stored
- [ ] Document upload for all 7 document types
- [ ] Advisor can review engagement and override answers
- [ ] Auto-reconciliation alerts working (Q vs document discrepancies)
- [ ] Valuation run generates consistent, auditable calculations
- [ ] All 5 report types generate valid PDFs with correct data
- [ ] Admin can create/manage questionnaire templates
- [ ] Self-registration flow works (owner self-signs up → gets questionnaire link)
- [ ] Role-based access control enforced (owner can't see other owner's data, etc.)

### Non-Functional
- [ ] <2 sec API response time (95th percentile) for GET requests
- [ ] <5 sec for POST (questionnaire answers, document upload)
- [ ] PDF generation <10 sec for single report
- [ ] Database handles 1000+ engagements without degradation
- [ ] 99.9% uptime SLA
- [ ] HTTPS enforced, audit trail immutable
- [ ] All endpoints have unit tests + integration tests
- [ ] Code coverage >80%

---

## Part 7: Delivery Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Foundation | 2-3 wks | Wk 1 | Wk 3 |
| Phase 2: Questionnaire | 2-3 wks | Wk 3 | Wk 6 |
| Phase 3: Engagement | 2-3 wks | Wk 6 | Wk 9 |
| Phase 4: Documents | 2-3 wks | Wk 9 | Wk 12 |
| Phase 5: Advisor Tools | 2 wks | Wk 12 | Wk 14 |
| Phase 6: Calculations | 3-4 wks | Wk 14 | Wk 18 |
| Phase 7: Reports | 2-3 wks | Wk 18 | Wk 21 |
| Phase 8: Admin & Settings | 2 wks | Wk 21 | Wk 23 |
| Phase 9: Testing & Deploy | 2-3 wks | Wk 23 | Wk 26 |
| **Total** | **~26 weeks (~6 months)** | | |

**Note**: Phases can overlap if team size permits.

---

## Part 8: Next Steps (Planning Complete)

1. **Review & Alignment**
   - Product/business team reviews this plan
   - Clarify: report formats, exact calculation formulas, benchmark sources
   - Confirm: timeline, team capacity, phase prioritization

2. **Data Preparation**
   - Extract exact question sets from improvements.txt + Excel files
   - Get sample P&L, Balance Sheet, Tax Return documents
   - Industry benchmark data (NAICS + multiples)
   - Report template mockups

3. **Detailed Design Docs**
   - Database ERD (detailed schema)
   - API specifications (Swagger)
   - UI mockups (Figma/wireframes)
   - Calculation formulas (document each formula with examples)

4. **Start Phase 1 Implementation**
   - Database migrations
   - RBAC middleware
   - Business/Engagement APIs

---

## Appendix A: Current Application Files for Reference

```
backend/
  ├── server.js              # Express setup
  ├── db.js                  # Database setup + migrations
  ├── valuationEngine.js      # Current valuation calculation (to be extended)
  ├── routes/                # API endpoints
  ├── middleware/            # Auth middleware
  ├── services/              # Business logic
  └── migrations/001_...js   # Database migrations

frontend/
  ├── src/App.js            # Main component
  ├── src/components/       # UI components
  ├── src/services/api.js   # API calls
  └── src/pages/            # Page components
```

---

## Appendix B: Improvements.txt Summary

The improvements.txt document provides three major sections:

1. **Full VAC Question Set** (discovery → risk → earnings → multiples)
2. **Deep Financial Records** (document upload & validation)
3. **Administrative Backend** (questionnaire templates, engagement lifecycle, business self-registration)

This plan translates those recommendations into a phased implementation roadmap.

---

**Document Status**: ✅ Planning Complete - Ready for Review
**Next Action**: Team review, clarifications, Phase 1 kickoff
