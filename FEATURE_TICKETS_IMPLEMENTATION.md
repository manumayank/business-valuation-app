# Implementation Feature Tickets - Prioritized
**Status**: Ready for Sprint Planning
**Total Features**: 87 tickets across 9 phases
**Dependencies**: Mapped and documented
**Effort Estimates**: T-shirt sizing (XS, S, M, L, XL)

---

## Priority Framework

### P1 - Critical Path (Must have for basic functionality)
- Phase 1: Database & RBAC foundation
- Phase 2: Questionnaire engine (14 questions)
- Phase 6: VAC calculation engine
- Phase 3: Engagement workflows (status machine)

### P2 - High Value (Required for advisor workflows)
- Phase 4: Document upload
- Phase 5: Advisor dashboard
- Phase 7: Report generation (5 formats)

### P3 - System Features (Required for production)
- Phase 8: Admin panel (settings, templates)
- Phase 9: Testing, deployment, monitoring

---

## PHASE 1: Foundation (Database & RBAC)
**Duration**: 2-3 weeks | **Priority**: P1 - CRITICAL
**Owner**: Backend Lead + DevOps

### FT-1.1: Database Schema Design
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Design complete relational schema (ERD)
- [ ] Create migrations for 15 tables
- [ ] Add indexes for performance
- [ ] Document all foreign keys
- [ ] Create seed data script for industry multiples (CSV import)
- **Dependencies**: None
- **Acceptance Criteria**:
  - ✅ All 15 tables created via migrations
  - ✅ Foreign keys enforced
  - ✅ Indexes on user_id, engagement_id, status, naics_code
  - ✅ CSV import for industry_multiples functional
  - ✅ Zero data loss in migration

### FT-1.2: User Authentication Enhancement
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Extend user model with roles (owner, advisor, admin)
- [ ] Add role assignment endpoints
- [ ] Add role migration data
- [ ] Implement role-based access control middleware
- [ ] Add permission checking on all endpoints
- **Dependencies**: FT-1.1
- **Acceptance Criteria**:
  - ✅ Users can have multiple roles
  - ✅ RBAC middleware blocks unauthorized access
  - ✅ All endpoints check permissions
  - ✅ Admin can assign roles
  - ✅ Tests verify permission enforcement

### FT-1.3: Business Management API
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] POST /api/businesses (create)
- [ ] GET /api/businesses (list with filtering)
- [ ] GET /api/businesses/:id (detail)
- [ ] PUT /api/businesses/:id (update)
- [ ] DELETE /api/businesses/:id (soft delete)
- [ ] GET /api/businesses/:id/engagements (related)
- **Dependencies**: FT-1.1, FT-1.2
- **Acceptance Criteria**:
  - ✅ All CRUD operations working
  - ✅ Filtering by owner/advisor/industry
  - ✅ Pagination on list endpoint
  - ✅ Proper error handling
  - ✅ API tests for all endpoints

### FT-1.4: Engagement Management API
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] POST /api/engagements (create with template selection)
- [ ] GET /api/engagements (list with filtering)
- [ ] GET /api/engagements/:id (detail with all related data)
- [ ] PUT /api/engagements/:id/status (state transitions)
- [ ] PUT /api/engagements/:id/assign (assign advisor)
- [ ] POST /api/engagements/:id/comments (add advisor notes)
- **Dependencies**: FT-1.1, FT-1.2, FT-1.3
- **Acceptance Criteria**:
  - ✅ Engagement state machine enforced
  - ✅ Status transitions validated
  - ✅ Advisor assignments tracked
  - ✅ Comments stored with timestamps
  - ✅ Proper access control per role

### FT-1.5: Team Management API
**Priority**: P1 | **Effort**: S | **Status**: Ready
- [ ] POST /api/team-members (create user)
- [ ] GET /api/team-members (list)
- [ ] PUT /api/team-members/:id/roles (assign roles)
- [ ] DELETE /api/team-members/:id (deactivate)
- [ ] GET /api/team-members/:id/assignments (view engagement assignments)
- **Dependencies**: FT-1.1, FT-1.2
- **Acceptance Criteria**:
  - ✅ Users created with roles
  - ✅ Role assignments persistent
  - ✅ Admin only can manage team
  - ✅ Soft delete (deactivate) working

### FT-1.6: Audit Trail System
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Create audit_log table
- [ ] Implement audit middleware (logs all changes)
- [ ] Track: user_id, table_name, operation (INSERT/UPDATE/DELETE), old_value, new_value, timestamp
- [ ] API to query audit logs
- [ ] API to generate audit report
- **Dependencies**: FT-1.1
- **Acceptance Criteria**:
  - ✅ All changes logged immutably
  - ✅ Cannot delete audit logs
  - ✅ Audit queries performant
  - ✅ Reports exportable

### FT-1.7: Database Testing
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Unit tests for all database operations
- [ ] Integration tests for foreign key constraints
- [ ] Performance tests for indexed queries
- [ ] Data migration validation tests
- [ ] Seed data verification tests
- **Dependencies**: All FT-1.x
- **Acceptance Criteria**:
  - ✅ 95%+ code coverage
  - ✅ All tests passing
  - ✅ Performance benchmarks met (<100ms queries)

---

## PHASE 2: Questionnaire Engine
**Duration**: 2-3 weeks | **Priority**: P1 - CRITICAL
**Owner**: Backend Lead + Frontend Lead

### FT-2.1: Questionnaire Templates Database
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Create questionnaire_templates table
- [ ] Create questionnaire_questions table
- [ ] Create questionnaire_responses table
- [ ] Create question_options table (for dropdowns)
- [ ] Implement versioning system
- [ ] Load master question set (14 risk + 6 earnings + 4 multiples + discovery)
- **Dependencies**: FT-1.1
- **Acceptance Criteria**:
  - ✅ All tables created
  - ✅ Master question set loaded (24 questions total)
  - ✅ Versioning tracks changes
  - ✅ Question options correctly mapped
  - ✅ Validation rules stored

### FT-2.2: Questionnaire Response Storage
**Priority**: P1 | **Effort**: S | **Status**: Ready
- [ ] POST /api/engagements/:id/responses (save answers)
- [ ] GET /api/engagements/:id/responses (retrieve answers)
- [ ] PUT /api/engagements/:id/responses/:question_id (update single answer)
- [ ] Store answer_text, answer_numeric, answer_select, answer_date
- [ ] Track answer_source (owner, advisor, system)
- [ ] Store answer_timestamp
- **Dependencies**: FT-2.1, FT-1.4
- **Acceptance Criteria**:
  - ✅ All answer types stored correctly
  - ✅ Partial responses saved (resume later)
  - ✅ Answers retrievable per engagement
  - ✅ Timestamp tracking working

