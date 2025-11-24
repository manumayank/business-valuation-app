# Business Valuation & Improvement App - Administrator Guide

## Table of Contents
1. [Admin Overview](#admin-overview)
2. [System Administration](#system-administration)
3. [User Management](#user-management)
4. [Database Management](#database-management)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)
7. [Deployment & Scaling](#deployment--scaling)
8. [Security & Compliance](#security--compliance)

---

## Admin Overview

### Admin Responsibilities

As an administrator, you manage:
- **User accounts** - Create, disable, manage user access
- **System health** - Monitor performance, uptime, resource usage
- **Database** - Backups, migrations, data integrity
- **Security** - Authentication, authorization, data protection
- **Maintenance** - Updates, patches, troubleshooting
- **Configuration** - Settings, feature flags, environment variables

### Admin Access

Administrators typically access the system through:
1. **Direct server access** - SSH to server for system management
2. **Database access** - Direct database queries for data inspection
3. **Docker management** - Managing containers and services
4. **Application logs** - Monitoring application behavior

---

## System Administration

### Architecture Overview

**Technology Stack:**
- **Frontend**: React 18+ (Node.js/npm)
- **Backend**: Node.js/Express.js
- **Database**: SQLite3
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT (JSON Web Tokens)

**Services:**
```
┌─────────────────────────────────────────┐
│  Frontend (React) - Port 3000           │
│  - User interface                       │
│  - Client-side validation               │
│  - Report generation (PDF)              │
└─────────────────────────────────────────┘
                  ↓ HTTP(S)
┌─────────────────────────────────────────┐
│  Backend (Express.js) - Port 5000       │
│  - Valuation calculations               │
│  - Authentication/Authorization         │
│  - Data persistence                     │
│  - API endpoints                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Database (SQLite) - /app/data/         │
│  - Users                                │
│  - Valuations                           │
│  - Working Capital Analysis             │
│  - Deal Analysis                        │
│  - Reports                              │
└─────────────────────────────────────────┘
```

### Running the Application

#### Local Development

```bash
# Terminal 1: Start Backend
cd backend
npm install
npm start
# Server runs on http://localhost:5000

# Terminal 2: Start Frontend
cd frontend
npm install
npm start
# App opens on http://localhost:3000
```

#### Docker Production

```bash
cd manu
docker-compose up --build
```

**Services:**
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Health Check: http://localhost:5000/api/health

#### Stopping Services

```bash
# Stop Docker services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Stop specific service
docker-compose stop backend
docker-compose stop frontend
```

### Environment Configuration

**Backend Environment Variables** (backend/.env)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_PATH=/app/data/valuation.db

# JWT Secret (IMPORTANT: Change in production!)
JWT_SECRET=your-secret-key-change-this

# API Configuration
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

**Frontend Environment Variables** (frontend/.env)

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=production

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_EXPORT=true
```

**Important Security Notes:**
- **NEVER** commit .env files to version control
- Always use strong, unique JWT_SECRET in production
- Rotate JWT_SECRET periodically
- Use environment-specific configurations

### Port Configuration

| Service | Default Port | Use |
|---------|--------------|-----|
| Frontend | 3000 | React application |
| Backend | 5000 | REST API |
| Database | N/A | Local file: /app/data/valuation.db |

**If ports conflict:**
```bash
# Change frontend port
cd frontend && PORT=3001 npm start

# Change backend port
cd backend && PORT=5001 npm start
```

---

## User Management

### User Roles & Permissions

**Current System Structure:**
- **Regular Users**: Can create valuations, access their own data
- **Admin Users**: Full system access (typically server-level access)

**Note:** This version doesn't have built-in role management in the UI. User roles are managed through:
- Authentication tokens (JWT)
- Database records
- Server-side authorization middleware

### User Accounts

#### View Existing Users

**Option 1: Database Query**
```sql
SELECT id, email, full_name, company, created_at FROM users;
```

**Option 2: Through the Application**
Users are created through the registration page.

#### Create Test User

For testing purposes, use the registration page:
1. Go to http://localhost:3000
2. Click "Create Account"
3. Fill in test credentials
4. Use for testing the application

#### Disable User Account

To prevent a user from logging in:
```sql
UPDATE users SET status = 'inactive' WHERE email = 'user@example.com';
```

#### Delete User Account

⚠️ **Warning:** This cannot be undone
```sql
DELETE FROM users WHERE email = 'user@example.com';
-- Also delete related data:
DELETE FROM valuations WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

#### Reset User Password

Currently, users must use "Forgot Password" feature (if implemented). If not available:
```sql
-- Users would need to register a new account or contact admin
-- Password is hashed - cannot be recovered
```

### User Activity Monitoring

#### View User Valuations
```sql
SELECT
    v.id,
    u.email,
    u.full_name,
    v.input_data,
    v.valuation_result,
    v.created_at
FROM valuations v
JOIN users u ON v.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY v.created_at DESC;
```

#### View Working Capital Analyses
```sql
SELECT
    wc.id,
    u.email,
    wc.dso,
    wc.dio,
    wc.dpo,
    wc.ccc,
    wc.created_at
FROM working_capital_analysis wc
JOIN valuations v ON wc.valuation_id = v.id
JOIN users u ON v.user_id = u.id
WHERE u.email = 'user@example.com';
```

#### View Deal Analyses
```sql
SELECT
    da.id,
    u.email,
    da.deal_metrics,
    da.created_at
FROM deal_analysis da
JOIN valuations v ON da.valuation_id = v.id
JOIN users u ON v.user_id = u.id
WHERE u.email = 'user@example.com';
```

---

## Database Management

### Database Structure

**Main Tables:**

1. **users**
   - id (TEXT PRIMARY KEY)
   - email (TEXT UNIQUE)
   - password_hash (TEXT)
   - full_name (TEXT)
   - company (TEXT)
   - status (TEXT) - active/inactive
   - created_at (DATETIME)
   - updated_at (DATETIME)

2. **valuations**
   - id (TEXT PRIMARY KEY)
   - user_id (TEXT FOREIGN KEY)
   - input_data (TEXT - JSON)
   - valuation_result (TEXT - JSON)
   - status (TEXT)
   - created_at (DATETIME)
   - updated_at (DATETIME)

3. **working_capital_analysis**
   - id (INTEGER PRIMARY KEY)
   - valuation_id (TEXT FOREIGN KEY)
   - dso (DECIMAL)
   - dio (DECIMAL)
   - dpo (DECIMAL)
   - ccc (DECIMAL)
   - industry_benchmark (TEXT - JSON)
   - created_at (DATETIME)

4. **deal_analysis**
   - id (INTEGER PRIMARY KEY)
   - valuation_id (TEXT FOREIGN KEY)
   - deal_metrics (TEXT - JSON)
   - scenario_analysis (TEXT - JSON)
   - created_at (DATETIME)

5. **completed_improvements**
   - id (INTEGER PRIMARY KEY)
   - valuation_id (TEXT FOREIGN KEY)
   - improvement_key (TEXT)
   - completed_at (DATETIME)

6. **migrations**
   - id (INTEGER PRIMARY KEY)
   - name (TEXT UNIQUE)
   - applied_at (DATETIME)

### Database Backups

#### Creating a Backup

**Manual Backup:**
```bash
# Copy the database file
cp D:\manu\backend\valuation.db D:\manu\backups\valuation_$(date +%Y%m%d_%H%M%S).db

# Or use Docker:
docker cp valuation-app-backend:/app/data/valuation.db ./backup_valuation.db
```

#### Automated Backups

Create a scheduled backup script:

**backup.sh** (Linux/Mac)
```bash
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker cp valuation-app-backend:/app/data/valuation.db $BACKUP_DIR/valuation_$TIMESTAMP.db
# Keep only last 30 days of backups
find $BACKUP_DIR -name "valuation_*.db" -mtime +30 -delete
```

**Add to Crontab** (Linux)
```bash
# Backup daily at 2 AM
0 2 * * * /path/to/backup.sh
```

#### Restoring from Backup

```bash
# Stop the backend service
docker-compose stop backend

# Copy backup back
docker cp ./backup_valuation.db valuation-app-backend:/app/data/valuation.db

# Restart
docker-compose start backend
```

### Database Migrations

#### Understanding Migrations

Migrations track database schema changes in `backend/migrations/`:

```
001_expand_users_table.js
002_create_organizations_table.js
003_create_organization_members_table.js
004_expand_valuations_table.js
005_create_audit_logs_and_preferences.js
006_create_working_capital_analysis_table.js
007_create_deal_analysis_table.js
```

**Migrations Table** tracks which have been applied:
```sql
SELECT * FROM migrations;
```

#### Running Migrations

Migrations run automatically on server start:
```bash
npm start
# Output shows migration status
```

#### Creating a New Migration

Create a new file: `backend/migrations/008_your_migration_name.js`

```javascript
exports.up = async (db, run, get, all) => {
  // Add new schema changes
  await run(`ALTER TABLE users ADD COLUMN new_field TEXT`);
  console.log('✓ Added new_field to users table');
};

exports.down = async (db, run, get, all) => {
  // Rollback changes (optional for SQLite)
  console.log('Rollback not supported');
};
```

### Database Queries

#### Database Tool
```bash
# Access database directly (Linux/Mac)
sqlite3 backend/valuation.db

# Windows PowerShell (if sqlite3 installed)
sqlite3 "backend\valuation.db"

# Or use Docker:
docker exec valuation-app-backend sqlite3 /app/data/valuation.db
```

#### Common Admin Queries

**View System Statistics:**
```sql
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM valuations) as total_valuations,
    (SELECT COUNT(*) FROM working_capital_analysis) as wc_analyses,
    (SELECT COUNT(*) FROM deal_analysis) as deal_analyses;
```

**Most Active Users:**
```sql
SELECT
    u.email,
    COUNT(v.id) as valuation_count,
    MAX(v.created_at) as last_valuation
FROM users u
LEFT JOIN valuations v ON u.id = v.user_id
GROUP BY u.id
ORDER BY valuation_count DESC
LIMIT 10;
```

**Recent Activity:**
```sql
SELECT
    'Valuation' as type,
    u.email,
    v.created_at as timestamp
FROM valuations v
JOIN users u ON v.user_id = u.id
UNION ALL
SELECT
    'Working Capital',
    u.email,
    wc.created_at
FROM working_capital_analysis wc
JOIN valuations v ON wc.valuation_id = v.id
JOIN users u ON v.user_id = u.id
ORDER BY timestamp DESC
LIMIT 20;
```

---

## Monitoring & Maintenance

### Health Checks

#### API Health Endpoint

```bash
curl http://localhost:5000/api/health
# Expected response: {"status":"ok","timestamp":"2025-11-24T..."}
```

#### Container Health

```bash
# Check Docker container status
docker ps

# View container logs
docker logs valuation-app-backend

# Follow logs in real-time
docker logs -f valuation-app-backend
```

#### System Resources

```bash
# Check resource usage
docker stats

# View specific container stats
docker stats valuation-app-backend
```

### Performance Monitoring

#### Check Backend Performance

```bash
# View response times in logs
docker logs valuation-app-backend | grep "time"

# Run performance test
curl -w "\nTime: %{time_total}s\n" http://localhost:5000/api/health
```

#### Database Performance

```sql
-- Check database file size
SELECT page_count * page_size as size_bytes FROM pragma_page_count(), pragma_page_size();

-- Check for slow queries (enable query logging)
PRAGMA query_only = FALSE;
```

### Logging

#### Backend Logs

Logs are output to console by default. To save logs:

```bash
# Redirect logs to file
docker logs valuation-app-backend > backend.log 2>&1

# Follow logs with timestamp
docker logs -f valuation-app-backend --timestamps
```

#### Log Levels

Set in backend/.env:
```env
LOG_LEVEL=info  # info, debug, warn, error
```

### Disk Space Management

#### Check Disk Usage

```bash
# Database file size
du -h backend/valuation.db

# Total Docker volume usage
docker system df
```

#### Clean Up Old Data

```bash
# View valuations older than 1 year
SELECT COUNT(*) FROM valuations WHERE created_at < datetime('now', '-1 year');

# Delete old valuations (if needed)
DELETE FROM valuations WHERE created_at < datetime('now', '-2 years');
```

---

## Troubleshooting

### Common Issues

#### Backend Not Starting

**Error:** `Cannot add a UNIQUE column`

**Cause:** Migration conflict - database already has columns

**Solution:**
```bash
# Delete corrupted database
rm backend/valuation.db

# Restart - will recreate with fresh migrations
npm start
```

**Prevention:** Ensure migration error handling is correct (already fixed in our version)

#### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Cause:** Another process using the port

**Solution:**
```bash
# Find process using port (Linux/Mac)
lsof -i :5000
kill -9 <PID>

# Or change port
PORT=5001 npm start
```

#### Database Lock Error

**Error:** `SQLITE_BUSY: database is locked`

**Cause:** Multiple processes accessing database simultaneously

**Solution:**
```bash
# Restart the backend
docker-compose restart backend

# Or use proper connection pooling (already implemented)
```

#### Frontend Not Connecting to Backend

**Error:** `Failed to fetch` in browser console

**Cause:** Frontend can't reach backend API

**Solution:**
1. Check backend is running: `curl http://localhost:5000/api/health`
2. Check frontend .env: `REACT_APP_API_URL=http://localhost:5000/api`
3. Check CORS settings in backend/server.js
4. Check firewall rules

```javascript
// CORS configuration in backend/server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
```

#### High Memory Usage

**Cause:** Memory leak or inefficient queries

**Solution:**
```bash
# Restart services
docker-compose restart

# Check for large data operations
docker logs valuation-app-backend | grep -i "error\|warning"

# Optimize database
docker exec valuation-app-backend sqlite3 /app/data/valuation.db "VACUUM;"
```

### Debug Mode

#### Enable Debug Logging

```bash
# In backend/.env
LOG_LEVEL=debug
DEBUG=*

# Restart
npm start
```

#### Access Server Console

```bash
# For Docker
docker exec -it valuation-app-backend /bin/sh

# Check node version
node --version

# Run Node REPL
node
```

---

## Deployment & Scaling

### Development to Production Checklist

Before deploying to production:

- [ ] Update all environment variables (.env)
- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up backup strategy
- [ ] Configure firewalls and security groups
- [ ] Enable authentication (JWT)
- [ ] Set up monitoring/alerts
- [ ] Create database backups
- [ ] Test all functionality

### Docker Deployment

#### Building Images

```bash
# Build specific service
docker-compose build backend
docker-compose build frontend

# Build all services
docker-compose build

# Build with custom tag
docker build -t myregistry/valuation-backend:1.0 backend/
```

#### Pushing to Registry

```bash
# Tag image
docker tag manu-backend:latest myregistry/valuation-backend:1.0

# Push to registry
docker push myregistry/valuation-backend:1.0
```

#### Production Deployment

```bash
# Pull latest images
docker pull myregistry/valuation-backend:1.0
docker pull myregistry/valuation-frontend:1.0

# Run with production config
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling Considerations

#### Horizontal Scaling

For multiple backend instances:

```yaml
# docker-compose.prod.yml
services:
  backend-1:
    image: valuation-backend:latest
    ports:
      - "5000:5000"
  backend-2:
    image: valuation-backend:latest
    ports:
      - "5001:5000"

  # Add load balancer (nginx, HAProxy)
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    # Route to backend-1 and backend-2
```

**Database Considerations:**
- SQLite is single-file based (suitable for small to medium deployments)
- For larger scale, migrate to PostgreSQL or MySQL
- Implement connection pooling for multiple backend instances

### Zero-Downtime Deployment

```bash
# 1. Keep running containers
docker-compose up -d

# 2. Build new images
docker-compose build --no-cache

# 3. Update specific service without downtime
docker-compose up -d --no-deps backend

# 4. Verify health
curl http://localhost:5000/api/health

# 5. If issues, rollback to previous version
docker-compose down
docker-compose up -d  # Uses previous images
```

---

## Security & Compliance

### Authentication & Authorization

#### JWT Configuration

```javascript
// backend/middleware/authMiddleware.js
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '24h';

// Tokens expire after 24 hours - users must login again
```

**Token Rotation:**
- Implement refresh tokens for extended sessions
- Short-lived access tokens (15-30 minutes)
- Refresh tokens valid for 7-30 days

#### Protecting Routes

```javascript
// Public routes (no auth required)
app.post('/auth/register');
app.post('/auth/login');
app.get('/api/health');

// Protected routes (auth required)
app.post('/valuations', requireAuth);
app.get('/valuations/:id', requireAuth);
app.post('/valuations/:id/deal/analyze', requireAuth);
```

### Data Security

#### Encryption at Rest

```bash
# Database backups should be encrypted
gpg --symmetric --cipher-algo AES256 backup_valuation.db
# Creates: backup_valuation.db.gpg
```

#### Encryption in Transit

```bash
# Always use HTTPS in production
# Use Let's Encrypt for free SSL certificates
```

#### Sensitive Data Handling

**Password Security:**
- Hashed with bcrypt (already implemented)
- Never stored as plaintext
- Minimum 8 characters enforced

**Token Security:**
- JWTs never include sensitive data
- Stored in httpOnly cookies (more secure than localStorage)
- Include csrf tokens for state-changing operations

### Compliance

#### GDPR Compliance (if applicable)

**User Data Rights:**
```bash
# Export user data
SELECT * FROM users WHERE email = 'user@example.com';

# Delete user data (right to be forgotten)
DELETE FROM users WHERE email = 'user@example.com';
DELETE FROM valuations WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

#### Audit Logging

Track important events:
```sql
-- Create audit table
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    user_id TEXT,
    action TEXT,
    resource TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Log important actions
INSERT INTO audit_logs (user_id, action, resource) VALUES ('user-id', 'create', 'valuation');
```

### Regular Maintenance

#### Security Updates

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm audit fix

# Update packages safely
npm update
```

#### Dependency Management

```bash
# Check outdated packages
npm outdated

# Update to latest versions (caution!)
npm update --save

# Review package-lock.json changes
git diff package-lock.json
```

#### Patch Management

- Apply security patches immediately
- Test in development/staging first
- Use automated tools (Dependabot) for dependency updates

---

## Maintenance Tasks

### Daily Tasks
- [ ] Monitor system health: `docker ps`
- [ ] Check error logs: `docker logs valuation-app-backend | grep error`
- [ ] Verify API health: `curl http://localhost:5000/api/health`

### Weekly Tasks
- [ ] Review user activity and growth
- [ ] Check disk usage: `docker system df`
- [ ] Update dependencies: `npm update`
- [ ] Create database backup

### Monthly Tasks
- [ ] Review security logs
- [ ] Update SSL certificates if needed
- [ ] Performance analysis and optimization
- [ ] User feedback review and feature requests

### Quarterly Tasks
- [ ] Major security audit
- [ ] Update third-party dependencies to latest major version
- [ ] Load testing and capacity planning
- [ ] Disaster recovery drill

---

## Support & Documentation

### Getting Help

- **Backend Issues**: Check `backend/server.js` and middleware
- **Database Issues**: Inspect `backend/db.js`
- **Frontend Issues**: Check `frontend/src` components
- **Docker Issues**: Review `docker-compose.yml`

### Additional Resources

- Docker Documentation: https://docs.docker.com/
- Node.js Documentation: https://nodejs.org/docs/
- SQLite Documentation: https://www.sqlite.org/docs.html
- React Documentation: https://react.dev/

### Contact Technical Support

For production issues:
- Document error messages and logs
- Include steps to reproduce
- Note system configuration
- Attach relevant log files

---

## Conclusion

This guide covers the main administrative tasks for managing the Business Valuation & Improvement App. Key takeaways:

1. **Regular backups** prevent data loss
2. **Monitoring** catches issues early
3. **Security** protects user data
4. **Updates** maintain stability and security
5. **Documentation** helps troubleshooting

For detailed technical questions, refer to the inline code comments in the source files.
