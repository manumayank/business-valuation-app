# Docker Quick Reference

## 🚀 Start the App
```bash
docker-compose up --build
```
Then open: `http://localhost:3000`

## 🛑 Stop the App
```bash
docker-compose down
```

## 📋 Common Commands

| Command | Purpose |
|---------|---------|
| `docker-compose up` | Start services |
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop and remove containers |
| `docker-compose down -v` | Stop and delete database |
| `docker-compose logs -f` | View live logs |
| `docker-compose logs backend` | View backend logs |
| `docker-compose ps` | List running containers |
| `docker-compose build --no-cache` | Rebuild images from scratch |
| `docker-compose restart` | Restart services |

## 🔧 Troubleshooting

**Port already in use?**
```bash
# Edit docker-compose.yml and change ports, then:
docker-compose up --build
```

**Can't connect to backend?**
```bash
docker-compose logs frontend
docker-compose exec frontend ping backend
```

**Reset everything?**
```bash
docker-compose down -v
docker-compose up --build
```

## 📊 Monitor Services

```bash
# Check status
docker-compose ps

# View resource usage
docker stats

# View logs
docker-compose logs --tail=50 -f
```

## 📝 Service Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Database**: SQLite (persisted in Docker volume)

## 🔐 Security

- Never commit `.env` files with secrets
- Use environment variables for configuration
- Images use Alpine Linux for small size
- Health checks ensure service availability

## 🚢 Deploy to Cloud

See [DOCKER.md](DOCKER.md) for detailed deployment instructions for:
- AWS ECS
- Docker Hub
- Heroku
- Other platforms

---

For complete documentation, see [DOCKER.md](DOCKER.md)
