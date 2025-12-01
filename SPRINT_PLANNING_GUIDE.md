# Sprint Planning Guide - Implementation Roadmap
**Status**: Ready for Sprint Planning
**Total Sprints**: ~9 sprints (2 weeks each = 18 weeks)
**Buffer**: 9 weeks for Phase 6 (critical), integration, testing

---

## Quick Overview

### 87 Feature Tickets Across 9 Phases

| Phase | Tickets | Duration | Priority | Owner |
|-------|---------|----------|----------|-------|
| 1. Foundation | 7 | 2-3 wks | P1 | Backend + DevOps |
| 2. Questionnaire | 6 | 2-3 wks | P1 | Backend + Frontend |
| 3. Engagement | 6 | 2-3 wks | P1 | Backend |
| 4. Documents | 7 | 2-3 wks | P2 | Backend + DevOps |
| 5. Advisor Tools | 6 | 2 wks | P2 | Frontend |
| 6. VAC Engine | 12 | 5-6 wks | P1 | Backend (Calc) + QA (Validation) |
| 7. Reports | 7 | 2-3 wks | P2 | Backend + Frontend |
| 8. Admin Panel | 8 | 2 wks | P3 | Frontend |
| 9. Testing & Deploy | 8 | 2-3 wks | P3 | QA + DevOps |
| **TOTAL** | **87** | **27 weeks** | **Mixed** | **Multi-team** |

---

## Priority Matrix

### Critical Path (P1) - 23 Tickets - Must Complete in Order
These are blocking dependencies for higher phases

**Must Complete Before Phase 5**:
- ✅ FT-1.1: Database Schema
- ✅ FT-1.2: Authentication & RBAC
- ✅ FT-1.3: Business API
- ✅ FT-1.4: Engagement API
- ✅ FT-2.1: Questionnaire Templates
- ✅ FT-2.2: Response Storage
- ✅ FT-2.3: Dynamic Form (Frontend)
- ✅ FT-2.4: Risk Scoring
- ✅ FT-3.1: Workflow State Machine
- ✅ FT-3.2-3.3: Self-Registration Flow
- ✅ FT-3.4: Owner View

**Must Complete Before Phase 6**:
- ✅ FT-4.1-4.2: Document Upload API
- ✅ FT-6.1-6.2: Admin Settings & Multiples
- ✅ FT-6.3-6.10: All Calculation Layers
- ✅ FT-6.11: VAC Endpoint

**Must Complete Before Phase 7**:
- ✅ FT-6.12: Excel Validation Tests (3-5 test cases passing)
- ✅ FT-7.1-7.2: Report Templates & PDF Generation

---

## Effort Breakdown

| Effort | Count | Percentage | Total Weeks |
|--------|-------|-----------|------------|
| **XS** (1-2 days) | 2 | 2% | 0.4 |
| **S** (3-5 days) | 9 | 10% | 3.6 |
| **M** (1-2 weeks) | 52 | 60% | 26 |
| **L** (2-3 weeks) | 18 | 21% | 27 |
| **XL** (3+ weeks) | 6 | 7% | 18 |
| **TOTAL** | **87** | **100%** | **75 weeks raw** |

**With parallelization**: ~27 weeks (1.3 FTE average)

---

## Recommended Sprint Schedule

### Sprint 1-2: Phase 1 (Database Foundation)
**Duration**: 2-3 weeks
**Team**: Backend (2) + DevOps (1)
**Priority**: P1 - CRITICAL

**Tickets**:
- FT-1.1: Database Schema Design ✅
- FT-1.2: User Authentication ✅
- FT-1.3: Business Management API ✅
- FT-1.4: Engagement Management API ✅
- FT-1.5: Team Management API ✅
- FT-1.6: Audit Trail System ✅
- FT-1.7: Database Testing ✅

**Definition of Done**:
- ✅ All 7 tables created via migrations
- ✅ All CRUD APIs working
- ✅ RBAC enforced
- ✅ 95%+ test coverage
- ✅ Database performance benchmarked

**Dependencies**: None (start immediately)
**Blocks**: Phase 2, 3, 4, 5, 6, 8

