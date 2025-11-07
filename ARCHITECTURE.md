# Application Architecture

## Overview

The Business Valuation & Improvement App is built with a modern, modular architecture that separates concerns and promotes scalability.

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│                   (SPA on port 3000)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Wizard     │  │  Dashboard   │  │  App Router  │     │
│  │  Component   │  │  Component   │  │  & State     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │  API Service   │                       │
│                    │  (axios)       │                       │
│                    └───────┬────────┘                       │
└─────────────────────────────┼──────────────────────────────┘
                              │ HTTP/REST
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                   Express.js Backend                        │
│                  (Running on port 5000)                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              API Routes & Middleware                │  │
│  │  • POST /api/users                                  │  │
│  │  • POST /api/valuate                                │  │
│  │  • GET /api/valuations/:id                          │  │
│  │  • PUT /api/valuations/:id                          │  │
│  │  • POST /api/valuations/:id/improvements/:key       │  │
│  │  • GET /api/users/:id/valuations                    │  │
│  │  • GET /api/health                                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                                │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │             │
│  ┌──────▼────────┐  ┌─────▼────────┐  ┌─────▼─────┐      │
│  │ Valuation     │  │ Database     │  │ Business  │      │
│  │ Engine        │  │ Service      │  │ Logic     │      │
│  └──────▲────────┘  └─────▲────────┘  └───────────┘      │
│         │                  │                                │
│         └──────────────────┼────────────────────┐          │
│                            │                    │           │
└────────────────────────────┼────────────────────┼──────────┘
                             │                    │
┌────────────────────────────▼────────────────────▼──────────┐
│                        SQLite Database                      │
│  • users                                                    │
│  • valuations                                               │
│  • completed_improvements                                   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App (Main orchestrator)
├── Wizard (Data entry)
│   ├── Step 1: Company Info
│   ├── Step 2: Financial Metrics
│   ├── Step 3: Operations
│   ├── Step 4: Growth & Performance
│   └── Step 5: Risk Factors
└── Dashboard (Results display)
    ├── Valuation Card
    ├── Value Drivers Section
    ├── Gaps Section
    ├── Improvements Section
    └── Actions
```

### State Management

Uses React hooks for simple state management:
- `useState`: Component-level state
- Local storage: Potential for session persistence
- Props drilling: For component communication

### API Integration

The `services/api.js` module provides:
- Centralized API endpoint configuration
- Promise-based HTTP methods using axios
- Error handling and logging
- Request/response formatting

## Backend Architecture

### Request/Response Flow

```
HTTP Request
    │
    ▼
Express Middleware (CORS, JSON parsing)
    │
    ▼
Route Handler
    │
    ▼
Business Logic (Valuation Engine)
    │
    ▼
Database Operations
    │
    ▼
Response (JSON)
```

### Key Modules

#### 1. server.js (Main Application)
- Express app initialization
- Route definitions
- Middleware configuration
- Error handling
- Server startup

#### 2. valuationEngine.js (Core Logic)
- Industry benchmarks definition
- Valuation calculation algorithm
- Adjustment factor calculations
- Suggestion generation
- No database dependencies

#### 3. db.js (Data Access)
- SQLite database connection
- Schema initialization
- Promise-wrapped SQL helpers
- Data persistence

### API Endpoint Design

**RESTful Convention:**
- `POST /api/users` - Create resource
- `POST /api/valuate` - Action/calculation
- `GET /api/valuations/:id` - Retrieve resource
- `PUT /api/valuations/:id` - Update resource
- `POST /api/valuations/:id/improvements/:key` - Nested action

**Response Format:**
```json
{
  "id": "uuid",
  "companyName": "string",
  "finalValuation": 1500000,
  "drivers": [
    {
      "key": "string",
      "label": "string",
      "impact": 500000,
      "type": "positive|negative|improvement"
    }
  ],
  "gaps": [
    {
      "key": "string",
      "label": "string",
      "current": "string",
      "benchmark": "string",
      "gap": "string",
      "impact": -200000
    }
  ],
  "suggestions": [
    {
      "key": "string",
      "title": "string",
      "description": "string",
      "completed": false
    }
  ]
}
```

## Data Model

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Valuations Table
```sql
CREATE TABLE valuations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  input_data TEXT NOT NULL (JSON),
  valuation_result TEXT NOT NULL (JSON),
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id)
)
```

### Completed Improvements Table
```sql
CREATE TABLE completed_improvements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  valuation_id TEXT NOT NULL,
  improvement_key TEXT NOT NULL,
  completed_at DATETIME,
  UNIQUE(valuation_id, improvement_key),
  FOREIGN KEY(valuation_id) REFERENCES valuations(id)
)
```

## Data Flow Examples

### 1. Initial Valuation Calculation

```
User fills wizard
    │
    ▼
