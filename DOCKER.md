# Docker Setup Guide

This guide explains how to run the Business Valuation & Improvement App using Docker and Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v1.29+)

Verify installation:
```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Build and Run with Docker Compose

From the project root directory, run:

```bash
docker-compose up --build
```

This command will:
- Build both frontend and backend Docker images
- Start the backend service on port 5000
- Start the frontend service on port 3000
- Create a shared network for communication
- Initialize the database volume for data persistence

### 2. Access the Application

Once the services are running, open your browser and navigate to:

```
http://localhost:3000
```

The frontend will automatically connect to the backend API.

### 3. Stop the Application

Press `Ctrl+C` in the terminal, or run:

```bash
docker-compose down
```

To also remove the database volume and start fresh:

```bash
docker-compose down -v
```

## Common Docker Compose Commands

### Run in Background
```bash
docker-compose up -d
```

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

### Restart Services
```bash
docker-compose restart
```

### Remove Everything (Images, Containers, Networks)
```bash
docker-compose down -v
```

## Architecture

### Backend Container
- **Image**: Node.js 18 Alpine (lightweight)
- **Port**: 5000
- **Database**: SQLite persisted in Docker volume
- **Health Check**: Automatic service verification every 10 seconds

### Frontend Container
- **Image**: Nginx Alpine (optimized for static content)
- **Port**: 3000
- **Build**: React production build
- **Features**: Gzip compression, caching headers, API proxy

### Networking
- Both services run on a shared Docker bridge network (`valuation-network`)
- Frontend can communicate with backend via `http://backend:5000`
- Database data persists in the `valuation_data` volume

## Development vs Production

### For Development (Without Docker)
```bash
cd backend && npm install && npm start
# In another terminal:
cd frontend && npm install && npm start
```

### For Production (With Docker)
```bash
docker-compose up -d
```

Docker images include production optimizations:
- Multi-stage builds reduce image size
- Nginx serves static files efficiently
- Dumb-init ensures proper signal handling
- Health checks monitor service availability

## Advanced Usage

### Custom Port Mapping

Edit `docker-compose.yml` to change ports:

```yaml
services:
  backend:
    ports:
      - "5001:5000"  # Maps container port 5000 to host port 5001
  frontend:
    ports:
      - "3001:3000"  # Maps container port 3000 to host port 3001
```

Then run:
```bash
docker-compose up --build
```

### Environment Variables

Edit `docker-compose.yml` environment section or create a `.env` file:

```bash
# .env file in project root
NODE_ENV=production
PORT=5000
DATABASE_PATH=/app/data/valuation.db
```

### Building Images Separately

Build backend only:
```bash
docker build -t valuation-backend:latest ./backend
```

Build frontend only:
```bash
docker build -t valuation-frontend:latest ./frontend
```

### Running Individual Containers

After building, run backend:
```bash
docker run -p 5000:5000 -v valuation_data:/app/data valuation-backend:latest
```

Run frontend:
```bash
docker run -p 3000:3000 valuation-frontend:latest
```

## Database Persistence

Database data is stored in the Docker volume `valuation_data`. This means:
- Data persists even when containers are stopped
- Data is shared between container restarts
- Volume is created automatically by Docker Compose

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

## Troubleshooting

### Containers Won't Start

Check logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

Common issues:
- Port already in use: Change ports in `docker-compose.yml`
- Insufficient disk space: Free up space and try again
- Old image cached: Use `docker-compose build --no-cache`

### Frontend Can't Connect to Backend

Verify services are running:
```bash
docker-compose ps
```

Check network connectivity:
```bash
docker-compose exec frontend ping backend
```

View frontend logs:
```bash
docker-compose logs frontend
```

### Database Issues

Reset database:
```bash
docker-compose down -v
docker-compose up --build
```

### High Memory Usage

Reduce resource limits in `docker-compose.yml`:

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

## Deploying to Cloud

### AWS ECS
```bash
# Build and push to ECR
docker build -t valuation-backend:latest ./backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag valuation-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/valuation-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/valuation-backend:latest
```

### Docker Hub
```bash
docker build -t yourusername/valuation-backend:latest ./backend
docker push yourusername/valuation-backend:latest
```

### Heroku
```bash
heroku container:push web
heroku container:release web
```

## Performance Optimization

### Frontend Optimizations
- React production build included in Docker image
- Nginx serves pre-built static files
- Gzip compression enabled
- Browser caching configured with proper headers

### Backend Optimizations
- Node.js Alpine image (minimal size)
- Production dependencies only
- Dumb-init for proper signal handling
- Health checks prevent zombie containers

### Build Optimization
- Multi-stage builds reduce final image size
- Only necessary files copied to final image
- `.dockerignore` excludes unnecessary files

## Security Best Practices

1. **Use specific base image versions** (not `latest`)
   - Backend: `node:18-alpine`
   - Frontend: `nginx:alpine`

2. **Don't run as root** (already configured)

3. **Scan images for vulnerabilities**
   ```bash
   docker scan valuation-backend:latest
   docker scan valuation-frontend:latest
   ```

4. **Keep dependencies updated**
   ```bash
   # Update package.json versions and rebuild
   docker-compose build --no-cache
   ```

5. **Use environment variables for secrets** (not hardcoded)

6. **Network isolation**: Services only accessible on Docker network

## Monitoring

### Health Status
```bash
docker-compose ps
```

### View Resource Usage
```bash
docker stats
```

### See Event Logs
```bash
docker-compose logs --tail=100 -f
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js in Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

## Next Steps

1. Run `docker-compose up --build` to start the application
2. Access it at `http://localhost:3000`
3. Test with sample data from SETUP.md
4. Explore the logs to understand how services communicate
5. Customize docker-compose.yml for your deployment needs
