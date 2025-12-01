# Enhanced Business Valuation Tool - Development Plan

**Project Goal**: Build a comprehensive, sellable SaaS valuation platform with multi-user support, advanced analytics, and professional reports in 2-4 weeks.

**Target Audience**: Business advisors, M&A professionals, business owners (similar to MVA tool users)

---

## Overview of Solution Architecture

### Current State
- ✅ Basic valuation engine (EBITDA × multiple)
- ✅ 5-step wizard for data entry
- ✅ Interactive dashboard
- ✅ SQLite persistence
- ✅ Single-user (session-based) UI

### Enhanced State (2-4 weeks)
- 🔐 User authentication (JWT + registration)
- 💼 Multi-user support with data isolation
- 📊 Advanced analytics & visualizations
- 📄 Professional PDF/HTML reports
- 💰 Working capital calculator
- 📈 Deal analysis tools
- 🎯 Risk assessment scoring
- 📱 Responsive SaaS dashboard

---

## Development Phases (2-4 Week MVP)

### Phase 1: Foundation & Authentication (Week 1)
**Focus**: Build the technical foundation for a multi-user SaaS platform

#### P1.1 - User Authentication System
- [ ] Implement JWT-based authentication
- [ ] Add user registration endpoint
- [ ] Add user login endpoint
- [ ] Add password hashing (bcrypt)
- [ ] Create password reset flow
- [ ] Add session management
- [ ] Frontend login/registration pages
- [ ] Protected routes/middleware

#### P1.2 - Database Schema Expansion
- [ ] Expand users table (password, email, profile data)
- [ ] Create organization/team table (for multi-user support)
- [ ] Update valuations table (add permissions, sharing)
- [ ] Add audit log table
- [ ] Add user preferences table
- [ ] Add report templates table
- [ ] Create migrations system

#### P1.3 - Enhanced Valuation Engine
- [ ] Add risk scoring algorithm
- [ ] Implement detailed financial analysis metrics
- [ ] Add industry risk factors
- [ ] Create scoring/rating system (A, B, C grade)
- [ ] Add multiple valuation methods (DCF, market comp, etc.)
- [ ] Improve benchmark data structure

---

### Phase 2: Advanced Features (Week 2)
**Focus**: Add high-value features that justify premium pricing

#### P2.1 - PDF Report Generation
- [ ] Design report templates (Lite, Standard, Premium)
- [ ] Implement backend PDF generation (Puppeteer/Node)
- [ ] Create PDF export endpoint
- [ ] Design professional report layout
- [ ] Add cover page, executive summary, detailed analysis
- [ ] Add charts/visualizations to PDF
- [ ] Implement branded reports (client customization)
- [ ] Download endpoint

#### P2.2 - Working Capital Calculator
- [ ] Add working capital input form
- [ ] Implement working capital calculations
- [ ] Calculate ARD, AP period, inventory days
- [ ] Compute net operating working capital (NOWC)
- [ ] Add working capital trends
- [ ] Integrate with valuation (working capital adjustments)
- [ ] Add working capital analysis dashboard

#### P2.3 - Deal Analysis Module
- [ ] Create offer analysis form
- [ ] Implement deal structure calculator
- [ ] Calculate seller proceeds
- [ ] Add earnout/seller financing analysis
- [ ] Tax impact calculations
- [ ] Compare multiple offers
- [ ] Add negotiation scenarios

#### P2.4 - Shareable Report Links
- [ ] Generate secure tokens
- [ ] Create public view endpoint
- [ ] Implement link expiration
- [ ] Add access controls
- [ ] Create shared dashboard (read-only)
- [ ] Track who accessed the report

---

### Phase 3: Analytics & Polish (Week 3-4)
**Focus**: Add compelling analytics and professional UI/UX

#### P3.1 - Advanced Analytics & Dashboards
- [ ] Add historical trend charts
- [ ] Implement industry comparison visualizations
- [ ] Create performance heatmaps
- [ ] Add scenario analysis tool
- [ ] Build analytics dashboard
- [ ] Add key metrics summary
- [ ] Export analysis to CSV/Excel
- [ ] Add data filtering and drill-down

#### P3.2 - Risk Assessment & Scoring
- [ ] Implement comprehensive risk scoring
- [ ] Add risk categories (operational, financial, market, etc.)
- [ ] Create risk heatmap visualization
- [ ] Risk improvement recommendations
- [ ] Risk trend tracking
- [ ] Add compliance/regulatory risk factors
- [ ] Risk reporting

