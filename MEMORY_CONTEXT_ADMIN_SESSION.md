# Memory Context - Admin Interface Session
## November 25, 2025

---

## What This Project Is

**Business Valuation & Advisory Platform** - A professional B2B enterprise application that helps business owners and advisors:
- Calculate company valuations (EBITDA, Revenue, DCF methods)
- Identify value drivers and performance gaps
- Track improvements and revalue over time
- Generate professional PDF reports
- Manage client engagements

**Tech Stack:**
- Frontend: React 18, React Router, Axios
- Backend: Node.js/Express, SQLite, JWT auth
- PDF: Puppeteer + Handlebars
- Docker: Full containerization

---

## Current Project Status

### Completed Features
| Feature | Status |
|---------|--------|
| Authentication (JWT) | ✅ Complete |
| Valuation Engine | ✅ Complete (60+ tests) |
| VAC Engine (7-layer) | ✅ Complete |
| Working Capital Analysis | ✅ Complete |
| Deal Analysis | ✅ Complete |
| PDF Reports | ✅ Complete |
| Document Upload | ⚠️ Partial (no data extraction) |
| Admin Dashboard | ⚠️ Partial (see below) |
| Dynamic Questionnaire | ❌ Incomplete |

### All Tests Passing
- 490+ backend tests
- High code coverage

---

## Admin Interface - Current State

### What Exists

**Frontend:** `frontend/src/pages/AdminDashboard.js` (609 lines)
- 5 tabs: Overview, Advisors, Businesses, Engagements, Activity Log
- Stats cards showing counts
- Add advisor modal
- Search and filter functionality

**Backend:** `backend/routes/adminRoutes.js` (449 lines)
- GET /api/admin/stats
- GET/POST /api/admin/advisors
- PUT/DELETE /api/admin/advisors/:id
- GET /api/admin/businesses
- GET /api/admin/businesses/:id
- GET /api/admin/engagements
- GET /api/admin/activity
- GET /api/admin/overview

### Known Issues to Fix

1. **API Mismatches:**
   - Frontend calls `/api/admin/advisors/:id/status` but backend has PUT `/api/admin/advisors/:id`
   - Frontend expects `fullName` but backend returns `name`
   - Frontend expects `status` field but backend uses `is_active`
   - Stats response format mismatch (`stats.totalAdvisors` vs `advisors`)

---

## Admin Interface - Implementation Plan

### Phase 1: Fix Existing Issues (2 hours)
- Fix frontend/backend API mismatches
- Standardize field naming
- Fix stats response format

### Phase 2: Industry Multiples Management (3 hours)
- Backend: CRUD endpoints for industry benchmarks
- Frontend: New "Industry Multiples" tab with edit capability

### Phase 3: System Settings (2 hours)
- Backend: Settings API (GET/PUT)
- Frontend: Settings tab with form
- Settings: report template, file size, session timeout, maintenance mode

### Phase 4: Organization Management (2 hours)
- Backend: Organizations API
- Frontend: Organizations tab with member viewing

### Phase 5: Enhanced User Management (2 hours)
- Expand beyond advisors to all users
- Role management (admin, advisor, owner)
- Password reset capability

### Phase 6: Questionnaire Template Management (3 hours)
- Backend: Templates and questions API
- Frontend: Questionnaire editor
- Question CRUD, reordering, conditional logic

### Phase 7: Testing (2 hours)
- Create `backend/tests/adminRoutes.test.js`
- Test all admin endpoints
- Test authorization

**Total Estimated: 12-16 hours**

---

## Key File Locations

```
Backend:
- backend/routes/adminRoutes.js (main admin routes)
- backend/server.js (routes registered at line 95)
- backend/middleware/authMiddleware.js (JWT auth)

Frontend:
- frontend/src/pages/AdminDashboard.js (admin UI)
- frontend/src/pages/AdminDashboard.css (styles)
- frontend/src/contexts/AuthContext.js (auth state)

Documentation:
- FEATURE_TICKETS.md (full feature ticket list)
- CLAUDE.md (project requirements)
```

---

## Feature Tickets Reference

From `FEATURE_TICKETS.md`, Week 3 includes:
- P3.3.1: Admin dashboard (partially done)
- P3.3.2: User management (todo)
- P3.3.3: Pricing tier enforcement (todo)
- P3.3.4: Usage tracking (todo)
- P3.3.5: Email notifications (todo)

---

## Next Steps When Resuming

1. **Start with Phase 1** - Fix the API mismatches first
2. **Then Phase 2** - Industry Multiples (high value feature)
3. **Continue sequentially** through phases 3-7

### Quick Start Commands
```bash
# Run backend tests
npm --prefix backend test

# Start backend dev server
npm --prefix backend run dev

# Start frontend
npm --prefix frontend start

# Run with Docker
docker-compose up
```

---

## Questions to Ask User

1. Should questionnaire templates be versioned?
2. Should admin be able to create other admins?
3. Any priority changes to the phases?
4. Should we add role hierarchies (super-admin)?

---

---

## Bug Fixes & Known Issues

### Priority 1: Critical Bugs (Fix First)

#### BUG-001: Registration Flow Issues
**File:** `backend/routes/authRoutes.js`, `frontend/src/pages/Register.js`
**Status:** Partially fixed in commit 92797a3
**Issue:** Registration was failing - may still have issues with organization/role creation on signup
**To Fix:** Test registration flow end-to-end, verify org and role creation