**Risk**: Database design errors break all future phases
**Mitigation**: Architecture review before implementation

---

### Sprint 3-4: Phase 2 (Questionnaire Engine)
**Duration**: 2-3 weeks
**Team**: Backend (1) + Frontend (1.5)
**Priority**: P1 - CRITICAL

**Parallel with Sprint 3**: Phase 3 prep (FT-3.x planning)

**Tickets**:
- FT-2.1: Questionnaire Templates DB ✅
- FT-2.2: Response Storage API ✅
- FT-2.3: Dynamic Form Renderer ✅
- FT-2.4: Risk Scoring ✅
- FT-2.5: Admin Questionnaire UI ✅
- FT-2.6: Tests ✅

**Definition of Done**:
- ✅ All 24 questions loadable
- ✅ Form renders dynamically
- ✅ Risk score calculated (1-70)
- ✅ 90%+ test coverage
- ✅ End-to-end questionnaire works

**Dependencies**: FT-1.1 through FT-1.7
**Blocks**: Phase 3, 5, 6

**Risk**: Complex form rendering logic
**Mitigation**: Use proven form library (React Hook Form), test early

---

### Sprint 5-6: Phase 3 (Engagement Workflows)
**Duration**: 2-3 weeks
**Team**: Backend (2) + Frontend (0.5)
**Priority**: P1 - CRITICAL

**Parallel with Sprint 5**: Phase 4 prep (document upload infrastructure)

**Tickets**:
- FT-3.1: Workflow State Machine ✅
- FT-3.2-3.3: Self-Registration Flow ✅
- FT-3.4: Owner View ✅
- FT-3.5: Admin New Leads Queue ✅
- FT-3.6: Workflow Tests ✅

**Definition of Done**:
- ✅ State machine enforced
- ✅ Self-registration complete
- ✅ Owner/admin views working
- ✅ All workflow transitions tested
- ✅ No data loss on state transitions

**Dependencies**: FT-2.1 through FT-2.6
**Blocks**: Phase 5, 6

**Risk**: State machine complexity
**Mitigation**: Detailed state diagram, unit tests for each transition

---

### Sprint 7-8: Phase 4 (Document Management)
**Duration**: 2-3 weeks
**Team**: Backend (1) + Frontend (1) + DevOps (0.5)
**Priority**: P2 - HIGH

**Parallel**: Start Phase 5 prep (advisor UI mockups)

**Tickets**:
- FT-4.1: Document Upload API ✅
- FT-4.2: Document Management API ✅
- FT-4.3: Upload UI (Owner) ✅
- FT-4.4: Review UI (Advisor) ✅
- FT-4.5: Document Type Definitions ✅
- FT-4.6: File Storage Implementation ✅
- FT-4.7: Tests ✅

**Definition of Done**:
- ✅ Upload/download working
- ✅ Status tracking (accept/reject)
- ✅ File security (token-based access)
- ✅ 85%+ test coverage
- ✅ Performance <5 sec for 50MB files

**Dependencies**: FT-3.1 through FT-3.6, FT-1.6
**Blocks**: Phase 5, 6

**Risk**: File upload security
**Mitigation**: Security review, penetration testing, virus scanning

---

### Sprint 9: Phase 5 (Advisor Dashboard)
**Duration**: 2 weeks
**Team**: Frontend (2) + Backend (0.5)
**Priority**: P2 - HIGH

**Parallel**: Start Phase 6 Calculation Engine

**Tickets**:
- FT-5.1: Advisor Dashboard ✅
- FT-5.2: Engagement Review Page ✅
- FT-5.3: Answer Override (Backend) ✅
- FT-5.4: Auto-Reconciliation Alerts ✅
- FT-5.5: Comment System ✅
- FT-5.6: Tests ✅

**Definition of Done**:
- ✅ Dashboard displays correctly
- ✅ All 24 questions editable
- ✅ Reconciliation alerts firing
- ✅ Comments persisted
- ✅ 80%+ test coverage

**Dependencies**: FT-4.1 through FT-4.7
**Blocks**: Phase 6 (advisor readiness)

