# Docker Quick Start - Run Valuation App with Docker Compose

**Time Required**: 5-10 minutes (first run includes build)
**Requirements**: Docker and Docker Compose installed

---

## Prerequisites Check

Run these commands to verify Docker is installed:

```bash
docker --version
docker-compose --version
```

If not installed, download from: https://www.docker.com/products/docker-desktop

---

## Run with Docker Compose (Recommended)

### Step 1: Navigate to Project Root

```bash
cd /path/to/manu
```

### Step 2: Build and Start Services

```bash
docker-compose up --build
```

**First run**: This will take 2-5 minutes as it:
- Builds the backend Docker image
- Builds the frontend Docker image
- Starts both containers
- Initializes the database
- Runs all migrations automatically

**Subsequent runs**: Much faster (10-30 seconds)

### Step 3: Wait for Services to Start

Watch the logs for these messages:

```
backend      | ✓ Database initialized
backend      | ✓ Migrations completed
backend      | 🚀 Server running on http://localhost:5000

frontend     | Starting nginx...
```

### Step 4: Access the Application

Open your browser and go to:

```
http://localhost:3000
```

You should see the **Login page**.

---

## Test the Application

### Create Account:
1. Click "Create one" link
2. Fill in:
   - Full Name: Test User
   - Email: test@docker.com
   - Company: TestCorp
   - Password: DockerTest123!
3. Click "Create Account"

### Fill Valuation Wizard:
1. Step 1 - Company Info:
   - Name: "Docker Test Company"
   - Industry: "Technology / Software"
2. Step 2 - Financials:
   - Revenue: $2,000,000
   - EBITDA: $400,000
3. Step 3 - Operations:
   - Years: 3
   - Employees: 12
4. Step 4 - Growth:
   - Growth Rate: 20%
   - Profit Margin: 20%
   - Retention: 90%
5. Step 5 - Risk:
   - Customer Concentration: 20%
   - Debt Level: 35%

### View Dashboard:
Should display:
- ✅ Valuation Amount (~$8-10M)
- ✅ Three valuation methods
- ✅ Risk analysis with 5 categories
- ✅ Value drivers
- ✅ Performance gaps
- ✅ Improvement suggestions

---

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose stop
```

### Stop and Remove Everything
```bash
docker-compose down
```

### Stop and Remove with Database Reset
```bash
docker-compose down -v
```

### Run in Background
```bash
docker-compose up -d
```

### Restart Services
```bash
docker-compose restart
```

### Check Status
```bash
docker-compose ps
```

---

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

**Option 1**: Change ports in `docker-compose.yml`
```yaml
services:
  backend:
    ports:
      - "5001:5000"  # Changed to 5001
  frontend:
    ports:
      - "3001:3000"  # Changed to 3001
```

Then access at: `http://localhost:3001`

**Option 2**: Kill the process using the port (Linux/Mac)
```bash
# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Frontend Can't Connect to Backend

Check the logs:
```bash
docker-compose logs frontend
```

This usually means:
- Backend container didn't start properly
- Network connection issue
- API URL misconfiguration

Solution:
```bash
docker-compose down -v
docker-compose up --build
```

### Services Won't Start

Check logs for errors:
```bash
docker-compose logs backend
```

Common issues:
- Insufficient disk space
- Old image cached: Use `--no-cache` flag
- Permission issues

Solution:
```bash
docker-compose build --no-cache
docker-compose up
```

### Database Issues

Reset database (clears all data):
```bash
docker-compose down -v
docker-compose up --build
```

---

## View Container Details

### Check Running Containers
```bash
docker ps
```

### Check All Containers (including stopped)
```bash
docker ps -a
```

### View Container Logs
```bash
docker logs container_name
```

### Access Container Shell
```bash
docker exec -it valuation-app-backend sh
docker exec -it valuation-app-frontend sh
```

---

## Database Backup

### Backup Database
```bash
docker run --rm -v valuation_data:/data -v $(pwd):/backup \
  alpine cp /data/valuation.db /backup/valuation.db.backup
```

### Restore Database
```bash
docker run --rm -v valuation_data:/data -v $(pwd):/backup \
  alpine cp /backup/valuation.db.backup /data/valuation.db
```

---

## Monitor Resource Usage

View CPU and memory usage:
```bash
docker stats
```

---

## Environment Variables

To customize settings, edit `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=5000
  - DATABASE_PATH=/app/data/valuation.db
  - REACT_APP_API_URL=http://localhost:5000/api
```

Or create a `.env` file in the project root.

---

## Docker Images

### View Images
```bash
docker images
```

### Remove Unused Images
```bash
docker image prune
```

### Rebuild Without Cache
```bash
docker-compose build --no-cache
```

---

## Clean Up Everything

Remove all containers, images, and volumes:
```bash
docker-compose down -v
docker system prune -a
```

⚠️ **Warning**: This will delete all your local data!

---

## Performance Tips

### For Slower Machines

Reduce resource usage in `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
```

### For Faster Builds

Use BuildKit:
```bash
DOCKER_BUILDKIT=1 docker-compose build
```

---

## Testing Different Industries

The app now supports 6 industries:
- Technology / Software
- Retail
- Services
- Manufacturing
- Healthcare
- Finance / Insurance

Try creating valuations for different industries to see how:
- Risk scores vary
- Valuation multiples change
- Drivers and gaps differ

---

## Deployment

### Push to Docker Hub
```bash
docker build -t yourusername/valuation-backend:latest ./backend
docker build -t yourusername/valuation-frontend:latest ./frontend
docker push yourusername/valuation-backend:latest
docker push yourusername/valuation-frontend:latest
```

### Deploy to AWS, Heroku, or Other Platforms
See `DOCKER.md` for detailed cloud deployment instructions.

---

## System Architecture (Docker)

```
┌─────────────────────────────────────────────────────┐
│            Docker Compose Network                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │   Frontend       │      │   Backend        │   │
│  │   (nginx:3000)   │◄────►│   (node:5000)    │   │
│  │                  │      │                  │   │
│  │ React App        │      │ Express API      │   │
│  │ Routing          │      │ Auth System      │   │
│  │ Validation       │      │ Valuation Engine │   │
│  └──────────────────┘      └──────────────────┘   │
│                                     │              │
│                                     ▼              │
│                           ┌──────────────────┐    │
│                           │ valuation_data   │    │
│                           │ (SQLite Volume)  │    │
│                           └──────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Run `docker-compose up --build`
2. ✅ Test at http://localhost:3000
3. ✅ Create account and try a valuation
4. ✅ Review the enhanced dashboard
5. ✅ View logs: `docker-compose logs -f`
6. ✅ Stop with: `Ctrl+C` or `docker-compose down`

---

## For Development (Without Docker)

If you prefer to run without Docker:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

See `TESTING_WALKTHROUGH.md` for dev setup details.

---

## Getting Help

- Docker issues: `docker-compose logs backend` or `docker-compose logs frontend`
- App issues: Check browser console (F12)
- Database issues: `docker-compose down -v && docker-compose up --build`

---

**You're ready! Run `docker-compose up --build` and start testing! 🚀**