#### BUG-002: Admin API Mismatches
**Files:** `frontend/src/pages/AdminDashboard.js`, `backend/routes/adminRoutes.js`
**Issues:**
1. Frontend calls `/api/admin/advisors/:id/status` but backend only has PUT `/api/admin/advisors/:id`
2. Frontend expects `fullName` but backend returns `name` in advisor responses
3. Frontend expects `status` field but backend uses `is_active` (boolean)
4. Stats response: frontend expects `stats.totalAdvisors` but backend returns `advisors`
**To Fix:** Either update frontend to match backend OR add new endpoint + standardize field names

#### BUG-003: Token Refresh Edge Cases
**File:** `frontend/src/contexts/AuthContext.js`, `frontend/src/services/api.js`
**Issues:**
1. Multiple concurrent requests might trigger multiple refresh attempts
2. Tab synchronization of tokens not implemented
3. Race condition possible when token expires during multiple API calls
**To Fix:** Add mutex/lock for refresh, implement localStorage event listener for cross-tab sync

---

### Priority 2: Functional Gaps

#### GAP-001: Hardcoded Wizard (Not Using Dynamic Questionnaire)
**File:** `frontend/src/components/Wizard.js`
**Issue:** 6-step wizard is hardcoded in React, not driven by database questionnaire_templates
**Impact:** Can't customize questions per engagement type, no conditional logic
**To Fix:** Refactor Wizard to consume questionnaire template from API

#### GAP-002: Document Upload - No Data Extraction
**Files:** `backend/services/documentService.js`, `analyze_excel.py`
**Issue:** Documents upload but financial data isn't extracted/parsed
**Impact:** Can't auto-populate financials from uploaded P&L/Balance Sheet
**To Fix:** Integrate Excel parsing, implement data extraction pipeline

#### GAP-003: Business Portal Incomplete
**File:** `frontend/src/pages/BusinessPortal.js`
**Issue:** Shareable link infrastructure exists but integration incomplete
**Impact:** Can't share valuations with external stakeholders
**To Fix:** Complete access token validation, test public viewing flow

---

### Priority 3: Code Quality Issues

#### ISSUE-001: Inconsistent Error Handling
**Files:** Various route files in `backend/routes/`
**Issue:** Some routes return detailed errors, others generic 500s
**To Fix:** Create centralized error handler, standardize error response format

#### ISSUE-002: Missing Tests
**Areas:**
- No tests for `backend/routes/adminRoutes.js`
- No frontend unit tests
- No E2E tests (Cypress/Playwright)
**To Fix:** Add adminRoutes.test.js, consider adding E2E framework

#### ISSUE-003: Database Field Inconsistencies
**Issue:** Some tables use `full_name`, others use `name`, some use `fullName`
**To Fix:** Audit all tables and standardize naming convention

#### ISSUE-004: Middleware Injection Pattern
**File:** `backend/server.js`
**Issue:** `req.db` injected in middleware but not all routes use it consistently
**To Fix:** Standardize database access pattern across all routes

---

### Priority 4: Performance & Security

#### PERF-001: No Pagination on Large Lists
**Files:** Admin routes, engagement routes
**Issue:** All list endpoints return full dataset
**To Fix:** Add limit/offset pagination to all list endpoints

#### PERF-002: No Caching for Industry Benchmarks
**File:** `backend/services/valuationEngine.js`
**Issue:** Benchmarks loaded on every request
**To Fix:** Cache benchmarks in memory, refresh periodically

#### SEC-001: Logout May Not Clear All State
**File:** `frontend/src/contexts/AuthContext.js`
**Issue:** Logout flow may not clear all localStorage items
**To Fix:** Audit logout function, ensure complete state cleanup

---

### Bug Fix Priority Order

**Session 1 (Next Session):**
1. BUG-002: Admin API Mismatches (blocks admin work)
2. BUG-001: Registration Flow (if still broken)
3. ISSUE-002: Add admin route tests

**Session 2:**
1. BUG-003: Token Refresh Edge Cases
2. GAP-003: Business Portal
3. ISSUE-001: Error Handling

**Session 3:**
1. GAP-001: Dynamic Questionnaire
2. GAP-002: Document Data Extraction
3. Performance issues

---

## Reference: Major Architectural Flaws

From `CURRENT_FLAWS_AND_GAPS.md`, the 10 major flaws identified:

| # | Flaw | Status |
|---|------|--------|
| 1 | No multi-user workflows | ⚠️ Partial (engagements exist) |
| 2 | Hardcoded wizard | ❌ Not fixed |
| 3 | No document data extraction | ❌ Not fixed |
| 4 | No RBAC | ✅ Implemented |
| 5 | Incomplete valuation calc | ✅ VAC engine complete |
| 6 | No advisor interface | ✅ Advisor dashboard exists |
| 7 | No admin panel | ⚠️ Partial (needs completion) |
| 8 | Missing report types | ✅ 3 templates exist |
| 9 | No business object model | ✅ Implemented |
| 10 | No self-registration flow | ⚠️ Partial |

---

**Session Date:** November 25, 2025
**Status:** Planning complete, ready to implement
**Next Action:** Start with BUG-002 (Admin API mismatches) then continue admin features