React component: handleSubmit()
    │
    ▼
API call: POST /api/valuate
    │
    ▼
Backend: valuationEngine.calculateValuation()
    │
    ├─► Apply EBITDA multiple
    ├─► Apply growth adjustments
    ├─► Apply margin adjustments
    ├─► Apply retention adjustments
    └─► Apply risk adjustments
    │
    ▼
Save to database: INSERT valuation
    │
    ▼
Return result to frontend
    │
    ▼
Dashboard renders with results
```

### 2. Marking Improvement as Complete

```
User clicks "Mark as Complete"
    │
    ▼
API call: POST /api/valuations/:id/improvements/:key
    │
    ▼
Backend: INSERT completed_improvement
    │
    ▼
Fetch all completed improvements
    │
    ▼
Re-run: valuationEngine.calculateValuation(data, completed)
    │
    ▼
Update valuation_result in database
    │
    ▼
Return updated result
    │
    ▼
Dashboard re-renders with new valuation
```

### 3. Updating Input Data

```
User returns to wizard and modifies data
    │
    ▼
Click "Update Data & Recalculate"
    │
    ▼
API call: PUT /api/valuations/:id
    │
    ▼
Backend: Re-run valuationEngine with new inputs
    │
    ▼
Update both input_data and valuation_result
    │
    ▼
Return new results
    │
    ▼
Dashboard shows updated valuation
```

## Scalability Considerations

### Frontend
- **Code Splitting**: Can implement lazy loading for routes
- **Component Optimization**: Use React.memo for expensive components
- **Build Optimization**: CSS modules, image optimization
- **State Management**: Could upgrade to Context API or Redux for larger app

### Backend
- **Horizontal Scaling**: Stateless design allows multiple instances
- **Load Balancing**: Can place behind nginx/HAProxy
- **Caching**: Industry benchmarks could be cached in memory
- **Database**: SQLite → PostgreSQL migration for production
- **API Rate Limiting**: Can add express-rate-limit middleware

## Security Considerations

### Frontend
- HTTPS only in production
- Input validation before sending
- XSS protection through React's automatic escaping
- No sensitive data in localStorage

### Backend
- Server-side validation of all inputs
- SQL injection protection (parameterized queries)
- CORS configuration
- Input sanitization
- Error messages don't expose sensitive info
- API rate limiting

## Error Handling

### Frontend
- Try-catch blocks in async operations
- User-friendly error messages
- Loading states during API calls
- Fallback UI states

### Backend
- Try-catch blocks in route handlers
- Specific error types
- Validation errors return 400
- Server errors return 500
- Detailed console logging

## Testing Strategy

### Unit Tests
- valuationEngine logic
- Individual component rendering
- API service methods

### Integration Tests
- User registration flow
- Valuation calculation flow
- Improvement completion flow

### E2E Tests
- Complete wizard → valuation → improvement flow
- Update data and recalculation
- Error scenarios

## Performance Metrics

### Target Response Times
- API endpoints: < 100ms
- Valuation calculation: < 50ms
- Database queries: < 20ms
- Full page load: < 2s

### Optimization Techniques
- Database indexing on frequently queried fields
- Caching for static benchmark data
- Minification and bundling for frontend
- Lazy loading of components

## Future Enhancements

### Phase 2
- PDF report generation
- Shareable links
- User authentication
- Multi-company support

### Phase 3
- Advanced analytics
- Custom benchmarks
- Scenario planning
- Data visualization

### Phase 4
- Mobile app
- API webhooks
- Integrations with accounting software
- Real-time collaboration