### FT-2.3: Dynamic Form Renderer (Frontend)
**Priority**: P1 | **Effort**: L | **Status**: Ready
- [ ] Build form component that takes questionnaire template
- [ ] Render form fields based on question type (text, number, select, date, etc.)
- [ ] Implement conditional field display (show Q4 only if Q3 = yes)
- [ ] Real-time validation per field
- [ ] Progress bar showing completion %
- [ ] Save progress locally (localStorage) + to server
- [ ] Back/Next navigation between steps
- [ ] Keyboard accessibility
- **Dependencies**: FT-2.1, FT-2.2
- **Acceptance Criteria**:
  - ✅ All 24 questions render correctly
  - ✅ Conditional logic working
  - ✅ Validation errors displayed
  - ✅ Progress saved automatically
  - ✅ Mobile responsive
  - ✅ Accessibility tests passing

### FT-2.4: Risk Scoring Calculation (Backend)
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Implement 14 question scoring rules (FT-1.5 points each)
- [ ] Sum all 14 scores → risk_score (1-70 range)
- [ ] Calculate risk_category (HIGH/MEDIUM/LOW)
- [ ] POST /api/engagements/:id/risk-score (calculate)
- [ ] GET /api/engagements/:id/risk-score (retrieve)
- [ ] Test all 14 question mappings
- **Dependencies**: FT-2.1, FT-2.2
- **Acceptance Criteria**:
  - ✅ Risk score 1-70 calculated correctly
  - ✅ All 14 question mappings verified
  - ✅ Risk categories assigned correctly
  - ✅ Edge cases tested (all yes, all no, mixed)
  - ✅ Matches Excel output exactly

### FT-2.5: Questionnaire Admin UI (Frontend)
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Admin page to view master question set
- [ ] UI to create custom templates
- [ ] Drag-and-drop question reordering
- [ ] UI to set question visibility (owner/advisor/optional)
- [ ] Conditional logic editor (if/then rules)
- [ ] Template versioning display
- [ ] Publish new version button
- **Dependencies**: FT-2.1, FT-1.2
- **Acceptance Criteria**:
  - ✅ Questions displayed in table
  - ✅ Drag-and-drop working
  - ✅ Conditional rules saved
  - ✅ Versioning shows history
  - ✅ Only admin can manage

### FT-2.6: Questionnaire Engine Tests
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Unit tests for all 14 risk question scorings
- [ ] Unit tests for conditional logic
- [ ] Integration tests for form submission
- [ ] End-to-end test: fill all questions, submit
- [ ] Test resuming partial responses
- [ ] Test validation errors
- [ ] Test risk score calculation
- **Dependencies**: FT-2.1, FT-2.2, FT-2.3, FT-2.4
- **Acceptance Criteria**:
  - ✅ 90%+ code coverage
  - ✅ All tests passing
  - ✅ Edge cases covered

---

## PHASE 3: Engagement & Workflow Management
**Duration**: 2-3 weeks | **Priority**: P1 - CRITICAL
**Owner**: Backend Lead

### FT-3.1: Engagement Workflow State Machine
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Design state machine (6 states)
  - created → intake_in_progress → ready_for_review → under_review → valuation_drafted → reports_generated
- [ ] Implement state transition rules
- [ ] Validate prerequisites before transitions
- [ ] Store engagement_status in database
- [ ] API endpoints for state transitions
- [ ] Prevent invalid transitions
- **Dependencies**: FT-1.4
- **Acceptance Criteria**:
  - ✅ All state transitions working
  - ✅ Invalid transitions rejected
  - ✅ Status changes logged in audit trail
  - ✅ Tests verify all paths

### FT-3.2: Self-Registration Flow (Backend)
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] POST /api/self-register/business (owner registers)
- [ ] Create Business record
- [ ] Create default Engagement (using Standard template)
- [ ] Create User record (owner role)
- [ ] Send secure questionnaire link
- [ ] Create activation email template
- [ ] Track registration source
- [ ] Auto-create team assignment queue for admin
- **Dependencies**: FT-1.3, FT-1.4, FT-2.1
- **Acceptance Criteria**:
  - ✅ Registration completes end-to-end
  - ✅ Owner can access questionnaire via link
  - ✅ Admin sees in "New Leads" queue
  - ✅ Email sent with link
  - ✅ Security: link is secure token

### FT-3.3: Self-Registration Flow (Frontend)
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Landing page with "Get Started" button
- [ ] Self-registration form (company name, email, industry)
- [ ] Form validation
- [ ] Submit to backend
- [ ] Confirmation page with next steps
- [ ] Email confirmation workflow
- [ ] Link to questionnaire from email
- **Dependencies**: FT-3.2
- **Acceptance Criteria**:
  - ✅ Form submits correctly
  - ✅ User receives email with questionnaire link
  - ✅ Link brings to questionnaire
  - ✅ Mobile responsive
  - ✅ Validation errors displayed

### FT-3.4: Owner View - Engagement & Questionnaire
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Owner dashboard showing their business
- [ ] Current engagement status
- [ ] Questionnaire progress %
- [ ] Document upload checklist
- [ ] Start/resume questionnaire
- [ ] View previous valuations
- [ ] "Update Data & Recalculate" button
- [ ] View generated reports
- **Dependencies**: FT-2.3, FT-3.1
- **Acceptance Criteria**:
  - ✅ Status badges working
  - ✅ Progress bar accurate
  - ✅ Can resume questionnaire
  - ✅ Previous data loaded
  - ✅ Mobile responsive

### FT-3.5: Admin Dashboard - New Leads Queue
**Priority**: P2 | **Effort**: S | **Status**: Ready
- [ ] Admin page showing new self-registered businesses
- [ ] List with: company name, owner, registration date, status
- [ ] "Assign Advisor" dropdown
- [ ] Assign button
- [ ] Preview engagement data
- [ ] Mark as reviewed
- [ ] Move to main engagements list
- **Dependencies**: FT-1.2, FT-1.4, FT-3.2
- **Acceptance Criteria**:
  - ✅ New leads display correctly
  - ✅ Can assign advisor
  - ✅ Status updates on assign
  - ✅ Audit logged

### FT-3.6: Workflow Tests
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Test complete workflow: register → fill questionnaire → submit
- [ ] Test state transitions
- [ ] Test admin assignment flow
- [ ] Test advisor review flow
- [ ] Test multiple engagements per business
- **Dependencies**: FT-3.1, FT-3.2, FT-3.3, FT-3.4
- **Acceptance Criteria**:
  - ✅ End-to-end workflows working
  - ✅ All state transitions verified
  - ✅ Data integrity maintained

---

