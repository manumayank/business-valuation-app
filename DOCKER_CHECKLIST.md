# Docker Setup Checklist

## ✅ Pre-Launch Checklist

Before running the application for the first time, verify:

### System Requirements
- [ ] Docker Desktop installed (v20.10+)
- [ ] Docker Compose installed (v1.29+)
- [ ] Minimum 2GB free disk space
- [ ] Minimum 2GB RAM available
- [ ] Ports 3000 and 5000 not in use
- [ ] Internet connection for initial image download

### Verify Installation
```bash
docker --version
docker-compose --version
```

### Files Created
- [ ] `docker-compose.yml` - Service orchestration
- [ ] `backend/Dockerfile` - Backend image
- [ ] `backend/.dockerignore` - Build optimization
- [ ] `frontend/Dockerfile` - Frontend image
- [ ] `frontend/.dockerignore` - Build optimization
- [ ] `frontend/nginx.conf` - Web server config
- [ ] `DOCKER.md` - Complete documentation
- [ ] `DOCKER_QUICK_REFERENCE.md` - Quick commands
- [ ] `DOCKER_SETUP_SUMMARY.md` - Setup overview
- [ ] `start-docker.bat` - Windows launcher
- [ ] `start-docker.sh` - macOS/Linux launcher

## 🚀 First-Time Launch

### Step 1: Verify Prerequisites
```bash
# Check Docker
docker ps

# This should show no errors and either list containers or be empty
```

### Step 2: Start Services

**Option A: Using the launcher script**

Windows:
```bash
start-docker.bat
```

macOS/Linux:
```bash
./start-docker.sh
```

**Option B: Using docker-compose directly**
```bash
docker-compose up --build
```

### Step 3: Wait for Services
Watch the console output for:
- ✅ Backend service starts on port 5000
- ✅ Frontend service starts on port 3000
- ✅ Both services show "healthy" in logs

Expected output:
```
valuation-app-backend  | Database initialized
valuation-app-backend  | Server running on port 5000
valuation-app-frontend | Listening on port 3000
```

### Step 4: Access the Application
```
Frontend: http://localhost:3000
API: http://localhost:5000/api
```

### Step 5: Test the Application
1. Open http://localhost:3000 in browser
2. Fill out the wizard with sample data (from SETUP.md)
3. Submit and verify valuation calculation works
4. Check that dashboard displays results

## 📊 Verify Services Running

### Check Container Status
```bash
docker-compose ps
```

Should show:
```
NAME                         COMMAND      STATUS
valuation-app-backend        node server.js    Up (healthy)
valuation-app-frontend       nginx -g...       Up
```

### Check Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Test Connectivity
```bash
# Test frontend can reach backend
docker-compose exec frontend ping backend

# Should respond with packets
```

## 🔧 Troubleshooting Checklist

### Port Already in Use
- [ ] Check what's using port 3000: `netstat -ano | findstr :3000` (Windows)
- [ ] Check what's using port 5000: `netstat -ano | findstr :5000` (Windows)
- [ ] Kill conflicting processes OR change ports in docker-compose.yml

### Build Fails
- [ ] Delete old images: `docker system prune -a`
- [ ] Clear build cache: `docker-compose build --no-cache`
- [ ] Check internet connection
- [ ] Verify 2GB+ free disk space

### Services Won't Start
- [ ] Verify Docker daemon is running
- [ ] Check Docker resources (CPU, RAM, disk)
- [ ] View detailed logs: `docker-compose logs -f`
- [ ] Try: `docker-compose down && docker-compose up --build`

### Frontend Can't Reach Backend
- [ ] Verify both containers are running: `docker-compose ps`
- [ ] Check network: `docker-compose exec frontend ping backend`
- [ ] Verify REACT_APP_API_URL is correct
- [ ] Check backend logs for errors

### Database Issues
- [ ] Reset database: `docker-compose down -v && docker-compose up --build`
- [ ] Check volume: `docker volume ls | grep valuation`
- [ ] Inspect volume: `docker volume inspect valuation_data`