**Risk**: Complex multi-column layout
**Mitigation**: Early UI review with stakeholders, responsive testing

---

### Sprint 10-14: Phase 6 (VAC Calculation Engine) ⭐ CRITICAL
**Duration**: 5-6 weeks (5 sprints of intensive work)
**Team**: Backend (1.5 - calculations focus) + QA (1 - validation focus)
**Priority**: P1 - CRITICAL

**This is the most complex phase - deserves dedicated resources**

**Sprint 10** (Week 1):
- FT-6.1: Admin Settings DB ✅
- FT-6.2: Industry Multiples Import ✅
- FT-6.3: Risk Score Calculation ✅

**Sprint 11** (Week 2):
- FT-6.4: EBITDA Calculation ✅
- FT-6.5: Current Value Calculation ✅

**Sprint 12** (Week 3):
- FT-6.6: Size Lever ✅
- FT-6.7: Efficiency Lever ✅
- FT-6.8: Multiple Lever ✅

**Sprint 13** (Week 4):
- FT-6.9: Probability Distribution ✅
- FT-6.10: Wealth Gap Calculator ✅

**Sprint 14** (Week 5):
- FT-6.11: VAC API Endpoint ✅
- FT-6.12: Excel Validation Tests ✅ (with 3-5 test files)

**Definition of Done**:
- ✅ All 7 calculation layers implemented
- ✅ 3-5 Excel test cases PASSING
- ✅ ±0.01% accuracy vs Excel
- ✅ <1 sec performance
- ✅ 95%+ test coverage
- ✅ All edge cases tested

**Dependencies**: FT-6.1, FT-6.2 (data setup), FT-2.4 (risk questions)
**Blocks**: Phase 7 (report generation), Phase 8 (admin multiples management)

**Risks**:
- ❌ Test files not provided on time (blocker)
- ❌ Excel formula interpretation errors
- ❌ Numerical precision issues
- ❌ Calculation layer dependencies

**Mitigations**:
- ✅ Get test files early (request now)
- ✅ Detailed formula documentation (CLARIFICATIONS_RESOLVED.md)
- ✅ Double precision floats, rounding rules documented
- ✅ Modular implementation, unit test each layer

---

### Sprint 15: Phase 7 (Report Generation)
**Duration**: 2-3 weeks
**Team**: Backend (1) + Frontend (1)
**Priority**: P2 - HIGH

**Parallel**: Start Phase 8 Admin Panel

**Tickets**:
- FT-7.1: Report Templates ✅
- FT-7.2: PDF Generation Engine ✅
- FT-7.3: Report Storage ✅
- FT-7.4: Report Selection UI ✅
- FT-7.5: Shareable Links ✅
- FT-7.6: Customization (Admin) ✅
- FT-7.7: Tests ✅

**Definition of Done**:
- ✅ All 5 report types generating
- ✅ PDF quality acceptable
- ✅ Downloads working
- ✅ Share links secure & expiring
- ✅ <10 sec per report generation
- ✅ 80%+ test coverage

**Dependencies**: FT-6.12 (Excel validation complete)
**Blocks**: Phase 9 (UAT)

**Risk**: PDF generation timeout on large reports
**Mitigation**: Async job queue, test with 182-page report

---

### Sprint 16: Phase 8 (Admin Panel)
**Duration**: 2 weeks
**Team**: Frontend (1.5) + Backend (0.5)
**Priority**: P3 - SYSTEM

**Parallel**: Phase 9 Test Suite prep

**Tickets**:
- FT-8.1: Admin Dashboard ✅
- FT-8.2: Questionnaire Management ✅
- FT-8.3: Settings Management ✅
- FT-8.4: Multiples Management ✅
- FT-8.5: User & Team Management ✅
- FT-8.6: Audit Log Viewer ✅
- FT-8.7: Business & Engagement Mgmt ✅
- FT-8.8: Tests ✅

**Definition of Done**:
- ✅ All admin pages functional
- ✅ CRUD operations working
- ✅ Permission enforcement
- ✅ 75%+ test coverage
- ✅ Only admin access enforced

**Dependencies**: Phase 6 multiples complete
**Blocks**: Phase 9 (UAT)