## PHASE 4: Document Management
**Duration**: 2-3 weeks | **Priority**: P2 - HIGH
**Owner**: Backend Lead + DevOps

### FT-4.1: Document Upload API
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] POST /api/engagements/:id/documents (upload file)
- [ ] Validate file type (PDF, Excel only)
- [ ] Validate file size (max 50MB)
- [ ] Store file metadata (name, size, type, upload_date, uploaded_by)
- [ ] Store file in secure location (outside web root)
- [ ] Generate secure access token for file
- [ ] Return file_id for reference
- **Dependencies**: FT-1.1, FT-3.1
- **Acceptance Criteria**:
  - ✅ Upload completes successfully
  - ✅ File validation working (type, size)
  - ✅ Metadata stored correctly
  - ✅ File inaccessible without token
  - ✅ Performance <5 sec for 50MB file

### FT-4.2: Document Management API
**Priority**: P2 | **Effort**: S | **Status**: Ready
- [ ] GET /api/engagements/:id/documents (list all)
- [ ] GET /api/documents/:id (retrieve file - with token)
- [ ] DELETE /api/documents/:id (delete - soft delete)
- [ ] PUT /api/documents/:id/status (accept/reject/request clarification)
- [ ] Implement document storage abstraction (local disk first, AWS S3 later)
- **Dependencies**: FT-4.1
- **Acceptance Criteria**:
  - ✅ Document list shows status
  - ✅ File retrieval requires token
  - ✅ Status tracking working
  - ✅ Soft delete preserves audit trail

### FT-4.3: Document Upload UI (Frontend - Owner)
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Drag & drop upload area
- [ ] File input for alternative
- [ ] Document checklist (7 document types)
- [ ] Status badges (required/optional, uploaded/pending/rejected)
- [ ] Tooltips explaining why each doc needed
- [ ] Upload progress bar
- [ ] Delete button (soft delete)
- [ ] Retry on failure
- **Dependencies**: FT-4.1, FT-4.2
- **Acceptance Criteria**:
  - ✅ Drag & drop working
  - ✅ Progress bar showing
  - ✅ Status badges updating
  - ✅ Mobile responsive
  - ✅ Accessibility compliant

### FT-4.4: Document Review UI (Frontend - Advisor)
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Document list with status
- [ ] Accept button → changes status to "accepted"
- [ ] Reject button + text field (reason)
- [ ] "Request Clarification" button + text field
- [ ] Document preview (PDF.js or similar)
- [ ] Notes section (advisor comments)
- [ ] Download button
- [ ] Status history/timeline
- **Dependencies**: FT-4.2, FT-3.1
- **Acceptance Criteria**:
  - ✅ Status buttons working
  - ✅ Reason/notes stored
  - ✅ PDF preview working
  - ✅ Download functional
  - ✅ Notes displayed to owner

### FT-4.5: Document Type Definitions
**Priority**: P2 | **Effort**: S | **Status**: Ready
- [ ] Create document_types table
  - P&L / Income Statements (required, 3-5 years)
  - Balance Sheets (required, 3-5 years)
  - Tax Returns - Business (required, 3-5 years)
  - Tax Returns - Personal (conditional, small businesses)
  - AR/AP Aging Reports (recommended)
  - Fixed Assets / FF&E List (recommended)
  - Bank Statements (optional)
  - Forecasts / Budgets (optional)
- [ ] Define: required flag, file size limit, accepted formats
- [ ] Display in UI with explanations
- **Dependencies**: FT-1.1
- **Acceptance Criteria**:
  - ✅ All 7+ document types defined
  - ✅ Requirements clear (required/optional)
  - ✅ UI displays correctly

### FT-4.6: File Storage Implementation
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Local file storage (Phase 1 - MVP)
  - Create /data/documents directory
  - Store files with secure naming
  - Implement access control
- [ ] Storage abstraction layer (for S3 upgrade later)
- [ ] Backup mechanism for documents
- [ ] Cleanup for deleted documents
- **Dependencies**: FT-4.1, FT-4.2
- **Acceptance Criteria**:
  - ✅ Files stored securely
  - ✅ Directory structure organized
  - ✅ Backup working
  - ✅ No direct file access via URL

### FT-4.7: Document Management Tests
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Test file upload (various types/sizes)
- [ ] Test file validation
- [ ] Test document status workflow
- [ ] Test file access control
- [ ] Test document preview
- [ ] Integration test: upload → advisor review → status change
- **Dependencies**: All FT-4.x
- **Acceptance Criteria**:
  - ✅ 85%+ code coverage
  - ✅ All tests passing
  - ✅ Security tests included (unauthorized access blocked)

---

## PHASE 5: Advisor Dashboard & Review Tools
**Duration**: 2 weeks | **Priority**: P2 - HIGH
**Owner**: Frontend Lead

### FT-5.1: Advisor Dashboard (Frontend)
**Priority**: P2 | **Effort**: L | **Status**: Ready
- [ ] Dashboard layout with sections
- [ ] Overview panel:
  - Assigned engagements count
  - Pending review count
  - Draft reports count
  - This week's activities
- [ ] Engagement list:
  - Filterable table (name, status, % complete, last updated)
  - Search by company name
  - Filter by status (intake, review, draft, ready)
  - Sort options
- [ ] Quick stats
- [ ] Recently viewed engagements
- **Dependencies**: FT-1.2, FT-1.4
- **Acceptance Criteria**:
  - ✅ Dashboard loads <2 sec
  - ✅ Filtering/searching working
  - ✅ Real-time updates
  - ✅ Mobile responsive
  - ✅ Performance optimized

### FT-5.2: Engagement Review Page (Frontend)
**Priority**: P2 | **Effort**: XL | **Status**: Ready
- [ ] Two-column layout:
  - Left: Owner's questionnaire answers (read-only)
  - Right: Advisor override fields
- [ ] Display all 24 questions organized by section
  - Discovery questions
  - Risk analysis (14 questions)
  - Earnings analysis (6 questions)
  - Multiples settings (4 settings)
- [ ] For each question:
  - Display owner's answer
  - Show field for advisor override
  - "Mark as correct" checkbox
  - Notes/comment field
- [ ] Document checklist with status buttons
- [ ] Comment thread for engagement-level notes
- [ ] Auto-reconciliation alerts (highlighted warnings)
- [ ] "Run Valuation" button (when ready)
- [ ] Financial snapshot summary (calculated values)
- **Dependencies**: FT-2.3, FT-3.1, FT-4.3, FT-4.4
- **Acceptance Criteria**:
  - ✅ All 24 questions display with answers
  - ✅ Override fields working
  - ✅ Notes saved to comments
  - ✅ Document checklist functional
  - ✅ Alerts highlighting issues
  - ✅ Performance <2 sec load