## 🧹 Cleanup Checklist

### Stop Services Temporarily
```bash
docker-compose stop
```

### Stop and Remove Containers
```bash
docker-compose down
```

### Stop, Remove Containers, and Delete Database
```bash
docker-compose down -v
```

### Remove All Docker Resources
```bash
docker system prune -a
```

### Remove Only Valuation App Resources
```bash
docker-compose down -v
docker image rm valuation-app-backend:latest
docker image rm valuation-app-frontend:latest
docker network rm manu_valuation-network
```

## 📈 Performance Checklist

### Monitor Resource Usage
```bash
docker stats
```

Check:
- [ ] CPU usage < 50% per service
- [ ] Memory usage reasonable (backend ~100MB, frontend ~50MB)
- [ ] No memory leaks (stable usage over time)

### Monitor Response Times
Test with sample data and verify:
- [ ] Frontend loads in < 3 seconds
- [ ] API endpoint responds in < 1 second
- [ ] Valuation calculation completes in < 5 seconds

## 🔒 Security Checklist

### Before Production Deployment
- [ ] Change default ports if needed
- [ ] Use environment variables for secrets (not in code)
- [ ] Scan images for vulnerabilities: `docker scan valuation-app-backend`
- [ ] Use specific base image versions (not `latest`)
- [ ] Configure CORS appropriately
- [ ] Enable HTTPS/TLS in production
- [ ] Set resource limits in docker-compose.yml
- [ ] Use secrets management for sensitive data

### Docker Hub Upload (If Applicable)
- [ ] [ ] Create Docker Hub account
- [ ] Tag images: `docker tag valuation-app-backend yourusername/valuation-app-backend`
- [ ] Push: `docker push yourusername/valuation-app-backend`
- [ ] Never push images with secrets embedded

## 📚 Documentation Review Checklist

Read in this order:
1. [ ] **DOCKER_SETUP_SUMMARY.md** - Overview and quick start
2. [ ] **DOCKER_QUICK_REFERENCE.md** - Common commands
3. [ ] **DOCKER.md** - Detailed guide and troubleshooting
4. [ ] **SETUP.md** - Test data and sample scenarios

## 🚀 Production Deployment Checklist

### Before Going Live
- [ ] Services pass all tests in Docker environment
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] Rollback plan documented
- [ ] Performance tested under expected load
- [ ] Security assessment completed
- [ ] Documentation updated for team

### Deployment Platform Setup
- [ ] AWS ECS cluster configured (if using AWS)
- [ ] Docker Hub repository created (if using Docker Hub)
- [ ] Heroku app created (if using Heroku)
- [ ] SSL/TLS certificates obtained
- [ ] Environment variables configured on platform

## ✨ Success Criteria

Your Docker setup is working correctly when:

- [ ] `docker-compose up --build` completes without errors
- [ ] Both services show "Up" in `docker-compose ps`
- [ ] Frontend loads at http://localhost:3000
- [ ] Wizard form displays all fields correctly
- [ ] Form submission calculates valuation successfully
- [ ] Dashboard displays results with drivers and gaps
- [ ] Marking improvements updates valuation
- [ ] No errors in `docker-compose logs -f`
- [ ] Services respond within expected times

## 🎓 Next Steps

Once everything is verified:

1. **Review Documentation**
   - Read DOCKER.md for advanced features
   - Check DOCKER_QUICK_REFERENCE.md for fast lookups

2. **Customize Configuration**
   - Adjust ports if needed
   - Set up environment variables
   - Configure resource limits

3. **Plan Deployment**
   - Choose hosting platform
   - Set up CI/CD pipeline
   - Configure monitoring

4. **Maintain Services**
   - Monitor logs regularly
   - Update base images
   - Back up database

---

**All done!** 🎉

You're ready to develop, test, and deploy using Docker!

For help: See DOCKER.md or run `docker-compose --help`
