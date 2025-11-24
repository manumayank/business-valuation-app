# Quick Start Guide - Business Valuation & Improvement App

## For First-Time Users

### 1. Access the Application
```
Go to: http://localhost:3000
```

### 2. Create Your Account
1. Click **"Create Account"**
2. Enter: Email, Password, Name, Company (optional)
3. Click **"Register"**

### 3. Start Your Valuation
1. Click **"Start Business Valuation"**
2. Answer 6 sections of questions about your business
3. Click **"Calculate Valuation"**
4. View your estimated business value!

### 4. Improve Your Value
1. Review **"Recommended Improvements"** section
2. Implement improvements in your business
3. Click **"Mark as Completed"**
4. Watch your valuation increase!

### 5. Export Your Results
1. Scroll to **"Export Report"** section
2. Choose: Standard, Lite, or Premium report
3. Click **"Generate PDF"**
4. Share with investors, lenders, or partners

---

## For Admins - Quick Setup

### 1. Start the Application

#### Option A: Docker (Easiest)
```bash
cd D:\manu
docker-compose up --build
```

#### Option B: Local Development
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start
# Runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### 2. Verify Everything Works
```bash
# Check backend health
curl http://localhost:5000/api/health
# Expected: {"status":"ok"}

# Check frontend
curl http://localhost:3000
# Expected: HTML content
```

### 3. Docker Container Status
```bash
docker ps
# Should show both backend and frontend as "Up (healthy)"
```

### 4. Access Database
```bash
# Connect to database
docker exec -it valuation-app-backend sqlite3 /app/data/valuation.db

# View all users
SELECT id, email, full_name FROM users;
```

---

## Key Features Overview

### For Users

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Business Valuation** | Main Wizard | Calculates estimated business value |
| **Dashboard** | Main Screen | Shows valuation, drivers, improvements |
| **Improvements** | Dashboard | Track value-add initiatives |
| **Working Capital** | Dashboard Section | Optimize cash flow |
| **Deal Analysis** | Dashboard Section | Evaluate M&A opportunities |
| **PDF Export** | Dashboard | Generate shareable reports |
| **Share Link** | Dashboard | Create secure public links |

### For Admins

| Task | Command | Purpose |
|------|---------|---------|
| **Start Services** | `docker-compose up` | Run all containers |
| **Stop Services** | `docker-compose down` | Stop all containers |
| **View Logs** | `docker logs -f backend` | Monitor application |
| **Check Health** | `curl localhost:5000/api/health` | Verify API working |
| **Backup DB** | `docker cp container:/app/data/valuation.db ./backup.db` | Backup database |
| **Reset DB** | `docker-compose down -v` | Clear all data |

---

## Common Tasks

### User: Update Valuation
1. On Dashboard, click **"Update Data & Recalculate"**
2. Make changes to any field
3. Click **"Save Changes"**
4. View updated valuation and improvements

### User: Export for Investor
1. Go to **"Export Report"** section
2. Choose **"Premium Report"** (most detailed)
3. Download PDF
4. Email or share with investor

### Admin: Monitor System
```bash
# Check container status
docker ps

# View backend logs
docker logs -f valuation-app-backend

# Check resource usage
docker stats

# Database health check
docker exec valuation-app-backend sqlite3 /app/data/valuation.db "SELECT COUNT(*) FROM users;"
```

### Admin: Backup Database
```bash
# Manual backup
docker cp valuation-app-backend:/app/data/valuation.db ./valuation_$(date +%Y%m%d).db

# Compress backup
gzip valuation_20251124.db
```

---

## Troubleshooting

### "Connection Refused" Error
**Problem:** Frontend can't connect to backend

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:5000/api/health

# 2. Verify frontend .env has correct API URL
cat frontend/.env
# Should have: REACT_APP_API_URL=http://localhost:5000/api

# 3. Check Docker logs
docker logs valuation-app-backend
```

### "Container is unhealthy"
**Problem:** Backend container shows unhealthy status

**Solution:**
```bash
# 1. Check container logs
docker logs valuation-app-backend

# 2. Restart container
docker-compose restart backend

# 3. Check health endpoint
docker exec valuation-app-backend wget -q --tries=1 --spider http://localhost:5000/api/health && echo "Healthy" || echo "Unhealthy"
```

### Database Locked Error
**Problem:** "SQLITE_BUSY: database is locked"

**Solution:**
```bash
# Restart backend service
docker-compose restart backend

