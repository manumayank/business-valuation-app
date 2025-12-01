# Database Schema - Complete Design
**Status**: Ready for Migration Implementation
**Database**: SQLite (Phase 1) → PostgreSQL (Production-ready)
**Tables**: 15 core tables + audit table

---

## Entity Relationship Diagram (Conceptual)

```
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── full_name
├── company
├── phone
├── verified
├── status
└── created_at

user_roles (junction)
├── user_id (FK → users)
├── role (enum: owner, advisor, admin)
└── assigned_at

businesses
├── id (PK)
├── owner_id (FK → users)
├── name
├── naics_code (FK → industry_multiples)
├── location
├── founded_year
├── status
└── created_at

engagements
├── id (PK)
├── business_id (FK → businesses)
├── questionnaire_template_id (FK → questionnaire_templates)
├── assigned_advisor_id (FK → users)
├── status (enum: created, intake_in_progress, ready_for_review, under_review, valuation_drafted, reports_generated)
├── completion_percentage
├── created_at
└── updated_at

questionnaire_templates
├── id (PK)
├── name
├── description
├── version
├── is_active
├── created_at
└── updated_at

questionnaire_questions
├── id (PK)
├── template_id (FK → questionnaire_templates)
├── question_text
├── question_number
├── field_type (enum: text, number, select, date, textarea)
├── owner_visible (bool)
├── advisor_only (bool)
├── mandatory (bool)
├── category (enum: discovery, risk, earnings, multiples, documents)
├── validation_rules (JSON)
├── conditional_logic (JSON)
└── order_index

question_options
├── id (PK)
├── question_id (FK → questionnaire_questions)
├── option_value
├── option_label
├── score (for risk questions)
└── order_index

questionnaire_responses
├── id (PK)
├── engagement_id (FK → engagements)
├── question_id (FK → questionnaire_questions)
├── answer_text
├── answer_numeric
├── answer_select
├── answer_date
├── answer_source (enum: owner, advisor, system)
├── owner_answer (original)
├── advisor_override (if changed)
├── advisor_notes
├── updated_at
└── updated_by (FK → users)

documents
├── id (PK)
├── engagement_id (FK → engagements)
├── document_type (enum: P&L, Balance Sheet, Tax Returns, etc.)
├── file_name
├── file_path
├── file_size
├── file_type (PDF, Excel, etc.)
├── upload_date
├── uploaded_by (FK → users)
├── status (enum: uploaded, pending, accepted, rejected, needs_clarification)
├── advisor_notes
└── access_token (secure)

risk_scores
├── id (PK)
├── engagement_id (FK → engagements)
├── risk_score (1-70)
├── risk_category (enum: HIGH, MEDIUM, LOW)
├── score_breakdown (JSON)
├── calculated_at
└── calculated_by (FK → users)

valuations
├── id (PK)
├── engagement_id (FK → engagements)
├── ebitda
├── ebitda_margin
├── multiple_used
├── multiple_type (custom, common, industry)
├── current_value
├── risk_weighting_applied
├── created_at
└── created_by (FK → users)

vac_assumptions
├── id (PK)
├── valuation_id (FK → valuations)
├── size_growth_rate
├── efficiency_improvement
├── multiple_increase
├── created_at
└── updated_by (FK → users)

vac_results
├── id (PK)
├── valuation_id (FK → valuations)
├── size_value_created
├── size_value_percent
├── efficiency_value_created
├── efficiency_value_percent
├── multiple_value_created
├── multiple_value_percent
├── total_value_increase
├── new_total_value
└── calculated_at

probability_distribution
├── id (PK)
├── valuation_id (FK → valuations)
├── std_dev_step (-2, -1, 0, 1, 2)
├── multiple
├── mvic_value
├── probability
└── percentile

wealth_gap
├── id (PK)
├── valuation_id (FK → valuations)
├── target_value
├── current_value
├── years_to_exit
├── assumed_growth_rate
├── assumed_margin
├── assumption_year (for projections)
└── year_data (JSON: yearly table)

reports
├── id (PK)
├── valuation_id (FK → valuations)
├── report_type (VAC, CBP, MVA, MPSP, Action Plan)
├── file_path
├── generated_at
├── generated_by (FK → users)
├── share_token (UUID)
├── share_expiration
├── is_public
└── access_count

admin_settings
├── id (PK)
├── setting_key (UNIQUE)
├── setting_value
├── data_type
├── description
├── updated_at
└── updated_by (FK → users)

industry_multiples
├── id (PK)
├── naics_code (UNIQUE)
├── industry_name
├── multiple (EBITDA multiple)
├── updated_at
└── source

audit_log (immutable)
├── id (PK)
├── table_name
├── operation (INSERT, UPDATE, DELETE)
├── record_id
├── user_id (FK → users)
├── old_values (JSON)
├── new_values (JSON)
├── timestamp
└── ip_address (optional)

team_assignments
├── id (PK)
├── advisor_id (FK → users)
├── engagement_id (FK → engagements)
├── assigned_at
└── assigned_by (FK → users)
```

