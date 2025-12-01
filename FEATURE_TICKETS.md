# Feature Tickets - Business Valuation SaaS MVP

**Total Estimated Effort**: ~110 hours
**Target Timeline**: 2-4 weeks (60-80 hours/week team)
**Priority Levels**: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

---

## WEEK 1: Foundation & Authentication

### TICKET #1.1.1 - JWT Authentication Setup
**Priority**: P0 (Critical)
**Effort**: 2 hours
**Status**: Pending

**Description**:
Implement JWT token generation, validation, and refresh logic. This is the foundation for all authenticated requests.

**Acceptance Criteria**:
- [ ] JWT service created with sign/verify methods
- [ ] Tokens expire after configurable time (default 24h)
- [ ] Refresh token mechanism implemented
- [ ] Token validation middleware created
- [ ] Tokens included in Authorization header
- [ ] Unit tests pass for all scenarios

**Files to Create/Modify**:
- Create: `backend/services/auth.js`
- Modify: `backend/server.js`
- Create: `backend/middleware/auth.js`

**Dependencies**: jsonwebtoken, dotenv

---

### TICKET #1.1.2 - Password Hashing & Security
**Priority**: P0 (Critical)
**Effort**: 1 hour
**Status**: Pending

**Description**:
Implement secure password hashing using bcrypt. Add password validation rules.

**Acceptance Criteria**:
- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] Password strength validation (min 8 chars, complex)
- [ ] Password reset token generation
- [ ] Token expiration (15 minutes)
- [ ] Hash comparison works correctly

**Files to Create/Modify**:
- Modify: `backend/services/auth.js`
- Create: `backend/utils/validators.js`

**Dependencies**: bcryptjs

---

### TICKET #1.1.3 - User Registration Endpoint
**Priority**: P0 (Critical)
**Effort**: 3 hours
**Status**: Pending

**Description**:
Create registration endpoint with validation, email verification, and error handling.

**API Endpoint**:
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "company": "Acme Corp"
}

Response: 201 Created
{
  "user": { "id", "email", "fullName", "company" },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

**Acceptance Criteria**:
- [ ] Email validation & uniqueness check
- [ ] Password strength validation
- [ ] Duplicate email prevention (409 error)
- [ ] Organization auto-created for user
- [ ] User added as organization owner
- [ ] Verification email sent (optional for MVP)
- [ ] JWT tokens returned on success
- [ ] Input validation on all fields
- [ ] Error responses clear and specific

**Files to Create/Modify**:
- Create: `backend/routes/auth.js`
- Modify: `backend/server.js`
- Modify: `backend/models/User.js`

**Dependencies**: express-validator, uuid

---

### TICKET #1.1.4 - User Login Endpoint
**Priority**: P0 (Critical)
**Effort**: 2 hours
**Status**: Pending

**Description**:
Create login endpoint with credentials validation and token generation.

**API Endpoint**:
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "user": { "id", "email", "fullName", "organization" },
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 86400
}
```

**Acceptance Criteria**:
- [ ] Email/password validation
- [ ] Incorrect password returns 401
- [ ] Non-existent email returns 401
- [ ] JWT token generated with correct claims
- [ ] Refresh token returned separately
- [ ] User object returned (no password)
- [ ] Token expiration time included
- [ ] Rate limiting on failed attempts (optional)

**Files to Create/Modify**:
- Add to: `backend/routes/auth.js`
- Modify: `backend/services/auth.js`

---

### TICKET #1.1.5 - Token Refresh Endpoint
**Priority**: P1 (High)
**Effort**: 1.5 hours
**Status**: Pending

**Description**:
Allow users to refresh access token without re-logging in.

**API Endpoint**:
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}

Response: 200 OK
{
  "token": "new_jwt_token",
  "expiresIn": 86400
}
```

**Acceptance Criteria**:
- [ ] Invalid refresh token returns 401
- [ ] Expired refresh token returns 401
- [ ] New access token valid for full duration
- [ ] Old token still valid until expiration
- [ ] Refresh token can be used only once (optional security)

**Files to Create/Modify**:
- Add to: `backend/routes/auth.js`

---

### TICKET #1.1.6 - Logout & Token Invalidation
**Priority**: P2 (Medium)
**Effort**: 1.5 hours
**Status**: Pending