### FT-5.3: Answer Override & Correction (Backend)
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Store advisor overrides separately from owner answers
- [ ] Keep original answer for audit trail
- [ ] Track: override_value, override_reason, override_by (user_id), override_timestamp
- [ ] API endpoints for saving overrides
- [ ] Validation: advisor can only override assigned engagement
- [ ] Use override in calculations (not owner answer)
- **Dependencies**: FT-2.2, FT-1.2
- **Acceptance Criteria**:
  - ✅ Overrides stored with original answers
  - ✅ Audit trail complete
  - ✅ Calculations use override values
  - ✅ Only assigned advisor can override

### FT-5.4: Auto-Reconciliation Alerts
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Compare Q1 (revenue) vs uploaded P&L
  - Alert if difference >10%
- [ ] Compare Q2 (profit) vs P&L
  - Alert if difference >10%
- [ ] Compare customer concentration (Q8) vs AR aging
  - Alert if highest customer >stated %
- [ ] Compare lease years vs contract expiration
- [ ] Check for missing required documents
- [ ] Display alerts prominently in review page
- [ ] Allow advisor to dismiss or act on alerts
- **Dependencies**: FT-2.2, FT-4.1, FT-4.4
- **Acceptance Criteria**:
  - ✅ All reconciliation checks implemented
  - ✅ Alerts display correctly
  - ✅ Threshold configurable
  - ✅ False positive rate <5%

### FT-5.5: Engagement Comment System
**Priority**: P2 | **Effort**: S | **Status**: Ready
- [ ] Comment input field (at top of review page)
- [ ] Comment history (threaded)
- [ ] Timestamped, authored by (advisor name)
- [ ] Edit own comments
- [ ] Delete own comments (soft delete)
- [ ] API:
  - POST /api/engagements/:id/comments
  - GET /api/engagements/:id/comments
  - PUT /api/comments/:id
  - DELETE /api/comments/:id
- [ ] Store in database
- [ ] Visible to both owner and advisor
- **Dependencies**: FT-1.1, FT-3.1
- **Acceptance Criteria**:
  - ✅ Comments display in thread
  - ✅ Timestamps showing
  - ✅ Edit/delete working
  - ✅ Persisted correctly

### FT-5.6: Advisor Dashboard Tests
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Test dashboard load and render
- [ ] Test filtering and searching
- [ ] Test engagement detail page
- [ ] Test override functionality
- [ ] Test reconciliation alerts
- [ ] End-to-end: advisor reviews engagement, makes corrections, submits
- **Dependencies**: All FT-5.x
- **Acceptance Criteria**:
  - ✅ 80%+ code coverage
  - ✅ All tests passing
  - ✅ Performance benchmarks met

---

## PHASE 6: VAC Calculation Engine
**Duration**: 5-6 weeks | **Priority**: P1 - CRITICAL
**Owner**: Backend Lead (Calculations), QA Lead (Validation)

### FT-6.1: Admin Settings Database & API
**Priority**: P1 | **Effort**: S | **Status**: Ready
- [ ] Create admin_settings table
- [ ] Store baseline margins (7.5%, 1%, 1%, 2%)
- [ ] Make editable via API
- [ ] Add audit trail for changes
- [ ] Admin endpoints:
  - GET /api/admin/settings
  - PUT /api/admin/settings
- [ ] Load from database on startup
- **Dependencies**: FT-1.1, FT-1.2
- **Acceptance Criteria**:
  - ✅ Settings stored and retrievable
  - ✅ Changes audited
  - ✅ Defaults applied on first run

### FT-6.2: Industry Multiples Import & Management
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Create industry_multiples table (NAICS, multiple)
- [ ] CSV import from MultipleData sheet
  - Create import script
  - Handle NAICS code mapping
  - Validate data
- [ ] Admin API:
  - GET /api/admin/multiples (list all)
  - PUT /api/admin/multiples/:naics (update)
  - POST /api/admin/multiples/import (upload CSV)
- [ ] Lookup function: get multiple by NAICS code
- [ ] Fallback if NAICS not found
- **Dependencies**: FT-1.1, FT-1.2, FT-6.1
- **Acceptance Criteria**:
  - ✅ MultipleData sheet imported successfully
  - ✅ All NAICS codes mapped
  - ✅ Lookups working
  - ✅ Admin can edit/update
  - ✅ Audit trail tracked

### FT-6.3: Risk Score Calculation (Core)
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Implement 14 risk question scoring (per calculations.txt)
- [ ] Q1: Fiscal year end (5 if yes, 1 if no)
- [ ] Q2: Incorporated (5 if yes, 1 if no)
- [ ] Q3: Profit last year (5 if yes, 1 if no)
- [ ] Q4: Profit last 6 months (5/4/3/-3/1 based on trend)
- [ ] Q5: Clean financials years (5/4/3/1 based on years)
- [ ] Q6: Has GM (5 if yes, 1 if no)
- [ ] Q7: Project-based (5/3/1)
- [ ] Q8: Customer concentration (5/4/3/1 - exact Excel logic)
- [ ] Q9: Owner hours/week (5/4/3/1)
- [ ] Q10: Lease years remaining (5/4/1)
- [ ] Q11: Company age (5/4/1)
- [ ] Q12: Operating system (5/3/1)
- [ ] Q13: Payment terms (5/4/3/1)
- [ ] Q14: Number of SPOFs (5/4/3/2/1)
- [ ] Sum all 14 → risk_score (1-70)
- [ ] POST /api/valuations/:id/risk-score (calculate)
- **Dependencies**: FT-2.1, FT-2.2
- **Acceptance Criteria**:
  - ✅ All 14 questions scoring correctly
  - ✅ Risk score 1-70 accurate
  - ✅ Matches Excel exactly
  - ✅ Test cases passing

### FT-6.4: EBITDA Calculation (Core)
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Baseline method (if no detailed financials):
  - revenue × baseline_pretax_margin = pretax
  - revenue × baseline_depreciation = depreciation
  - revenue × baseline_interest = interest
  - revenue × baseline_discretionary = discretionary
  - EBITDA = pretax + depreciation + interest + discretionary
- [ ] Actual method (if financials provided):
  - EBITDA = pretaxProfit + depreciation + interest + discretionary
- [ ] Add adjustments:
  - ownerSalaryAdj (above/below market)
  - rentAdj (above/below market)
  - EBITDA_adjusted = EBITDA + ownerSalaryAdj + rentAdj