---

## Complete SQL Schema (SQLite)

```sql
-- PHASE 1: Foundation Tables

-- Users table (existing, extended)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'advisor', 'admin')),
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  naics_code TEXT,
  location TEXT,
  founded_year INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id),
  FOREIGN KEY(naics_code) REFERENCES industry_multiples(naics_code)
);

CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_naics ON businesses(naics_code);

-- Engagements table
CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  questionnaire_template_id INTEGER NOT NULL,
  assigned_advisor_id TEXT,
  status TEXT DEFAULT 'created' CHECK(status IN ('created', 'intake_in_progress', 'ready_for_review', 'under_review', 'valuation_drafted', 'reports_generated')),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(business_id) REFERENCES businesses(id),
  FOREIGN KEY(questionnaire_template_id) REFERENCES questionnaire_templates(id),
  FOREIGN KEY(assigned_advisor_id) REFERENCES users(id)
);

CREATE INDEX idx_engagements_business_id ON engagements(business_id);
CREATE INDEX idx_engagements_status ON engagements(status);
CREATE INDEX idx_engagements_advisor_id ON engagements(assigned_advisor_id);

-- Questionnaire templates
CREATE TABLE IF NOT EXISTS questionnaire_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Questions
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_number INTEGER,
  field_type TEXT CHECK(field_type IN ('text', 'number', 'select', 'date', 'textarea')) DEFAULT 'text',
  owner_visible BOOLEAN DEFAULT 1,
  advisor_only BOOLEAN DEFAULT 0,
  mandatory BOOLEAN DEFAULT 1,
  category TEXT CHECK(category IN ('discovery', 'risk', 'earnings', 'multiples', 'documents')),
  validation_rules TEXT, -- JSON
  conditional_logic TEXT, -- JSON
  order_index INTEGER,
  FOREIGN KEY(template_id) REFERENCES questionnaire_templates(id),
  UNIQUE(template_id, question_number)
);

CREATE INDEX idx_questions_template ON questionnaire_questions(template_id);
CREATE INDEX idx_questions_category ON questionnaire_questions(category);

-- Question options (for dropdowns)
CREATE TABLE IF NOT EXISTS question_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  option_value TEXT NOT NULL,
  option_label TEXT NOT NULL,
  score INTEGER, -- For risk questions
  order_index INTEGER,
  FOREIGN KEY(question_id) REFERENCES questionnaire_questions(id),
  UNIQUE(question_id, option_value)
);

CREATE INDEX idx_options_question ON question_options(question_id);

-- Questionnaire responses
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  answer_text TEXT,
  answer_numeric DECIMAL(20,2),
  answer_select TEXT,
  answer_date DATE,
  answer_source TEXT DEFAULT 'owner' CHECK(answer_source IN ('owner', 'advisor', 'system')),
  owner_answer TEXT, -- Original answer
  advisor_override TEXT, -- If overridden
  advisor_notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  FOREIGN KEY(engagement_id) REFERENCES engagements(id),
  FOREIGN KEY(question_id) REFERENCES questionnaire_questions(id),
  FOREIGN KEY(updated_by) REFERENCES users(id),
  UNIQUE(engagement_id, question_id)
);

CREATE INDEX idx_responses_engagement ON questionnaire_responses(engagement_id);
CREATE INDEX idx_responses_question ON questionnaire_responses(question_id);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploaded', 'pending', 'accepted', 'rejected', 'needs_clarification')),
  advisor_notes TEXT,
  access_token TEXT UNIQUE,
  FOREIGN KEY(engagement_id) REFERENCES engagements(id),
  FOREIGN KEY(uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_documents_engagement ON documents(engagement_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_access_token ON documents(access_token);

-- Risk scores
CREATE TABLE IF NOT EXISTS risk_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  risk_score INTEGER CHECK(risk_score >= 1 AND risk_score <= 70),
  risk_category TEXT CHECK(risk_category IN ('HIGH', 'MEDIUM', 'LOW')),
  score_breakdown TEXT, -- JSON with each question score
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  calculated_by TEXT,
  FOREIGN KEY(engagement_id) REFERENCES engagements(id),
  FOREIGN KEY(calculated_by) REFERENCES users(id),
  UNIQUE(engagement_id)
);

-- Valuations
CREATE TABLE IF NOT EXISTS valuations (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL,
  ebitda DECIMAL(20,2),
  ebitda_margin DECIMAL(5,4),
  multiple_used DECIMAL(5,2),
  multiple_type TEXT CHECK(multiple_type IN ('custom', 'common', 'industry')),
  current_value DECIMAL(20,2),
  risk_weighting_applied BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY(engagement_id) REFERENCES engagements(id),
  FOREIGN KEY(created_by) REFERENCES users(id),
  UNIQUE(engagement_id)
);

CREATE INDEX idx_valuations_engagement ON valuations(engagement_id);

-- VAC assumptions
CREATE TABLE IF NOT EXISTS vac_assumptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  valuation_id TEXT NOT NULL,
  size_growth_rate DECIMAL(5,4), -- 0.25 for 25%
  efficiency_improvement DECIMAL(5,4), -- 0.05 for 5%
  multiple_increase DECIMAL(5,4), -- 1.0 for 100%
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id),
  FOREIGN KEY(updated_by) REFERENCES users(id),
  UNIQUE(valuation_id)
);

-- VAC results
CREATE TABLE IF NOT EXISTS vac_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  valuation_id TEXT NOT NULL,
  size_value_created DECIMAL(20,2),
  size_value_percent DECIMAL(5,4),
  efficiency_value_created DECIMAL(20,2),
  efficiency_value_percent DECIMAL(5,4),
  multiple_value_created DECIMAL(20,2),
  multiple_value_percent DECIMAL(5,4),
  total_value_increase DECIMAL(20,2),
  new_total_value DECIMAL(20,2),
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id),
  UNIQUE(valuation_id)
);

-- Probability distribution
CREATE TABLE IF NOT EXISTS probability_distribution (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  valuation_id TEXT NOT NULL,
  std_dev_step INTEGER CHECK(std_dev_step IN (-2, -1, 0, 1, 2)),
  multiple DECIMAL(5,2),
  mvic_value DECIMAL(20,2),
  probability DECIMAL(3,2),
  percentile TEXT,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id),
  UNIQUE(valuation_id, std_dev_step)
);

CREATE INDEX idx_prob_dist_valuation ON probability_distribution(valuation_id);

-- Wealth gap projections
CREATE TABLE IF NOT EXISTS wealth_gap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  valuation_id TEXT NOT NULL,
  target_value DECIMAL(20,2),
  years_to_exit DECIMAL(5,2),
  assumed_growth_rate DECIMAL(5,4),
  assumed_margin DECIMAL(5,4),
  assumption_year INTEGER,
  year_data TEXT, -- JSON with yearly projections
  FOREIGN KEY(valuation_id) REFERENCES valuations(id),
  UNIQUE(valuation_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  valuation_id TEXT NOT NULL,
  report_type TEXT CHECK(report_type IN ('VAC', 'CBP', 'MVA', 'MPSP', 'Action Plan')),
  file_path TEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  generated_by TEXT NOT NULL,
  share_token TEXT UNIQUE,
  share_expiration DATETIME,
  is_public BOOLEAN DEFAULT 0,
  access_count INTEGER DEFAULT 0,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id),
  FOREIGN KEY(generated_by) REFERENCES users(id)
);

CREATE INDEX idx_reports_valuation ON reports(valuation_id);
CREATE INDEX idx_reports_share_token ON reports(share_token);

-- Admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  data_type TEXT, -- 'decimal', 'integer', 'text', 'boolean', 'json'
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  FOREIGN KEY(updated_by) REFERENCES users(id)
);

-- Industry multiples lookup
CREATE TABLE IF NOT EXISTS industry_multiples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  naics_code TEXT UNIQUE NOT NULL,
  industry_name TEXT NOT NULL,
  multiple DECIMAL(5,2) NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT
);

CREATE INDEX idx_multiples_naics ON industry_multiples(naics_code);

-- Team assignments
CREATE TABLE IF NOT EXISTS team_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advisor_id TEXT NOT NULL,
  engagement_id TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by TEXT,
  FOREIGN KEY(advisor_id) REFERENCES users(id),
  FOREIGN KEY(engagement_id) REFERENCES engagements(id),
  FOREIGN KEY(assigned_by) REFERENCES users(id),
  UNIQUE(advisor_id, engagement_id)
);

CREATE INDEX idx_assignments_advisor ON team_assignments(advisor_id);
CREATE INDEX idx_assignments_engagement ON team_assignments(engagement_id);

-- Audit log (IMMUTABLE - never delete)
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id TEXT,
  user_id TEXT,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_user ON audit_log(user_id);

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Initial Data Seeding

### Default Admin Settings
```sql
INSERT INTO admin_settings (setting_key, setting_value, data_type, description) VALUES
('baseline_pretax_margin', '0.075', 'decimal', 'Default pre-tax margin when no financials provided'),
('baseline_depreciation', '0.01', 'decimal', 'Default depreciation % of revenue'),
('baseline_interest', '0.01', 'decimal', 'Default interest % of revenue'),
('baseline_discretionary', '0.02', 'decimal', 'Default discretionary spending % of revenue'),
('risk_weighting_enabled', 'true', 'boolean', 'Apply risk-based discount/premium to multiple'),
('risk_discount_high', '-0.25', 'decimal', 'Discount for HIGH risk (1-23)'),
('risk_discount_medium', '0', 'decimal', 'Adjustment for MEDIUM risk (24-46)'),
('risk_discount_low', '0.15', 'decimal', 'Premium for LOW risk (47-70)'),
('session_timeout_minutes', '30', 'integer', 'Minutes of inactivity before logout'),
('max_file_upload_mb', '50', 'integer', 'Maximum file upload size in MB'),
('report_retention_days', '90', 'integer', 'Days to keep generated reports');
```

### Questionnaire Template (Standard VAC+MVA)
```sql
INSERT INTO questionnaire_templates (name, description, version, is_active) VALUES
('Standard VAC+MVA', 'Complete Value Acceleration Calculator with detailed financial analysis', 1, 1);