#### P3.3 - SaaS Features
- [ ] Admin dashboard for managing users/organizations
- [ ] Pricing tiers implementation
- [ ] Usage tracking/analytics
- [ ] Email notifications (report ready, sharing, etc.)
- [ ] API documentation
- [ ] Integration hooks
- [ ] Subscription management

#### P3.4 - Performance & Deployment
- [ ] Migrate SQLite to PostgreSQL (production)
- [ ] Implement caching layer (Redis)
- [ ] Optimize database queries
- [ ] Add search/filtering
- [ ] Performance testing
- [ ] Security hardening
- [ ] Docker compose for production
- [ ] CI/CD pipeline (GitHub Actions)

---

## Detailed Feature Tickets

### TICKET P1.1: User Authentication System

**Objective**: Implement JWT-based authentication for multi-user support

**Requirements**:
1. User registration with email validation
2. Secure login with JWT token generation
3. Password hashing (bcrypt)
4. Token refresh mechanism
5. Logout functionality
6. Password reset flow
7. Email verification

**Frontend Changes**:
- New `Login.js` component with email/password form
- New `Register.js` component with validation
- Auth context for managing current user
- Protected routes (redirect to login if not authenticated)
- Token storage (localStorage with secure option)
- API interceptor to add token to requests

**Backend Changes**:
- New `auth.js` service (JWT operations, bcrypt)
- New API endpoints:
  - `POST /api/auth/register` - Create account
  - `POST /api/auth/login` - Login with credentials
  - `POST /api/auth/refresh` - Refresh JWT token
  - `POST /api/auth/logout` - Invalidate token
  - `POST /api/auth/reset-password` - Password reset request
- Database migrations for password hashing

**Database Changes**:
- Expand `users` table:
  - `email` (UNIQUE)
  - `password_hash`
  - `full_name`
  - `company`
  - `phone`
  - `verified` (boolean)
  - `verification_token`
  - `reset_token`
  - `reset_token_expires`
  - `status` (active/inactive)

**Acceptance Criteria**:
- [ ] User can register with valid email
- [ ] User can login with correct credentials
- [ ] Invalid credentials return 401
- [ ] JWT token is returned on successful login
- [ ] Token is validated on subsequent requests
- [ ] Protected endpoints return 401 if no token
- [ ] Password reset email sent
- [ ] Password successfully reset
- [ ] Token refresh works without re-login

**Estimated Effort**: 8 hours

---

### TICKET P1.2: Database Schema Expansion

**Objective**: Expand database to support multi-user, organizations, permissions, and audit logging

**Requirements**:
1. User-to-organization relationships
2. Role-based access control (RBAC)
3. Audit trail for compliance
4. User preferences and settings
5. Report template management

**Database Tables to Create/Modify**:

```sql
-- Expand users table
ALTER TABLE users ADD COLUMN (
  email TEXT UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'active',
  preferences TEXT -- JSON
);

-- Organizations (teams/companies)
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

-- Organization members
CREATE TABLE organization_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'viewer', -- owner, admin, editor, viewer
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id),
  FOREIGN KEY(organization_id) REFERENCES organizations(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Expand valuations table
ALTER TABLE valuations ADD COLUMN (
  organization_id TEXT,
  status TEXT DEFAULT 'draft', -- draft, submitted, shared
  shared_token TEXT,
  expires_at DATETIME,
  FOREIGN KEY(organization_id) REFERENCES organizations(id)
);

-- Audit logs
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Report templates
CREATE TABLE report_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  name TEXT NOT NULL,
  template_data TEXT, -- JSON
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(organization_id) REFERENCES organizations(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

-- User preferences
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'light',
  currency TEXT DEFAULT 'USD',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  notifications_enabled BOOLEAN DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Migration Strategy**:
- Create migration files (timestamp-based)
- Add migration runner to server startup
- Backup existing data before migrations
- Support rollback

**Acceptance Criteria**:
- [ ] All new tables created successfully
- [ ] Relationships and foreign keys established
- [ ] Indexes added for performance
- [ ] Sample data loads correctly
- [ ] Migrations can be rolled back

**Estimated Effort**: 6 hours

---

### TICKET P1.3: Enhanced Valuation Engine

**Objective**: Expand valuation engine with risk scoring, multiple methods, and deeper analysis

**Current Engine**: EBITDA × Multiple + adjustments

**Enhancement Requirements**:

1. **Risk Scoring Algorithm** (0-100 scale)
   - Financial risk (10%)
   - Operational risk (25%)
   - Market risk (20%)
   - Management risk (20%)
   - Compliance risk (25%)

2. **Financial Analysis Metrics**
   - Trend analysis (3-year EBITDA, revenue, margin trends)
   - Sustainability metrics
   - Cash conversion analysis
   - Capital efficiency

3. **Industry Risk Factors**
   - Regulatory risk by industry
   - Cyclicality factors
   - Competition level
   - Supplier concentration

4. **Valuation Methods**
   - Primary: EBITDA × Multiple (current)
   - Secondary: Revenue × Multiple
   - Secondary: DCF analysis
   - Market comparable method

5. **Scoring/Rating System**
   - Grade: A, B, C (based on risk score + metrics)
   - Display on dashboard
   - Impact on valuation multiple

**Backend Changes**:
- Expand `valuationEngine.js`:
  - `calculateRiskScore(data)` function
  - `calculateMultipleValuation(data)` function
  - `calculateRevenueValuation(data)` function
  - `calculateDCFValuation(data)` function
  - `calculateCompRiskAdjustment(data)` function
  - `generateRiskAnalysis()` function

**Output Structure**:
```javascript
{
  valuation: {
    primaryMethod: { method: 'EBITDA Multiple', value: 5000000 },
    secondaryMethods: [
      { method: 'Revenue Multiple', value: 4800000 },
      { method: 'DCF', value: 5200000 }
    ],
    recommended: 5000000
  },
  riskAnalysis: {
    overallScore: 72,
    grade: 'B',
    categories: {
      financial: { score: 65, factors: [...] },
      operational: { score: 78, factors: [...] },
      market: { score: 70, factors: [...] },
      management: { score: 75, factors: [...] },
      compliance: { score: 80, factors: [...] }
    }
  },
  drivers: [...],
  gaps: [...],
  suggestions: [...]
}
```

**Acceptance Criteria**:
- [ ] Risk score calculated accurately
- [ ] Multiple valuation methods produce reasonable results
- [ ] Rating system matches risk score
- [ ] Output includes all required analysis fields
- [ ] Unit tests pass for all scenarios

**Estimated Effort**: 12 hours

---

### TICKET P2.1: PDF Report Generation

**Objective**: Generate professional, branded PDF reports in Lite, Standard, and Premium versions

**Requirements**:

1. **Report Versions**:
   - Lite (20-30 pages): Valuation + key metrics + suggestions
   - Standard (50-80 pages): Lite + detailed analysis + charts
   - Premium (150+ pages): Everything + financial deep-dive + risk analysis

2. **Report Sections**:
   - Cover page (customizable branding)
   - Executive summary
   - Company overview
   - Financial analysis
   - Valuation methodology & results
   - Value drivers
   - Performance gaps & benchmarks
   - Risk assessment (for Standard+)
   - Improvement recommendations
   - Appendices (detailed financials)

3. **Visual Elements**:
   - Valuation comparison chart
   - Industry benchmark comparison
   - Risk heatmap
   - Trend lines
   - Key metrics dashboard

**Technology Choice**:
- **Puppeteer**: Open source, node-based, good for complex layouts
- Alternative: ReportLab (Python) or PDFKit

**Implementation**:

Backend:
- `pdf-generator.js` service with template engine
- HTML templates for each version
- Chart generation (using Chart.js or similar)
- Branding/logo injection
- New endpoint: `POST /api/valuations/:valuationId/reports/pdf`

Frontend:
- Add "Export PDF" button on Dashboard
- Select report version (Lite/Standard/Premium)
- Loading state during generation
- Download file automatically

**Acceptance Criteria**:
- [ ] Lite PDF generates in <5 seconds
- [ ] PDF includes all required sections
- [ ] Branding/logo displays correctly
- [ ] Charts render properly
- [ ] Currency/numbers format correctly
- [ ] File downloads with correct name
- [ ] Premium version includes risk analysis

**Estimated Effort**: 14 hours

---

### TICKET P2.2: Working Capital Calculator

**Objective**: Implement working capital analysis (Monty Walker methodology as referenced in MVA)

**Requirements**:

1. **Working Capital Input Form**
   - Accounts Receivable Days (ARD)
   - Accounts Payable Days (APD)
   - Inventory Days
   - Prepaid expenses & accruals

2. **Working Capital Calculations**
   - Current assets & liabilities
   - Net operating working capital (NOWC)
   - Working capital as % of revenue
   - Cash conversion cycle

3. **Analysis & Visualization**
   - Industry benchmark comparison
   - Trend analysis (if multiple years)
   - Impact on valuation (working capital adjustment)
   - Improvement recommendations

4. **Integration with Valuation**
   - Include working capital in valuation formula
   - Adjust valuation based on working capital levels
   - Display impact in results

**Database Changes**:
```sql
CREATE TABLE working_capital_data (
  id TEXT PRIMARY KEY,
  valuation_id TEXT NOT NULL,
  ar_days DECIMAL,
  ap_days DECIMAL,
  inventory_days DECIMAL,
  prepaid_expenses DECIMAL,
  current_assets DECIMAL,
  current_liabilities DECIMAL,
  created_at DATETIME,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id)
);
```

**Frontend Changes**:
- New `WorkingCapitalCalculator.js` component
- Add to Wizard as optional step 4a
- Display on Dashboard as new card
- Show trend chart if multiple periods available

**API Changes**:
- `POST /api/valuations/:valuationId/working-capital`
- `PUT /api/valuations/:valuationId/working-capital`

**Acceptance Criteria**:
- [ ] Working capital form validates correctly
- [ ] Calculations match Monty Walker methodology
- [ ] Results display on dashboard
- [ ] Working capital impacts valuation
- [ ] Benchmark comparison shows
- [ ] Trend analysis works with historical data

**Estimated Effort**: 10 hours

---

### TICKET P2.3: Deal Analysis Module

**Objective**: Add deal structuring and offer analysis capabilities

**Requirements**:

1. **Offer Analysis Form**
   - Purchase price
   - Terms (cash, seller note, earnout)
   - Earn-out metrics & conditions
   - Seller financing (if applicable)
   - Transaction costs
   - Tax impact

2. **Calculations**
   - Seller net proceeds
   - After-tax proceeds
   - Payment timeline
   - IRR analysis
   - Multiple on invested capital (MOIC)

3. **Scenario Comparison**
   - Compare multiple offers side-by-side
   - Run sensitivity analysis
   - Show best/worst case scenarios

4. **Output**
   - Deal summary
   - Cash flow timeline
   - Tax impact analysis
   - Recommendation

**Database Changes**:
```sql
CREATE TABLE offer_analysis (
  id TEXT PRIMARY KEY,
  valuation_id TEXT NOT NULL,
  name TEXT,
  purchase_price DECIMAL,
  cash_portion DECIMAL,
  seller_note DECIMAL,
  note_rate DECIMAL,
  note_term INT,
  earnout_amount DECIMAL,
  earnout_metrics TEXT, -- JSON
  estimated_costs DECIMAL,
  created_at DATETIME,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id)
);
```

**Frontend Components**:
- `OfferAnalysis.js` - Input form
- `OfferComparison.js` - Compare offers
- Integrate into Dashboard

**API Endpoints**:
- `POST /api/valuations/:valuationId/offers`
- `GET /api/valuations/:valuationId/offers`
- `PUT /api/valuations/:valuationId/offers/:offerId`
- `DELETE /api/valuations/:valuationId/offers/:offerId`

**Acceptance Criteria**:
- [ ] Offer form validates and calculates
- [ ] After-tax proceeds calculated correctly
- [ ] Multiple offers can be compared
- [ ] Tax impact analysis reasonable
- [ ] Earnout scenarios analyzed
- [ ] Results display on dashboard

**Estimated Effort**: 12 hours

---

### TICKET P3.1: Advanced Analytics & Dashboards

**Objective**: Build analytics dashboard with charts, trends, and drill-down capabilities

**Requirements**:

1. **Visualization Components**
   - Valuation trend (over time)
   - Industry comparison chart
   - Performance gap visualization
   - Risk heatmap
   - Financial metrics dashboard
   - Scenario analysis results

2. **Analytics Dashboard**
   - Key metrics summary
   - Latest valuation
   - Total improvement potential
   - Risk score trend
   - Document usage statistics

3. **Data Export**
   - Export to CSV
   - Export to Excel (.xlsx)
   - Export historical data
   - Custom date range

4. **Filtering & Drill-Down**
   - Filter by date range
   - Filter by metric
   - Click to drill into details
   - Customizable views

**Technology**:
- Chart library: Chart.js or Recharts (React-friendly)
- Excel export: xlsx or similar
- CSV export: native JavaScript

**Frontend Components**:
- `AnalyticsDashboard.js` - Main dashboard
- `Charts/*.js` - Individual chart components
- `DataExport.js` - Export functionality
- Add to main navigation

**Acceptance Criteria**:
- [ ] Charts render correctly
- [ ] Trend data accurate
- [ ] Export functionality works
- [ ] Drill-down navigation works
- [ ] Dashboard responsive on mobile
- [ ] Performance acceptable with large datasets

**Estimated Effort**: 10 hours

---

### TICKET P3.2: Risk Assessment & Scoring

**Objective**: Comprehensive risk assessment with scoring, heatmaps, and recommendations

**Requirements**:

1. **Risk Categories** (built in P1.3, enhanced here)
   - Financial risk (cash flow, debt, margins)
   - Operational risk (processes, systems, scalability)
   - Market risk (competition, demand, pricing)
   - Management risk (key person, succession, experience)
   - Compliance/Regulatory risk (licenses, regulations, legal)

2. **Risk Visualization**
   - Overall risk score (0-100)
   - Category breakdown (pie, bar)
   - Risk heatmap by metric
   - Risk trend over time

3. **Risk-Based Recommendations**
   - Top 5 risks with mitigation strategies
   - Priority actions to reduce risk
   - Expected impact of risk reduction

4. **Compliance Features**
   - Risk assessment audit trail
   - Historical risk scores
   - Compliance documentation
   - Risk certifications (if applicable)

**Database Changes**:
```sql
CREATE TABLE risk_assessments (
  id TEXT PRIMARY KEY,
  valuation_id TEXT NOT NULL,
  overall_score INT,
  financial_score INT,
  operational_score INT,
  market_score INT,
  management_score INT,
  compliance_score INT,
  assessment_date DATETIME,
  assessor_notes TEXT,
  created_at DATETIME,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id)
);
```

**Frontend Components**:
- `RiskAssessment.js` - Risk overview
- `RiskHeatmap.js` - Visual heatmap
- `RiskTrend.js` - Historical trends
- `RiskMitigation.js` - Action items

**Acceptance Criteria**:
- [ ] Risk scores calculated accurately
- [ ] Visual heatmap displays correctly
- [ ] Recommendations are actionable
- [ ] Historical data tracked
- [ ] Audit trail complete
- [ ] Mobile responsive

**Estimated Effort**: 8 hours

---

### TICKET P3.3: SaaS Dashboard & Admin

**Objective**: Build admin dashboard and SaaS infrastructure

**Requirements**:

1. **Admin Dashboard**
   - User management
   - Organization management
   - Usage statistics
   - Revenue/subscription tracking
   - Support tools

2. **User Management**
   - View all users
   - Manage roles/permissions
   - Reset passwords
   - Suspend/activate accounts
   - Audit user actions

3. **Pricing Tiers**
   - Free: Basic valuation only
   - Pro: + Reports + Working Capital ($99/month)
   - Enterprise: Everything + API access + white-label ($499/month)

4. **Usage Tracking**
   - Valuations per user
   - Reports generated
   - API calls
   - Features used

5. **Notifications**
   - Email when report is ready
   - Daily digest (Pro+)
   - Share notifications

**Database Changes**:
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  organization_id TEXT UNIQUE,
  tier TEXT DEFAULT 'free', -- free, pro, enterprise
  status TEXT DEFAULT 'active',
  start_date DATE,
  renewal_date DATE,
  created_at DATETIME,
  FOREIGN KEY(organization_id) REFERENCES organizations(id)
);

CREATE TABLE usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT,
  resource TEXT,
  created_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Frontend Components**:
- `AdminDashboard.js`
- `UserManagement.js`
- `SubscriptionManager.js`
- Role-based route protection

**API Endpoints**:
- Admin endpoints (protected with role check)
- Usage tracking endpoints
- Subscription management endpoints

**Acceptance Criteria**:
- [ ] Admin can view all users
- [ ] User roles enforced
- [ ] Usage tracked accurately
- [ ] Pricing tiers enforced
- [ ] Email notifications sent
- [ ] Subscription status displayed

**Estimated Effort**: 10 hours

---

## Technical Architecture Overview

### Backend Structure
```
backend/
├── server.js                # Express entry point
├── config/
│   ├── database.js         # Database configuration
│   ├── env.js              # Environment variables
│   └── auth.js             # JWT config
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── errorHandler.js     # Error handling
│   └── validation.js       # Input validation
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── valuations.js       # Valuation endpoints
│   ├── reports.js          # Report generation
│   ├── analytics.js        # Analytics endpoints
│   └── admin.js            # Admin endpoints
├── services/
│   ├── valuationEngine.js  # Valuation logic
│   ├── pdfGenerator.js     # PDF generation
│   ├── reportGenerator.js  # Report assembly
│   ├── emailService.js     # Email notifications
│   └── riskAnalyzer.js     # Risk scoring
├── models/
│   ├── User.js
│   ├── Valuation.js
│   ├── Organization.js
│   └── AuditLog.js
├── utils/
│   ├── logger.js           # Logging
│   ├── validators.js       # Data validators
│   └── helpers.js          # Utility functions
├── migrations/             # Database migrations
├── tests/
├── db.js                   # Database wrapper
├── .env
├── .env.example
└── package.json
```

### Frontend Structure
```
frontend/src/
├── pages/
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js
│   ├── Valuations.js
│   └── AdminDashboard.js
├── components/
│   ├── Wizard/
│   │   ├── Wizard.js
│   │   ├── Step*.js
│   │   └── Wizard.css
│   ├── Dashboard/
│   │   ├── Dashboard.js
│   │   ├── ValueDrivers.js
│   │   ├── PerformanceGaps.js
│   │   └── Dashboard.css
│   ├── Reports/
│   │   ├── ReportBuilder.js
│   │   ├── ReportPreview.js
│   │   └── Reports.css
│   ├── Analytics/
│   │   ├── AnalyticsDashboard.js
│   │   ├── Charts/
│   │   │   ├── ValuationTrend.js
│   │   │   ├── IndustryComparison.js
│   │   │   └── RiskHeatmap.js
│   │   └── Analytics.css
│   ├── Common/
│   │   ├── Header.js
│   │   ├── Navigation.js
│   │   ├── LoadingSpinner.js
│   │   └── ErrorBoundary.js
│   └── Admin/
│       ├── AdminDashboard.js
│       ├── UserManagement.js
│       └── Admin.css
├── contexts/
│   ├── AuthContext.js      # Auth state
│   ├── ValuationContext.js # Valuation state
│   └── ThemeContext.js     # Theme/preferences
├── hooks/
│   ├── useAuth.js
│   ├── useValuation.js
│   └── useApi.js
├── services/
│   ├── api.js              # API client
│   ├── auth.js             # Auth utilities
│   └── storage.js          # Local storage
├── utils/
│   ├── validators.js
│   ├── formatters.js
│   └── constants.js
├── styles/
│   ├── index.css           # Global
│   ├── variables.css       # CSS vars
│   └── responsive.css      # Media queries
├── App.js                  # Root component
├── App.css
├── index.js
└── index.css
```

### Database Schema Outline
```
users (expanded)
├── id, email (unique), password_hash, full_name
├── company, phone, verified, status
├── preferences (JSON)

organizations
├── id, name, owner_id, subscription_tier
├── created_at

organization_members
├── organization_id, user_id, role

valuations (expanded)
├── id, user_id, organization_id, input_data
├── valuation_result, status, shared_token
├── expires_at, created_at, updated_at

completed_improvements
├── valuation_id, improvement_key, completed_at

working_capital_data
├── valuation_id, ar_days, ap_days, inventory_days

offer_analysis
├── valuation_id, purchase_price, terms, proceeds

risk_assessments
├── valuation_id, financial_score, operational_score, etc.

audit_logs
├── user_id, action, entity_type, entity_id

user_preferences
├── user_id, theme, currency, notifications_enabled

report_templates
├── id, organization_id, name, template_data

subscriptions
├── organization_id, tier, status, renewal_date

usage_logs
├── user_id, action, resource, created_at
```

### API Summary (New Endpoints)

**Authentication**:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/reset-password

**Valuations** (existing + new):
- GET /api/valuations (list user's valuations)
- POST /api/valuations (create new)
- GET /api/valuations/:id (retrieve)
- PUT /api/valuations/:id (update & recalculate)

**Reports** (new):
- GET /api/valuations/:id/reports/pdf
- GET /api/valuations/:id/reports/html
- POST /api/reports/share (create shareable link)
- GET /api/reports/:token (public view)

**Working Capital** (new):
- POST /api/valuations/:id/working-capital
- PUT /api/valuations/:id/working-capital
- GET /api/valuations/:id/working-capital

**Offers** (new):
- POST /api/valuations/:id/offers
- GET /api/valuations/:id/offers
- PUT /api/valuations/:id/offers/:offerId
- DELETE /api/valuations/:id/offers/:offerId

**Analytics** (new):
- GET /api/analytics/dashboard
- GET /api/analytics/trends
- GET /api/analytics/export

**Admin** (new):
- GET /api/admin/users
- PUT /api/admin/users/:id
- GET /api/admin/organizations
- GET /api/admin/usage

---

## Dependencies to Add

### Backend
```json
{
  "bcryptjs": "^2.4.3",          // Password hashing
  "jsonwebtoken": "^9.0.0",      // JWT tokens
  "express-validator": "^7.0.0", // Input validation
  "puppeteer": "^19.0.0",        // PDF generation
  "dotenv": "^16.0.3",           // Env variables
  "helmet": "^7.0.0",            // Security headers
  "cors": "^2.8.5",              // CORS
  "uuid": "^9.0.0",              // ID generation
  "nodemailer": "^6.9.0",        // Email
  "redis": "^4.6.0"              // Caching (optional)
}
```

### Frontend
```json
{
  "chart.js": "^3.9.0",          // Charts
  "react-chartjs-2": "^4.3.1",   // React Chart wrapper
  "axios": "^1.3.0",             // HTTP client
  "react-router-dom": "^6.9.0",  // Routing
  "jspdf": "^2.5.0",             // PDF generation
  "xlsx": "^0.18.5"              // Excel export
}
```

---

## Testing Strategy

### Unit Tests (Backend)
- Valuation engine (existing + new methods)
- Risk scoring algorithm
- Working capital calculations
- Auth functions
- Validators

### Integration Tests
- Auth flow (register → login → logout)
- Valuation creation → report generation
- Offer analysis calculation
- Analytics data

### E2E Tests
- Complete user journey (register → valuation → report)
- Multi-user data isolation
- Admin functions
- Report download

### Performance Tests
- PDF generation time (<5s for Lite)
- Large dataset analytics
- Concurrent user load testing

---

## Implementation Timeline (2-4 weeks)

### Week 1 (Foundation)
- Days 1-2: P1.1 Authentication system
- Days 2-3: P1.2 Database expansion
- Days 3-4: P1.3 Enhanced valuation engine
- Day 5: Testing & integration

### Week 2 (Core Features)
- Days 1-2: P2.1 PDF report generation
- Days 2-3: P2.2 Working capital calculator
- Days 3-4: P2.3 Deal analysis module
- Day 5: Testing & refinement

### Week 3 (Analytics & Polish)
- Days 1-2: P3.1 Analytics dashboards
- Days 2-3: P3.2 Risk assessment
- Days 3-4: P3.3 SaaS infrastructure
- Day 5: Final testing & bug fixes

### Week 4 (Optional - Extra Features)
- Performance optimization
- Additional features
- Deployment preparation

---

## Success Criteria for MVP

✅ **Functional Requirements**:
- Users can register, login, manage account
- Users can create & manage valuations
- Users can generate PDF reports (all 3 tiers)
- Working capital calculations included
- Deal analysis tool available
- Risk scoring implemented
- Basic analytics dashboard

✅ **Non-Functional**:
- All API responses <1s
- PDF generation <5s
- Multi-user data isolation confirmed
- All inputs validated
- Error handling comprehensive
- Mobile responsive
- Performance acceptable

✅ **Quality**:
- No critical bugs
- 80%+ test coverage (core)
- All acceptance criteria met
- Documentation complete
- Deployment ready

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| PDF generation too slow | High | Use pre-made templates, async generation |
| Complex risk scoring incorrect | High | Thorough testing, expert review |
| Data isolation bugs | Critical | Unit tests for auth/queries, code review |
| Performance issues | Medium | Load testing, caching strategy |
| Scope creep | High | Strict ticket scope, sprint discipline |

---

## Next Steps

1. ✅ Validate this plan with stakeholders
2. Review estimated efforts and timeline
3. Assign team members to tickets
4. Set up development environment
5. Create GitHub issues from tickets
6. Begin Week 1 implementation

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Status**: Ready for Implementation