# Or reset database completely
docker-compose down
docker-compose up --build
```

### Port Already in Use
**Problem:** "Address already in use :::5000"

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

---

## File Structure Reference

```
D:\manu\
├── backend/                    # Node.js/Express backend
│   ├── server.js              # Main server file
│   ├── db.js                  # Database setup
│   ├── valuationEngine.js      # Valuation calculations
│   ├── migrations/             # Database migrations
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic
│   ├── middleware/             # Authentication
│   ├── Dockerfile              # Container config
│   └── package.json            # Dependencies
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.js             # Main app component
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API calls
│   │   └── styles/            # CSS files
│   ├── Dockerfile              # Container config
│   └── package.json            # Dependencies
│
├── docker-compose.yml          # Multi-container config
├── USER_GUIDE.md              # User documentation
├── ADMIN_GUIDE.md             # Admin documentation
└── valuation.db               # SQLite database (created after first run)
```

---

## Important Ports & URLs

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 5000 | http://localhost:5000 |
| API Health Check | 5000 | http://localhost:5000/api/health |
| Database | N/A | File: /app/data/valuation.db |

---

## Environment Setup

### Before First Run

**Check Node.js Version:**
```bash
node --version  # Should be v18+
npm --version   # Should be v8+
```

**Install Docker (if using containers):**
- Download: https://www.docker.com/products/docker-desktop
- Verify: `docker --version`

**Install Dependencies (if local):**
```bash
cd backend && npm install
cd frontend && npm install
```

---

## Next Steps

### For New Users:
1. ✅ Create account at http://localhost:3000
2. ✅ Complete valuation wizard
3. ✅ Review your business dashboard
4. ✅ Implement improvements
5. ✅ Export PDF report
6. 📚 See **USER_GUIDE.md** for detailed help

### For Administrators:
1. ✅ Start services with `docker-compose up`
2. ✅ Verify health with `curl http://localhost:5000/api/health`
3. ✅ Set up regular backups
4. ✅ Monitor application logs
5. 📚 See **ADMIN_GUIDE.md** for detailed administration

---

## Support & Resources

### Getting Help

**User Help:**
- Hover over fields for hints and examples
- Check **USER_GUIDE.md** for detailed explanations
- Email support: support@app.com

**Admin Help:**
- Check **ADMIN_GUIDE.md** for system administration
- Review application logs: `docker logs -f backend`
- Database queries: `docker exec backend sqlite3 /app/data/valuation.db`

### Documentation Files
- **USER_GUIDE.md** - Complete user documentation (10,000+ words)
- **ADMIN_GUIDE.md** - Complete admin documentation (8,000+ words)
- **QUICK_START_GUIDE.md** - This file (quick reference)

---

## Quick Checklist

### First Run Checklist
- [ ] Clone/download application
- [ ] Install Node.js v18+ or Docker
- [ ] Run `docker-compose up` (or `npm start` in each terminal)
- [ ] Access http://localhost:3000
- [ ] Create test account
- [ ] Run valuation wizard
- [ ] View dashboard
- [ ] Export PDF report

### Deployment Checklist
- [ ] Update environment variables (.env)
- [ ] Change JWT_SECRET to random value
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Test all features
- [ ] Create admin user

---

## Common Command Reference

```bash
# Start application
docker-compose up --build

# Stop application
docker-compose down

# View logs
docker logs -f valuation-app-backend
docker logs -f valuation-app-frontend

# Check health
curl http://localhost:5000/api/health

# Access database
docker exec -it valuation-app-backend sqlite3 /app/data/valuation.db

# Restart specific service
docker-compose restart backend

# View running containers
docker ps

# Backup database
docker cp valuation-app-backend:/app/data/valuation.db ./backup.db

# Clean up Docker
docker system prune -a
```

---

## Tips for Success

1. **Keep backups**: Backup database weekly
2. **Monitor health**: Check health endpoint daily
3. **Update regularly**: Apply security patches promptly
4. **Test changes**: Test in dev environment first
5. **Document changes**: Keep notes of configuration changes
6. **Communicate**: Let users know about maintenance windows
7. **Automate**: Set up automated backups and monitoring

---

**For detailed information, see:**
- 📖 Full User Guide: **USER_GUIDE.md**
- 📖 Full Admin Guide: **ADMIN_GUIDE.md**

Good luck! 🚀