-- Returns: template_id = 1 (use in subsequent question inserts)
```

---

## Table Statistics

| Table | Purpose | Record Count (Est.) |
|-------|---------|-------------------|
| users | Users across all roles | 50-500 |
| user_roles | Role assignments | 50-500 |
| businesses | Companies being valued | 100-1000 |
| engagements | Valuation instances | 200-2000 |
| questionnaire_templates | Question templates | 3-5 |
| questionnaire_questions | Individual questions | 50-100 |
| question_options | Dropdown options | 200-400 |
| questionnaire_responses | Answers submitted | 1000-20000 |
| documents | Uploaded files | 500-5000 |
| risk_scores | Calculated scores | 200-2000 |
| valuations | Valuation results | 200-2000 |
| vac_assumptions | VAC lever targets | 200-2000 |
| vac_results | VAC calculation results | 200-2000 |
| probability_distribution | Distribution bands | 1000-10000 |
| wealth_gap | Exit projections | 200-2000 |
| reports | Generated PDFs | 500-5000 |
| admin_settings | System configuration | ~15-20 |
| industry_multiples | NAICS lookup | ~500-1000 |
| team_assignments | Advisor assignments | 100-1000 |
| audit_log | Change log | 5000-100000+ |

---

## Migration Strategy

### Phase 1: Core Database (Week 1)
1. Create all 20 tables
2. Add indexes for performance
3. Seed admin_settings with defaults
4. Create questionnaire_templates
5. Load industry_multiples from CSV

### Phase 2: Progressive Features (Weeks 2+)
- Tables are ready; code incrementally populates them
- Migrations are idempotent (safe to re-run)

### Production Migration (Before Deployment)
1. Backup existing SQLite database
2. Run all migrations on PostgreSQL
3. Verify data integrity
4. Test application connectivity
5. Monitor for errors post-deployment

---

## Performance Considerations

### Indexes (Already Defined)
- **Email lookups**: idx_users_email
- **Engagement filtering**: idx_engagements_status, idx_engagements_business_id
- **Audit trail**: idx_audit_timestamp, idx_audit_table
- **Document access**: idx_documents_access_token
- **Questions**: idx_questions_template, idx_questions_category

### Query Optimization
- **Avoid N+1**: Pre-load related records (e.g., engagement with responses)
- **Pagination**: Use LIMIT/OFFSET for large result sets
- **Caching**: Cache industry_multiples (unlikely to change frequently)
- **Archive old records**: Move completed engagements to archive table (future optimization)

---

**Status**: ✅ Schema complete and ready for migration scripts
**Next**: Create migration files (001_initial.js, 002_load_data.js, etc.)