**Description**:
Implement logout functionality. For MVP, can be client-side only (delete tokens). For production, add blacklist.

**API Endpoint**:
```
POST /api/auth/logout
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

**Acceptance Criteria**:
- [ ] Client clears stored tokens
- [ ] Backend can invalidate tokens (optional for MVP)
- [ ] User redirected to login page
- [ ] Subsequent requests with old token fail

**Files to Create/Modify**:
- Add to: `backend/routes/auth.js`
- Modify frontend `AuthContext.js`

---

### TICKET #1.1.7 - Frontend Auth Context
**Priority**: P0 (Critical)
**Effort**: 3 hours
**Status**: Pending

**Description**:
Create React Context for managing authentication state across the app.

**Requirements**:
- Track current user
- Track authentication status
- Provide login/logout/register methods
- Persist tokens to localStorage
- Auto-refresh expired tokens
- Clear state on logout

**Acceptance Criteria**:
- [ ] AuthContext created with proper structure
- [ ] useAuth hook available
- [ ] Tokens persisted in localStorage
- [ ] Tokens cleared on logout
- [ ] Auto-refresh on component mount
- [ ] Protected routes redirect to login
- [ ] User data accessible throughout app

**Files to Create/Modify**:
- Create: `frontend/src/contexts/AuthContext.js`
- Create: `frontend/src/hooks/useAuth.js`
- Modify: `frontend/src/App.js`

---

### TICKET #1.1.8 - Frontend Login & Register Pages
**Priority**: P0 (Critical)
**Effort**: 4 hours
**Status**: Pending

**Description**:
Create responsive login and registration pages with form validation.

**Pages**:
1. Login page (`/login`)
   - Email & password fields
   - "Remember me" option
   - "Forgot password" link
   - Register link
   - Loading state during auth
   - Error message display

2. Register page (`/register`)
   - Email, password, full name, company fields
   - Password strength indicator
   - Terms & conditions checkbox
   - Login link
   - Success message → redirect to login

**Acceptance Criteria**:
- [ ] Forms validate on submit
- [ ] Email format validated
- [ ] Password strength shown
- [ ] Submit button disabled during loading
- [ ] Error messages display clearly
- [ ] Mobile responsive (single column on mobile)
- [ ] Keyboard navigation works
- [ ] Error handling for API failures

**Files to Create/Modify**:
- Create: `frontend/src/pages/Login.js`
- Create: `frontend/src/pages/Register.js`
- Create: `frontend/src/pages/Auth.css`
- Modify: `frontend/src/App.js` (routing)

---

### TICKET #1.2.1 - Expand Users Table
**Priority**: P0 (Critical)
**Effort**: 2 hours
**Status**: Pending

**Description**:
Expand users table with authentication and profile fields.

**Database Migration**:
```sql
ALTER TABLE users ADD COLUMN (
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, inactive, suspended
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);
```

**Acceptance Criteria**:
- [ ] Migration runs without errors
- [ ] All new fields accept data
- [ ] Email uniqueness enforced
- [ ] Existing data preserved
- [ ] Can rollback migration
- [ ] Tests pass with new schema

**Files to Create/Modify**:
- Create: `backend/migrations/001_expand_users_table.js`
- Modify: `backend/db.js` (migration runner)

---

### TICKET #1.2.2 - Create Organizations Table
**Priority**: P0 (Critical)
**Effort**: 2 hours
**Status**: Pending

**Description**:
Create organizations table for multi-user support and team management.

**Database Migration**:
```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  subscription_tier TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX idx_org_owner ON organizations(owner_id);
```

**Acceptance Criteria**:
- [ ] Table created with proper schema
- [ ] Foreign key to users table
- [ ] Indexes created for performance
- [ ] Sample data can be inserted
- [ ] Rollback supported

**Files to Create/Modify**:
- Create: `backend/migrations/002_create_organizations_table.js`

---

### TICKET #1.2.3 - Create Organization Members Table
**Priority**: P0 (Critical)
**Effort**: 2 hours
**Status**: Pending

**Description**:
Create organization members table for role-based access control.

**Database Migration**:
```sql
CREATE TABLE organization_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'viewer', -- owner, admin, editor, viewer
  status TEXT DEFAULT 'active',
  invited_by TEXT,
  invited_at DATETIME,
  accepted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id),
  FOREIGN KEY(organization_id) REFERENCES organizations(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(invited_by) REFERENCES users(id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

**Acceptance Criteria**:
- [ ] Table created with proper schema
- [ ] Role enumeration enforced (in code)
- [ ] Unique constraint on (org_id, user_id)
- [ ] Foreign keys properly configured
- [ ] Indexes for fast lookups

**Files to Create/Modify**:
- Create: `backend/migrations/003_create_organization_members_table.js`

---

### TICKET #1.2.4 - Expand Valuations Table
**Priority**: P0 (Critical)
**Effort**: 1.5 hours
**Status**: Pending

**Description**:
Expand valuations table with organization and sharing fields.

**Database Migration**:
```sql
ALTER TABLE valuations ADD COLUMN (
  organization_id TEXT,
  status TEXT DEFAULT 'draft', -- draft, submitted, shared, archived
  shared_token TEXT UNIQUE,
  shared_by TEXT,
  shared_at DATETIME,
  expires_at DATETIME,
  FOREIGN KEY(organization_id) REFERENCES organizations(id),
  FOREIGN KEY(shared_by) REFERENCES users(id)
);

CREATE INDEX idx_val_org ON valuations(organization_id);
CREATE INDEX idx_val_shared_token ON valuations(shared_token);
```

**Acceptance Criteria**:
- [ ] New columns added
- [ ] Foreign keys established
- [ ] Indexes created
- [ ] Existing valuations migrated to default org
- [ ] Rollback works

**Files to Create/Modify**:
- Create: `backend/migrations/004_expand_valuations_table.js`

---

### TICKET #1.2.5 - Create Audit Logs Table
**Priority**: P2 (Medium)
**Effort**: 1 hour
**Status**: Pending

**Description**:
Create audit logs table for compliance and debugging.

**Database Migration**:
```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  organization_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT, -- user, valuation, org, etc.
  entity_id TEXT,
  changes TEXT, -- JSON of what changed
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

**Acceptance Criteria**:
- [ ] Table created
- [ ] All indexes added
- [ ] Sample logs can be inserted
- [ ] Date filtering works

**Files to Create/Modify**:
- Create: `backend/migrations/005_create_audit_logs_table.js`

---

### TICKET #1.2.6 - Migration Runner & Database Initialization
**Priority**: P0 (Critical)
**Effort**: 2 hours
**Status**: Pending

**Description**:
Create database migration runner that executes migrations on app startup.

**Requirements**:
- Auto-run migrations on server start
- Track which migrations have been run
- Support rollback (optional for MVP)
- Error handling

**Implementation**:
```
backend/migrations/
├── migrations.json (tracks applied migrations)
├── 001_expand_users_table.js
├── 002_create_organizations_table.js
├── 003_create_organization_members_table.js
├── 004_expand_valuations_table.js
└── 005_create_audit_logs_table.js
```

**Acceptance Criteria**:
- [ ] Migrations run automatically on startup
- [ ] Migration history tracked
- [ ] Idempotent (can run multiple times safely)
- [ ] Errors logged and reported
- [ ] Database backup created before migrations
- [ ] Tests pass with new schema

**Files to Create/Modify**:
- Create: `backend/utils/migrations.js`
- Modify: `backend/db.js`
- Modify: `backend/server.js`

---

### TICKET #1.3.1 - Risk Scoring Algorithm
**Priority**: P1 (High)
**Effort**: 4 hours
**Status**: Pending

**Description**:
Implement comprehensive risk scoring algorithm with 5 categories.

**Risk Categories**:
1. **Financial Risk** (25% weight)
   - Cash flow analysis
   - Debt levels
   - Margin stability
   - Growth consistency

2. **Operational Risk** (20% weight)
   - Process maturity
   - System reliability
   - Scalability
   - Key person dependency

3. **Market Risk** (20% weight)
   - Industry trends
   - Competition
   - Customer concentration
   - Market size

4. **Management Risk** (20% weight)
   - Experience
   - Succession planning
   - Track record
   - Team depth

5. **Compliance Risk** (15% weight)
   - Regulatory compliance
   - Legal issues
   - Insurance coverage
   - Certifications

**Score Calculation**:
```javascript
overallScore = (
  financial_score * 0.25 +
  operational_score * 0.20 +
  market_score * 0.20 +
  management_score * 0.20 +
  compliance_score * 0.15
)

// Convert to letter grade
A: 80-100
B: 60-79
C: 40-59
D: 20-39
F: 0-19
```

**Acceptance Criteria**:
- [ ] All 5 categories calculated correctly
- [ ] Weights sum to 100%
- [ ] Score between 0-100
- [ ] Grade assignment accurate
- [ ] Unit tests pass all scenarios
- [ ] Extreme cases handled (excellent/poor companies)

**Files to Create/Modify**:
- Modify: `backend/services/valuationEngine.js`
- Create: `backend/services/riskAnalyzer.js`
- Add: `backend/tests/riskAnalyzer.test.js`

---

### TICKET #1.3.2 - Multiple Valuation Methods
**Priority**: P1 (High)
**Effort**: 5 hours
**Status**: Pending

**Description**:
Implement three valuation methods for comprehensive analysis.

**Methods**:

1. **EBITDA Multiple** (Primary)
   ```
   Valuation = EBITDA × Industry Multiple × Adjustments
   Already implemented, refine with better benchmarks
   ```

2. **Revenue Multiple** (Secondary)
   ```
   Valuation = Revenue × Industry Multiple × Adjustments
   Tech/SaaS: 3-8x
   Retail: 0.5-2x
   Services: 1-4x
   Manufacturing: 0.5-2x
   ```

3. **DCF (Discounted Cash Flow)** (Secondary)
   ```
   - Project 5-year free cash flows
   - Apply discount rate (based on risk score)
   - Terminal value calculation
   - Discount to present value
   ```

**Output Structure**:
```javascript
{
  methods: {
    primary: {
      name: "EBITDA Multiple",
      value: 5000000,
      multiple: 8.5,
      baseMetric: 588235,
      adjustments: {...}
    },
    secondary: [
      {
        name: "Revenue Multiple",
        value: 4800000,
        multiple: 2.4,
        baseMetric: 2000000
      },
      {
        name: "DCF",
        value: 5200000,
        discountRate: 0.12
      }
    ],
    recommended: 5000000,
    range: { low: 4800000, high: 5200000 }
  }
}
```

**Acceptance Criteria**:
- [ ] EBITDA method produces correct valuation
- [ ] Revenue multiple method produces reasonable results
- [ ] DCF calculations accurate
- [ ] Range captures all three methods
- [ ] Recommended value is reasonable (primary or average)
- [ ] Unit tests for each method
- [ ] Extreme case handling (negative cash flow, etc.)

**Files to Create/Modify**:
- Modify: `backend/services/valuationEngine.js`
- Update: `backend/tests/valuationEngine.test.js`

---

### TICKET #1.3.3 - Improved Benchmark Data
**Priority**: P1 (High)
**Effort**: 3 hours
**Status**: Pending

**Description**:
Expand industry benchmarks with more sectors and better data structure.

**Current Benchmarks** (4 sectors):
- Tech: EBITDA 12x
- Retail: EBITDA 6x
- Services: EBITDA 7x
- Manufacturing: EBITDA 8x

**Enhanced Benchmarks** (add):
- Healthcare: 10-12x EBITDA
- Financial Services: 8-10x EBITDA
- Real Estate: 4-6x EBITDA
- Hospitality: 5-7x EBITDA
- Construction: 4-6x EBITDA
- Logistics: 6-8x EBITDA
- Software/SaaS: 10-15x EBITDA
- etc.

**Data Structure**:
```javascript
const benchmarks = {
  tech: {
    name: "Technology / Software",
    ebitdaMultiple: { min: 10, avg: 12, max: 15 },
    revenueMultiple: { min: 3, avg: 5, max: 8 },
    growthRate: 0.20,
    profitMargin: 0.25,
    customerRetention: 0.90,
    riskScore: 70,
    // ... more metrics
  },
  // ... other industries
}
```

**Acceptance Criteria**:
- [ ] At least 10 industries included
- [ ] Min/avg/max multiples defined
- [ ] Growth and margin benchmarks included
- [ ] Risk scores for each industry
- [ ] Easy to add more industries
- [ ] Benchmarks used in comparisons

**Files to Create/Modify**:
- Modify: `backend/services/valuationEngine.js` (benchmarks object)
- Create: `backend/data/benchmarks.json` (optional, for easier updates)

---

### TICKET #1.3.4 - Enhanced Valuation Output
**Priority**: P1 (High)
**Effort**: 3 hours
**Status**: Pending

**Description**:
Update valuation output to include risk analysis and multiple methods.

**Output Schema**:
```javascript
{
  id: "val_123",
  valuation: {
    primary: { method: "EBITDA Multiple", value: 5000000 },
    secondary: [...],
    recommended: 5000000,
    range: { low, high }
  },
  riskAnalysis: {
    overallScore: 72,
    grade: "B",
    categories: {
      financial: { score: 65, label: "Medium-High Risk" },
      operational: { score: 78, label: "Low-Medium Risk" },
      market: { score: 70, label: "Medium Risk" },
      management: { score: 75, label: "Low Risk" },
      compliance: { score: 80, label: "Low Risk" }
    },
    topRisks: [
      { category: "Financial", issue: "High debt ratio", impact: "High" },
      ...
    ]
  },
  drivers: [...], // Value drivers
  gaps: [...],    // Performance gaps
  suggestions: [...], // Improvement suggestions
  metadata: {
    calculatedAt: "2025-11-17T10:30:00Z",
    basedOnData: {...}
  }
}
```

**Acceptance Criteria**:
- [ ] Output includes all fields above
- [ ] Risk analysis section complete
- [ ] Multiple methods present
- [ ] Grade based on risk score
- [ ] Top risks identified
- [ ] Format compatible with dashboard & reports

**Files to Create/Modify**:
- Modify: `backend/services/valuationEngine.js`
- Update: `backend/tests/valuationEngine.test.js`

---

### TICKET #1.3.5 - Valuation Engine Tests
**Priority**: P1 (High)
**Effort**: 4 hours
**Status**: Pending

**Description**:
Comprehensive unit tests for valuation engine covering all scenarios.

**Test Scenarios**:
1. Basic valuation (single method)
2. All three methods produce reasonable results
3. Risk scoring accurate
4. Grade assignment correct
5. Edge cases (negative EBITDA, startup, mature company)
6. Industry-specific calculations
7. Adjustment factors applied correctly
8. Output format validation

**Test Cases** (minimum 20 tests):
```javascript
describe('Valuation Engine', () => {
  // EBITDA Multiple tests
  test('calculates EBITDA valuation correctly')
  test('applies growth adjustment')
  test('applies margin adjustment')
  // ... more tests

  // Risk Scoring tests
  test('calculates overall risk score')
  test('assigns correct grade')
  test('identifies top risks')
  // ... more tests

  // Edge Cases
  test('handles negative EBITDA')
  test('handles startup with no history')
  test('handles mature stable company')
})
```

**Acceptance Criteria**:
- [ ] 20+ unit tests written
- [ ] All tests pass
- [ ] >80% code coverage for valuation engine
- [ ] Tests document expected behavior
- [ ] Edge cases covered

**Files to Create/Modify**:
- Create/Update: `backend/tests/valuationEngine.test.js`
- Create/Update: `backend/tests/riskAnalyzer.test.js`

---

## Week 1 Summary Ticket

### TICKET #1.99 - Week 1 Integration & Testing
**Priority**: P0 (Critical)
**Effort**: 4 hours
**Status**: Pending

**Description**:
Integrate all Week 1 components and run full system tests.

**Integration Tasks**:
- [ ] All migrations run successfully
- [ ] Users can register & login
- [ ] Auth context works throughout app
- [ ] Protected routes enforce authentication
- [ ] User data isolated by organization
- [ ] Valuation engine works with new auth
- [ ] All API endpoints secured
- [ ] No console errors

**Testing**:
- [ ] Register new user
- [ ] Login with credentials
- [ ] Logout and verify redirect
- [ ] Create valuation (authenticated)
- [ ] Verify data belongs to correct org
- [ ] Run full test suite
- [ ] Check for security issues

**Files to Review**:
- Frontend routing
- Backend middleware
- Database migrations
- API security

---

## Summary: Week 1 Effort Breakdown

| Category | Tickets | Hours | Owner |
|----------|---------|-------|-------|
| **Authentication** | 1.1.1 - 1.1.7 | 15 | Backend |
| **Database** | 1.2.1 - 1.2.6 | 11 | Backend |
| **Valuation Engine** | 1.3.1 - 1.3.5 | 20 | Backend |
| **Frontend Auth** | 1.1.8 | 4 | Frontend |
| **Integration** | 1.99 | 4 | Full Team |
| **TOTAL WEEK 1** | | **54 hours** | |

**If team velocity is 60-80 hours/week**, Week 1 should complete on time.

---

## WEEK 2: Core Features

(Detailed tickets follow same format as Week 1)

### P2.1 - PDF Report Generation (14 hours)
- 2.1.1: Report template design
- 2.1.2: HTML to PDF conversion
- 2.1.3: Lite version generation
- 2.1.4: Standard version generation
- 2.1.5: Premium version generation
- 2.1.6: Frontend download button
- 2.1.7: Report customization/branding

### P2.2 - Working Capital Calculator (10 hours)
- 2.2.1: Input form component
- 2.2.2: Calculation functions
- 2.2.3: Valuation integration
- 2.2.4: Dashboard display
- 2.2.5: Working capital analysis endpoint

### P2.3 - Deal Analysis Module (12 hours)
- 2.3.1: Offer input form
- 2.3.2: Deal calculations
- 2.3.3: Multiple offer comparison
- 2.3.4: Tax impact analysis
- 2.3.5: API endpoints
- 2.3.6: Dashboard integration

**Week 2 Total**: ~36 hours

---

## WEEK 3: Analytics & Polish

### P3.1 - Analytics Dashboard (10 hours)
- 3.1.1: Chart components
- 3.1.2: Analytics data endpoints
- 3.1.3: Trend analysis
- 3.1.4: Export functionality
- 3.1.5: Dashboard UI

### P3.2 - Risk Assessment (8 hours)
- 3.2.1: Risk visualization components
- 3.2.2: Risk trends
- 3.2.3: Mitigation recommendations
- 3.2.4: Risk report section

### P3.3 - SaaS Infrastructure (10 hours)
- 3.3.1: Admin dashboard
- 3.3.2: User management
- 3.3.3: Pricing tier enforcement
- 3.3.4: Usage tracking
- 3.3.5: Email notifications

**Week 3 Total**: ~28 hours

---

## Total MVP Effort Summary

| Week | Focus | Hours | Status |
|------|-------|-------|--------|
| **Week 1** | Foundation & Auth | 54 | Detailed |
| **Week 2** | Core Features | 36 | TBD |
| **Week 3** | Analytics & Polish | 28 | TBD |
| **Contingency** | Bug fixes, refinement | 10-20 | TBD |
| **TOTAL** | | **~120 hours** | |

**Team Allocation** (assuming 2-person team):
- **Backend Developer**: 70 hours
- **Frontend Developer**: 50 hours
- **Shared**: 20 hours (testing, integration, docs)

**Timeline**:
- 1-person team: 4-5 weeks (60 hrs/week)
- 2-person team: 2-3 weeks (60 hrs/week each)
- 3-person team: 2 weeks (40 hrs/week each)

---

## GitHub Issue Template

Use this template when creating GitHub issues from these tickets:

```markdown
## [Feature Name]

**Epic**: [Week 1/2/3]
**Priority**: [P0/P1/P2/P3]
**Effort**: [X hours]
**Assignee**: @username

### Description
[Detailed description from ticket]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] ...

### Files to Create/Modify
- Create: `path/to/file.js`
- Modify: `path/to/file.js`

### Dependencies
- package-name@version

### Testing
[Testing instructions]

### Notes
[Any additional notes]
```

---

## Usage Instructions

1. **For Project Management**:
   - Copy tickets into your project management tool (GitHub Issues, Jira, Azure DevOps, etc.)
   - Assign developers
   - Update status as work progresses

2. **For Development**:
   - Read full ticket before starting
   - Check all acceptance criteria
   - Review files to modify
   - Install dependencies
   - Create feature branch
   - Write tests
   - Submit PR

3. **For Tracking**:
   - Mark ticket "In Progress" when starting
   - Move to "Review" when complete
   - Move to "Done" after approval
   - Update effort if estimates were off

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Status**: Ready for Implementation