- [ ] Calculate EBITDA_margin = EBITDA_adjusted / revenue
- [ ] API endpoint (part of valuation calculation)
- [ ] Verify against uploaded P&L (reconciliation)
- **Dependencies**: FT-6.1, FT-2.2, FT-4.1
- **Acceptance Criteria**:
  - ✅ Both methods working
  - ✅ Adjustments applied correctly
  - ✅ Matches Excel ±0.01%
  - ✅ Reconciliation alerts triggered on mismatch

### FT-6.5: Current Value Calculation (Core)
**Priority**: P1 | **Effort**: S | **Status**: Ready
- [ ] currentValue = EBITDA_adjusted × multipleUsed
- [ ] Implement in valuation calculation
- [ ] Apply optional risk weighting:
  - if riskWeighting ON:
    - formula: newMultiple = baseMultiple × (1 + riskWeight%)
    - default riskWeight = 0
    - example: 4.0 × (1 + 0.15) = 4.6
- [ ] Store current value in results
- **Dependencies**: FT-6.3, FT-6.4
- **Acceptance Criteria**:
  - ✅ Formula correct
  - ✅ Risk weighting applied
  - ✅ Matches Excel ±0.01%

### FT-6.6: Value Acceleration - Size Lever
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Input: targetSizeGrowthRate (EA) - user input
- [ ] Default: 0.25 (25%)
- [ ] Calculation:
  - newRevenue = baseRevenue × (1 + EA)
  - newEBITDA = newRevenue × profitMargin (or baselineMargin)
  - sizeAdjustedValue = newEBITDA × baseMultiple
  - valueCreatedSize = sizeAdjustedValue - currentValue
  - valueCreatedSizePercent = valueCreatedSize / currentValue
- [ ] Store in vac_assumptions table
- [ ] API to update and recalculate
- **Dependencies**: FT-6.4, FT-6.5
- **Acceptance Criteria**:
  - ✅ Formula correct
  - ✅ Matches Excel ±0.01%
  - ✅ Default value used if not provided

### FT-6.7: Value Acceleration - Efficiency Lever
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Input: targetEfficiencyImprovement (E) - user input
- [ ] Default: 0.05 (5%)
- [ ] Calculation:
  - efficiencyGain = baseRevenue × E
  - newAdjEBITDA = baseEBITDA + efficiencyGain
  - effAdjustedValue = newAdjEBITDA × baseMultiple
  - valueCreatedEfficiency = effAdjustedValue - currentValue
  - valueCreatedEfficiencyPercent = valueCreatedEfficiency / currentValue
- [ ] Store in vac_assumptions table
- [ ] API to update and recalculate
- **Dependencies**: FT-6.4, FT-6.5
- **Acceptance Criteria**:
  - ✅ Formula correct
  - ✅ Matches Excel ±0.01%
  - ✅ Default value used if not provided

### FT-6.8: Value Acceleration - Multiple Lever
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Input: targetMultipleIncrease (M) - user input
- [ ] Default: 1.0 (100% increase = 2x multiple)
- [ ] Calculation:
  - newMultiple = baseMultiple + (baseMultiple × M)
  - riskAdjustedValue = newMultiple × baseEBITDA
  - valueCreatedMultiple = riskAdjustedValue - currentValue
  - valueCreatedMultiplePercent = valueCreatedMultiple / currentValue
- [ ] Store in vac_assumptions table
- [ ] API to update and recalculate
- **Dependencies**: FT-6.4, FT-6.5
- **Acceptance Criteria**:
  - ✅ Formula correct
  - ✅ Matches Excel ±0.01%
  - ✅ Default value used if not provided

### FT-6.9: Probability Distribution Calculation
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Generate 5-band bell curve distribution
- [ ] stdDevSteps: [-2, -1, 0, +1, +2]
- [ ] Probabilities: [0.1, 0.2, 0.4, 0.2, 0.1]
- [ ] For each band:
  - multiple = meanMultiple + (stdDevStep × stdDevRange)
  - mvicValue = EBITDA × multiple
  - probability = assigned probability
- [ ] Calculate expectedValue = Σ (probability_i × mvicValue_i)
- [ ] Return distribution array + expected value
- [ ] API returns array of distribution bands
- **Dependencies**: FT-6.5
- **Acceptance Criteria**:
  - ✅ 5 bands generated correctly
  - ✅ Probabilities sum to 1.0
  - ✅ Matches Excel exactly
  - ✅ Expected value calculated

### FT-6.10: Wealth Gap Calculator
**Priority**: P1 | **Effort**: M | **Status**: Ready
- [ ] Inputs: targetValue, growthRate, profitMargin, multiple, projectionYears
- [ ] Yearly projections:
  - Year 0: current revenue/EBITDA/salePrice
  - Year N: revenue[n] = revenue[0] × (1 + growthRate)^n
  - Year N: EBITDA[n] = revenue[n] × profitMargin
  - Year N: salePrice[n] = EBITDA[n] × multiple
  - Year N: progressToTarget = salePrice[n] / targetValue
- [ ] Calculate yearsToExit:
  - yearsToExit = LN(targetValue / currentValue) / LN(1 + growthRate)
- [ ] Generate yearly table (year, revenue, EBITDA, salePrice, progressToTarget)
- [ ] Return table + yearsToExit
- **Dependencies**: FT-6.4, FT-6.5
- **Acceptance Criteria**:
  - ✅ Yearly projections accurate
  - ✅ yearsToExit formula correct
  - ✅ Matches Excel to nearest dollar
  - ✅ Handles edge cases (0 growth, negative profit)

### FT-6.11: VAC Valuation API Endpoint
**Priority**: P1 | **Effort**: L | **Status**: Ready
- [ ] POST /api/engagements/:id/valuations (create/run valuation)
- [ ] Input: engagement_id, (optional) overrides for EA, E, M
- [ ] Process:
  1. Fetch questionnaire responses
  2. Fetch documents
  3. Verify required data present
  4. Calculate risk score
  5. Calculate EBITDA (baseline or actual)
  6. Select multiple (custom/common/industry)
  7. Calculate current value
  8. Calculate 3 levers (size, efficiency, multiple)
  9. Calculate probability distribution
  10. Calculate wealth gap
  11. Store all results
  12. Return complete valuation object
- [ ] GET /api/engagements/:id/valuations (retrieve)
- [ ] GET /api/valuations/:id (specific valuation detail)
- [ ] Return complete 30+ field response structure
- [ ] Store valuation snapshot (frozen assumptions)
- **Dependencies**: FT-6.3 through FT-6.10
- **Acceptance Criteria**:
  - ✅ All calculations performed in sequence
  - ✅ Results match Excel ±0.01%
  - ✅ Complete response structure returned
  - ✅ Performance <1 sec
  - ✅ Assumptions frozen in database