**Risk**: Permission bypass vulnerabilities
**Mitigation**: Security review, role-based testing

---

### Sprint 17-18: Phase 9 (Testing & Deployment)
**Duration**: 2-3 weeks
**Team**: QA (1) + DevOps (1) + Backend (0.5 - bug fixes)
**Priority**: P3 - SYSTEM

**Tickets**:
- FT-9.1: Automated Test Suite ✅
- FT-9.2: Excel Validation (regression) ✅
- FT-9.3: Performance Testing ✅
- FT-9.4: Security Testing ✅
- FT-9.5: User Acceptance Testing ✅
- FT-9.6: Production Deployment ✅
- FT-9.7: Documentation ✅
- FT-9.8: Post-Launch Support ✅

**Definition of Done**:
- ✅ 85%+ test coverage overall
- ✅ All performance benchmarks met
- ✅ Security audit passed
- ✅ UAT sign-off obtained
- ✅ Production deployment successful
- ✅ Monitoring active
- ✅ Team trained

**Dependencies**: All previous phases
**Blocks**: Production launch

**Risk**: Last-minute bugs, UAT failures
**Mitigation**: Staged deployment, hotfix process, rollback plan

---

## Recommended Team Structure

### Backend Team (1.5 FTE)
- **Lead**: Responsible for Phases 1, 3, 6, 7 architecture
- **Senior Dev**: Phase 6 VAC Engine (critical)
- **Mid Dev**: Phases 2, 4, general features

**Skills Required**:
- Node.js/Express
- SQLite/PostgreSQL
- API design
- Calculation/math logic
- PDF generation

### Frontend Team (1.5 FTE)
- **Lead**: Responsible for Phase 2, 5, 8 UX
- **Senior Dev**: Complex components (questionnaire form, advisor dashboard)
- **Mid Dev**: Admin pages, general UI

**Skills Required**:
- React
- State management
- Form handling
- CSS/responsive design
- Accessibility (A11y)

### QA/DevOps (1.0 FTE)
- **QA Engineer** (0.5): Test planning, execution, validation
- **DevOps Engineer** (0.5): Infrastructure, deployment, monitoring

**Skills Required**:
- Test automation
- API testing
- Excel VBA (for validation)
- Docker
- AWS/deployment

---

## Risk Management

### Top Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Test Excel files not provided on time | Phase 6 blocked | High | Request files immediately |
| Excel formula interpretation errors | Phase 6 failing validation | Medium | Detailed spec (CLARIFICATIONS_RESOLVED.md) |
| Complex questionnaire form rendering | Phase 2 delays | Medium | Use proven library, early POC |
| VAC calculation accuracy (±0.01%) | Phase 6 failing | Medium | Modular implementation, unit tests |
| Document upload security | Security breach | Low | File validation, virus scanning, penetration test |
| Scope creep (feature requests) | Timeline slip | High | Strict phase gates, change management |
| Team turnover | Knowledge loss | Medium | Documentation, pair programming |

### Critical Path (No Slack)
- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 9
- **Any delay in Phase 1, 2, 3 blocks everything**
- **Phase 6 is longest (5-6 weeks) and most critical**

---

## Success Metrics

### Per Phase
- ✅ All feature tickets completed
- ✅ All acceptance criteria met
- ✅ Tests passing (>80% coverage)
- ✅ Code review approved
- ✅ No critical bugs

### Overall
- ✅ Timeline: On or under 27 weeks
- ✅ Budget: On or under $240K
- ✅ Quality: Zero critical security issues
- ✅ Performance: All benchmarks met
- ✅ User satisfaction: >4/5 (post-launch)

---

## Next Steps

1. **TODAY**: Review this sprint plan with team
2. **THIS WEEK**: Confirm team assignments
3. **NEXT WEEK**: Phase 1 Sprint Planning meeting
4. **ASAP**: Request 3-5 test Excel files for Phase 6
5. **START**: Phase 1 implementation

---

**Status**: ✅ Sprint Planning Ready
**Owner**: Project Manager + Technical Lead
**Questions?**: Refer to FEATURE_TICKETS_IMPLEMENTATION.md
