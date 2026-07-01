# Production Deployment Playbook

This playbook explains how to transition the DevArena Coding Practice Platform from local development to a production-grade cloud environment.

---

## 1. Internal Connection Registry

In production, the services communicate using internal Docker network DNS names:
* **Database Connection:** `DATABASE_URL=postgresql+psycopg2://postgres:securepassword@db:5432/coding_platform`
* **Redis Cache & Queue Broker:** `REDIS_URL=redis://:securepassword@redis:6379/0`
* **Judge0 Sandbox API:** `JUDGE0_URL=http://server:2358`
* **AI microservice:** `AI_SERVICE_URL=http://ai-service:8080`

---

## 2. Production Docker Architecture (Single VPS)

For a standard VPS node (2 vCPUs, 4 GB RAM), we run a unified isolated bridge network setup. The databases are isolated on an internal network, and only the FastAPI gateway exposing port `8000` is open to the public internet (or proxied behind Nginx/SSL).

### Production `docker-compose.yml` Structure

```yaml
version: "3.8"

services:
  # Database Storage (Isolated)
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=securepassword
      - POSTGRES_DB=coding_platform
    ports:
      - "127.0.0.1:5432:5432" # Local access only
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - backend-net

  # Redis Caching, Limiting & Queue (Isolated)
  redis:
    image: redis:7-alpine
    command: ["redis-server", "--requirepass", "securepassword"]
    ports:
      - "127.0.0.1:6379:6379" # Local access only
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - backend-net

  # Custom Compilers Judge0 server (Isolated)
  server:
    image: judge0-server:custom
    volumes:
      - ./judge0/judge0.conf:/judge0.conf:ro
    privileged: true
    restart: unless-stopped
    networks:
      - backend-net

  worker:
    image: judge0-worker:custom
    privileged: true
    user: root
    restart: unless-stopped
    networks:
      - backend-net

  # AI Service Microservice (Isolated)
  ai-service:
    image: devarena-ai:latest
    restart: unless-stopped
    networks:
      - backend-net

  # Web API Gateway (Exposed)
  backend-api:
    image: devarena-backend:latest
    ports:
      - "8000:8000" # Public gateway
    environment:
      - DATABASE_URL=postgresql+psycopg2://postgres:securepassword@db:5432/coding_platform
      - JUDGE0_URL=http://server:2358
      - REDIS_URL=redis://:securepassword@redis:6379/0
      - AI_SERVICE_URL=http://ai-service:8080
    depends_on:
      - db
      - redis
      - server
    restart: unless-stopped
    networks:
      - frontend-net
      - backend-net

volumes:
  postgres_data:
  redis_data:

networks:
  frontend-net:
  backend-net:
```

---

## 3. Production Hardening Checklist

### 1. Configure Host Cgroups v2
Native cgroups v2 must be enabled on the host Linux kernel (Ubuntu 22.04 LTS handles this automatically). The Judge0 worker requires privileged status to mount the box sandboxes under `/sys/fs/cgroup`.

### 2. Sandbox Security Controls
Ensure network connectivity is disabled for executions run inside Judge0 to prevent students from requesting external APIs or conducting DDOS attacks:
* Set `allow_network = false` in your `judge0.conf` file.
* Restrict execution resources to prevent Fork Bombs or memory hogging:
  * Maximum execution time: `5.0` seconds.
  * Maximum memory limit: `256` MB.
  * Maximum process forks: `15`.

### 3. API Protection (Sliding Window Limits)
Our Redis implementation in `backend/app/utils/rate_limit.py` protects endpoints from brute force:
* `/run` and `/submit` are limited to **5 invocations per minute** per client IP.
* `/login` is limited to **5 attempts per minute** to prevent account cracking.

### 4. Database Schema Migrations (Alembic)
To upgrade schema structures in production without deleting data:
1. Generate the migration file on the host:
   ```bash
   docker compose exec backend-api alembic revision --autogenerate -m "Add index fields"
   ```
2. Apply the migration online:
   ```bash
   docker compose exec backend-api alembic upgrade head
   ```