### FT-6.12: VAC Calculation Tests (Excel Validation)
**Priority**: P1 | **Effort**: XL | **Status**: Ready
- [ ] Load 3-5 test Excel files provided by business
- [ ] For each test case:
  - Extract inputs (all answers, documents, assumptions)
  - Run backend calculation
  - Compare outputs:
    - Risk score: exact match
    - EBITDA: ±0.01% deviation
    - Current value: ±0.01% deviation
    - Size uplift: ±0.01% deviation
    - Efficiency uplift: ±0.01% deviation
    - Multiple uplift: ±0.01% deviation
    - Probability distribution: exact match
    - Wealth gap: nearest dollar
  - Flag any mismatches
  - Fix and retest
- [ ] Create automated test suite
- [ ] Unit tests for each calculation layer
- [ ] Edge case tests (zero revenue, negative profit, 0 growth, etc.)
- **Dependencies**: FT-6.1 through FT-6.11
- **Acceptance Criteria**:
  - ✅ All 3-5 test cases pass
  - ✅ All calculations within tolerance
  - ✅ 95%+ code coverage
  - ✅ Edge cases handled
  - ✅ Performance <1 sec per valuation

---

## PHASE 7: Report Generation
**Duration**: 2-3 weeks | **Priority**: P2 - HIGH
**Owner**: Backend Lead + Frontend Lead

### FT-7.1: Report Templates (5 Formats)
**Priority**: P2 | **Effort**: L | **Status**: Ready
- [ ] Report 1: VAC One-Pager (1-3 pages)
  - Company overview
  - Current valuation
  - Top 3 improvement opportunities
  - Call-to-action
- [ ] Report 2: Business Profile / CBP (50-100 pages)
  - Company overview
  - Financial summary (3-5 years)
  - Asset inventory
  - Management structure
  - Customer/supplier analysis
  - Real estate holdings (if applicable)
- [ ] Report 3: MVA Comprehensive (182 pages)
  - Detailed financial normalization
  - Trend analysis
  - Industry benchmarks
  - Valuation by multiple methods
  - Working capital analysis
  - Tax normalization
  - Risk assessment
  - Recommendations
- [ ] Report 4: MPSP Analysis (30-50 pages)
  - Deal structure options
  - Synergies analysis
  - Multiple analysis
  - ROI analysis
  - Negotiation guidance
  - Comparable transactions
- [ ] Report 5: Action Plan (10-20 pages)
  - Prioritized improvements
  - Implementation timeline
  - Expected value impact
  - Tracking checklist
  - Owner accountability
- **Dependencies**: FT-6.11
- **Acceptance Criteria**:
  - ✅ All 5 templates designed
  - ✅ HTML templates created
  - ✅ Data placeholders working
  - ✅ Professional formatting

### FT-7.2: PDF Generation Engine
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Use Puppeteer (Node.js) to convert HTML → PDF
- [ ] Backend service for PDF generation
- [ ] API endpoint: POST /api/reports/generate
  - Input: valuation_id, report_types (array of types)
  - Output: job_id (for async processing)
- [ ] Handle large reports (182 pages) without timeout
- [ ] Quality: proper fonts, formatting, images
- [ ] Performance: <10 sec per single report
- [ ] Watermark support (draft vs final)
- [ ] Page breaks and headers/footers
- **Dependencies**: FT-7.1
- **Acceptance Criteria**:
  - ✅ PDFs generated correctly
  - ✅ Formatting preserved
  - ✅ Performance acceptable
  - ✅ No timeout on large reports

### FT-7.3: Report Storage & Retrieval
**Priority**: P2 | **Effort**: S | **Status**: Ready
- [ ] Create reports table:
  - report_id, valuation_id, report_type, file_path, generated_at, generated_by
- [ ] Store generated PDFs in secure location
- [ ] API:
  - GET /api/valuations/:id/reports (list generated)
  - GET /api/reports/:id/download (retrieve PDF)
  - DELETE /api/reports/:id (soft delete)
  - POST /api/reports/:id/regenerate (regenerate report)
- [ ] Implement access control (owner + assigned advisor only)
- [ ] Generate secure download token
- **Dependencies**: FT-7.2
- **Acceptance Criteria**:
  - ✅ Reports stored securely
  - ✅ List endpoint showing all reports
  - ✅ Download working with token
  - ✅ Regeneration working

### FT-7.4: Report Selection UI (Frontend)
**Priority**: P2 | **Effort**: S | **Status**: Ready
- [ ] Report generation panel (after valuation)
- [ ] Checkboxes for each report type:
  - ☑ VAC One-Pager
  - ☑ Business Profile / CBP
  - ☑ MVA Comprehensive
  - ☑ MPSP Analysis
  - ☑ Action Plan
- [ ] Brief description of each
- [ ] "Generate Selected Reports" button
- [ ] Progress indicator
- [ ] "Download" links once generated
- [ ] "View Report" button (open in browser)
- [ ] Email report option (future)
- **Dependencies**: FT-7.2, FT-7.3
- **Acceptance Criteria**:
  - ✅ Checkboxes working
  - ✅ Generation triggered
  - ✅ Progress shown
  - ✅ Downloads working
  - ✅ Mobile responsive

### FT-7.5: Shareable Report Links
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Generate secure share token (UUID)
- [ ] API: POST /api/reports/:id/share
  - Input: expiration_days (optional, default 30)
  - Output: share_url
- [ ] Share URL: /public/reports/{share_token}
- [ ] Public access (no login required) for 30 days default
- [ ] Expiration enforcement
- [ ] Revoke link option
- [ ] Password protection (optional)
- [ ] Track access logs (who viewed, when)
- **Dependencies**: FT-7.3
- **Acceptance Criteria**:
  - ✅ Share links generating
  - ✅ Tokens secure (long, random)
  - ✅ Expiration working
  - ✅ Access logged
  - ✅ Revocation working

### FT-7.6: Report Customization (Admin)
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Admin panel to customize report branding
  - Logo upload
  - Company name/footer
  - Color scheme
  - Font selection
- [ ] Template variables available for custom text
- [ ] Preview report before generation
- [ ] Save template customizations
- [ ] Per-engagement customization option (future)
- **Dependencies**: FT-7.1, FT-8.x
- **Acceptance Criteria**:
  - ✅ Branding applied to all reports
  - ✅ Settings persisted
  - ✅ Preview accurate
  - ✅ No broken formatting

### FT-7.7: Report Generation Tests
**Priority**: P2 | **Effort**: M | **Status**: Ready
- [ ] Test each report type generates correctly
- [ ] Test PDF quality (formatting, fonts)
- [ ] Test report download
- [ ] Test share link functionality
- [ ] Test expiration enforcement
- [ ] End-to-end: valuation → select reports → generate → download
- [ ] Performance test (large reports <10 sec)
- **Dependencies**: All FT-7.x
- **Acceptance Criteria**:
  - ✅ All 5 report types tested
  - ✅ 80%+ code coverage
  - ✅ Performance benchmarks met
  - ✅ No formatting issues

---

## PHASE 8: Admin Panel & Settings
**Duration**: 2 weeks | **Priority**: P3 - SYSTEM
**Owner**: Frontend Lead

### FT-8.1: Admin Dashboard (Frontend)
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Admin home page with overview
- [ ] Key stats:
  - Total users (by role)
  - Active engagements
  - Valuations completed this week
  - Reports generated
- [ ] Navigation to sections:
  - Questionnaire Management
  - Business & Engagement Management
  - Team Management
  - Settings & Configuration
  - Audit Log Viewer
- [ ] Quick actions (create business, add user, upload multiples)
- [ ] Recent activity feed
- **Dependencies**: FT-1.2
- **Acceptance Criteria**:
  - ✅ Dashboard loads <2 sec
  - ✅ Stats accurate
  - ✅ Navigation working
  - ✅ Admin-only access

### FT-8.2: Questionnaire Management UI (Frontend)
**Priority**: P3 | **Effort**: L | **Status**: Ready
- [ ] Master question set table
  - Display all 24 questions
  - Columns: #, Question, Type, Owner-Visible, Advisor-Only, Optional, Category
  - Edit button for each
- [ ] Question editor modal
  - Edit question text
  - Change field type
  - Set visibility (owner/advisor/optional)
  - Set validation rules
  - Set conditional logic
- [ ] Template management
  - List existing templates
  - Create new template
  - Select questions for template
  - Drag-and-drop reordering
  - Publish version button
- [ ] Version history
  - List previous versions
  - View version details
  - Rollback to previous version (if needed)
- **Dependencies**: FT-2.1, FT-1.2
- **Acceptance Criteria**:
  - ✅ Questions display correctly
  - ✅ Edit functionality working
  - ✅ Templates can be created
  - ✅ Version history showing
  - ✅ Only admin access

### FT-8.3: Settings Management UI (Frontend)
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Settings sections:
  - **Baseline Margins**
    - Pre-Tax Profit Margin: [7.5%]
    - Depreciation (% Revenue): [1.0%]
    - Interest (% Revenue): [1.0%]
    - Discretionary (% Revenue): [2.0%]
  - **Valuation Defaults**
    - Risk weighting default: [0%]
    - Risk adjustment for LOW: [+15%]
    - Risk adjustment for MEDIUM: [0%]
    - Risk adjustment for HIGH: [-25%]
  - **Report Settings**
    - Company logo (upload)
    - Company name in footer
    - Color theme
    - Default font
  - **System**
    - Session timeout
    - Password policy
    - Audit retention days
- [ ] Save & restore defaults buttons
- [ ] Change history (audit trail)
- **Dependencies**: FT-1.2, FT-6.1
- **Acceptance Criteria**:
  - ✅ All settings editable
  - ✅ Changes persisted
  - ✅ Audit logged
  - ✅ Defaults available
  - ✅ Only admin access

### FT-8.4: Industry Multiples Management UI (Frontend)
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Multiples list (table)
  - Columns: NAICS Code, Industry Name, Current Multiple, Updated, Actions
  - Search/filter by NAICS or industry
  - Sortable columns
- [ ] Edit modal
  - Show current multiple
  - Edit field with validation
  - Save button
- [ ] Import CSV button
  - File upload (MultipleData.csv)
  - Validation preview
  - Confirm import button
  - Progress indicator
- [ ] Bulk edit option
  - Apply percentage adjustment to all
  - Example: +5% adjustment to all multiples
- [ ] Version history
  - Show who changed what when
  - Rollback option
- **Dependencies**: FT-6.2, FT-1.2
- **Acceptance Criteria**:
  - ✅ Multiples display in table
  - ✅ Edit functionality working
  - ✅ CSV import working
  - ✅ Validation working
  - ✅ Changes audited

### FT-8.5: User & Team Management UI (Frontend)
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] User list (table)
  - Columns: Name, Email, Role(s), Status, Last Login, Actions
  - Filter by role (owner, advisor, admin)
  - Filter by status (active, inactive)
  - Search by name/email
- [ ] Create user modal
  - Email (required)
  - Name (required)
  - Role(s) checkboxes (owner, advisor, admin)
  - Send welcome email checkbox
  - Create button
- [ ] Edit user modal
  - Change name
  - Change roles
  - Enable/disable status
  - Reset password
- [ ] Assign engagements to advisor
  - Select advisor
  - Multi-select engagements to assign
  - Bulk assign button
- [ ] View advisor assignments
  - List engagements assigned to advisor
  - Unassign option
- [ ] Activity log
  - View user activities (logins, actions)
  - Filter by user, date range
- **Dependencies**: FT-1.2, FT-1.5
- **Acceptance Criteria**:
  - ✅ User list displaying
  - ✅ Create/edit working
  - ✅ Role assignment working
  - ✅ Engagement assignment working
  - ✅ Only admin access

### FT-8.6: Audit Log Viewer (Frontend)
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Audit log table
  - Columns: Timestamp, User, Action, Table, Old Value, New Value, Status
  - Filter by user, table, action, date range
  - Search by value
  - Sortable columns
- [ ] Detail view for each log entry
  - Show complete information
  - Formatted JSON for complex values
- [ ] Export to CSV
  - Date range selection
  - Filter options
  - Generate and download
- [ ] Cannot edit/delete log entries
- [ ] Search/filter functionality
  - Find specific changes by user
  - Find specific tables that changed
  - Find specific date ranges
- **Dependencies**: FT-1.6, FT-1.2
- **Acceptance Criteria**:
  - ✅ Audit logs displaying
  - ✅ Filtering working
  - ✅ Search functional
  - ✅ Export working
  - ✅ No delete capability

### FT-8.7: Business & Engagement Management (Frontend)
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Business list (table)
  - Columns: Company Name, Industry, Owner, # Engagements, Status, Actions
  - Search by company name
  - Filter by industry
  - Click to view detail
- [ ] Business detail page
  - Company information (name, NAICS, location)
  - Owner information
  - Engagement list (all engagements for business)
  - Create new engagement button
  - Edit business button
- [ ] Engagement list (all engagements, not per business)
  - Columns: Company, Status, Owner, Advisor, % Complete, Last Updated, Actions
  - Filter by status
  - Filter by advisor
  - Search by company name
  - Bulk actions: reassign advisor, change status
- [ ] Reassign advisor (bulk)
  - Select engagements
  - Select new advisor
  - Confirm reassignment
  - Audit logged
- **Dependencies**: FT-1.3, FT-1.4, FT-1.2
- **Acceptance Criteria**:
  - ✅ Lists displaying correctly
  - ✅ Filtering working
  - ✅ Search functional
  - ✅ Bulk actions working
  - ✅ Changes audited

### FT-8.8: Admin Panel Tests
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Test all admin page loads
- [ ] Test questionnaire management
- [ ] Test settings updates
- [ ] Test multiples upload
- [ ] Test user management
- [ ] Test audit log viewer
- [ ] Permission tests (non-admin blocked)
- **Dependencies**: All FT-8.x
- **Acceptance Criteria**:
  - ✅ 75%+ code coverage
  - ✅ All tests passing
  - ✅ Permission enforcement verified

---

## PHASE 9: Testing, Refinement & Deployment
**Duration**: 2-3 weeks | **Priority**: P3 - SYSTEM
**Owner**: QA Lead + DevOps

### FT-9.1: Automated Test Suite
**Priority**: P3 | **Effort**: L | **Status**: Ready
- [ ] Unit tests for all calculation logic
- [ ] Unit tests for all APIs
- [ ] Integration tests for workflows
- [ ] End-to-end tests for user journeys:
  - User registers → fills questionnaire → gets valuation → views dashboard
  - Advisor assigns → reviews answers → runs valuation → generates reports
  - Admin creates template → creates engagement → manages settings
- [ ] Test database setup/teardown (fixtures)
- [ ] Test data factories
- [ ] Coverage reporting (target >85%)
- [ ] CI/CD pipeline integration
- **Dependencies**: All implementation phases
- **Acceptance Criteria**:
  - ✅ 85%+ code coverage
  - ✅ All tests passing
  - ✅ CI/CD pipeline running
  - ✅ Tests run on every commit

### FT-9.2: Excel Validation Test Suite
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Load 3-5 provided Excel test files
- [ ] Automated comparison: backend vs Excel
- [ ] Validate ±0.01% accuracy on all calculations
- [ ] Generate validation report
- [ ] Flag any mismatches
- [ ] Regression testing (run after code changes)
- **Dependencies**: FT-6.12
- **Acceptance Criteria**:
  - ✅ All test cases passing
  - ✅ Report generated
  - ✅ Part of CI/CD

### FT-9.3: Performance Testing
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Load testing (concurrent users)
- [ ] API response time benchmarks:
  - GET endpoints: <500ms
  - POST endpoints: <2 sec
  - Calculation endpoints: <1 sec
  - Report generation: <10 sec
- [ ] Database query optimization
- [ ] Stress testing (spike load)
- [ ] Memory profiling
- [ ] Generate performance report
- **Dependencies**: All implementation phases
- **Acceptance Criteria**:
  - ✅ All benchmarks met
  - ✅ No memory leaks
  - ✅ Handles 100+ concurrent users

### FT-9.4: Security Testing
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] OWASP Top 10 testing
- [ ] SQL injection tests
- [ ] XSS protection tests
- [ ] CSRF protection tests
- [ ] Authentication/authorization tests
- [ ] File upload security tests
- [ ] API endpoint permission tests
- [ ] Penetration testing (external contractor optional)
- [ ] Security audit report
- **Dependencies**: All implementation phases
- **Acceptance Criteria**:
  - ✅ No critical vulnerabilities
  - ✅ All tests passing
  - ✅ Security audit completed

### FT-9.5: User Acceptance Testing (UAT)
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] UAT environment setup
- [ ] Test scripts for business scenarios
- [ ] Business user testing (with real business users)
- [ ] Advisor testing (with real advisors)
- [ ] Admin testing (with real admins)
- [ ] Bug report tracking
- [ ] UAT sign-off document
- **Dependencies**: All implementation phases
- **Acceptance Criteria**:
  - ✅ UAT completed
  - ✅ All issues resolved
  - ✅ Sign-off obtained
  - ✅ <5 critical bugs

### FT-9.6: Production Deployment
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] Environment setup (production server)
- [ ] Database migration to production
- [ ] Data initialization (industry multiples, baseline settings)
- [ ] Environment variable configuration
- [ ] SSL/HTTPS setup
- [ ] Backup procedures
- [ ] Monitoring setup (logging, error tracking, uptime)
- [ ] Deployment script/documentation
- [ ] Rollback plan
- [ ] Launch checklist
- **Dependencies**: All implementation phases
- **Acceptance Criteria**:
  - ✅ All services running
  - ✅ Database migrated
  - ✅ Monitoring active
  - ✅ Backups configured
  - ✅ Documentation complete

### FT-9.7: Documentation & Training
**Priority**: P3 | **Effort**: M | **Status**: Ready
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Admin guide (how to manage system)
- [ ] User guide (for business owners)
- [ ] Advisor guide (for advisors)
- [ ] Developer guide (for future maintenance)
- [ ] Operations manual (for DevOps)
- [ ] Video tutorials (optional)
- [ ] Training sessions (admin, advisors)
- **Dependencies**: All implementation phases
- **Acceptance Criteria**:
  - ✅ All docs complete
  - ✅ Training completed
  - ✅ Team confident in operations

### FT-9.8: Post-Launch Support
**Priority**: P3 | **Effort**: S | **Status**: Ready
- [ ] Monitor logs for errors
- [ ] User support (help desk)
- [ ] Bug fix process
- [ ] Performance monitoring
- [ ] Data quality monitoring
- [ ] Weekly checkins first month
- [ ] Monthly health checks thereafter
- **Dependencies**: FT-9.6
- **Acceptance Criteria**:
  - ✅ <2 hour resolution for critical bugs
  - ✅ Uptime >99.5%
  - ✅ User satisfaction >4/5

---

## Summary Statistics

### By Priority
- **P1 (Critical Path)**: 23 tickets (26%)
- **P2 (High Value)**: 44 tickets (51%)
- **P3 (System Features)**: 20 tickets (23%)

### By Effort
- **XS**: 2 tickets
- **S**: 9 tickets
- **M**: 52 tickets
- **L**: 18 tickets
- **XL**: 6 tickets

### By Phase
- **Phase 1**: 7 tickets
- **Phase 2**: 6 tickets
- **Phase 3**: 6 tickets
- **Phase 4**: 7 tickets
- **Phase 5**: 6 tickets
- **Phase 6**: 12 tickets (most complex)
- **Phase 7**: 7 tickets
- **Phase 8**: 8 tickets
- **Phase 9**: 8 tickets

### Total Estimate
- **87 Feature Tickets**
- **27 weeks (6.5 months)**
- **Average: 1.3 FTE**

---

**Status**: ✅ All feature tickets documented with priorities and dependencies
**Next**: Create sprint plan based on Phase 1 kickoff
