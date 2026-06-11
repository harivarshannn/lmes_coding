# Production Deployment Playbook

This playbook explains how to transition the Coding Assessment Execution Service from a local Windows development environment (WSL2 / Docker Desktop) to a production-grade cloud deployment.

---

## 1. How the Backend Connects to Judge0 in Production

In development under Windows, WSL2 acts as a virtual machine. In production, your cloud server will run a **native Linux OS** (such as Ubuntu 22.04 LTS), so WSL is not required.

The backend communicates with Judge0 using the `JUDGE0_URL` environment variable:
*   **Locally:** `JUDGE0_URL=http://host.docker.internal:2358`
*   **In Production:** This will be changed to the internal Docker service name (e.g., `http://judge0-server:2358`) or the private IP address of your dedicated Judge0 server.

---

## 2. Deployment Architectures

### Option A: Single-Server Deployment (Docker Compose) — *Easiest & Cost-Effective*
In this setup, your FastAPI application, database, and Judge0 components all run on a single Virtual Private Server (VPS) (e.g., AWS EC2, DigitalOcean Droplet, Linode) using Docker Compose.

#### Step 1: Combine the Networks
Create a single `docker-compose.prod.yml` file that places both your backend app and Judge0 services on the same Docker bridge network.

```yaml
version: "3.8"

networks:
  lmes-network:
    driver: bridge

services:
  # --- Backend Services ---
  web:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+psycopg2://postgres:securepassword@db:5432/coding_platform
      - JUDGE0_URL=http://judge0-server:2358  # Internal Docker DNS
    networks:
      - lmes-network
    depends_on:
      - db

  db:
    image: postgres:16.2
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=securepassword
      - POSTGRES_DB=coding_platform
    volumes:
      - pg_data:/var/lib/postgresql/data
    networks:
      - lmes-network

  # --- Judge0 Services ---
  judge0-server:
    image: judge0/judge0:latest # Or your custom lightweight image
    ports:
      - "2358:2358"
    privileged: true
    networks:
      - lmes-network

  judge0-worker:
    image: judge0/judge0:latest
    privileged: true
    user: root
    networks:
      - lmes-network
    # Include cgroup v2 startup command here...
    
  # Redis and Judge0 DB services here...
```

---

### Option B: Scaled Deployment (Multi-Server) — *Recommended for Production*
For high traffic, you should separate the backend API from the execution workers. Running untrusted code on the same server hosting your main API can cause latency spikes.

```
                  [ Student Client ]
                           │
                           ▼
              ┌────────────────────────┐
              │   Node.js LMS Portal   │
              └────────────┬───────────┘
                           │ (Internal API call)
                           ▼
              ┌────────────────────────┐
              │  FastAPI API Backend   │
              └────────────┬───────────┘
                           │ (HTTP request via Private Network)
                           ▼
              ┌────────────────────────┐
              │  Dedicated Judge0 VM   │
              └────────────────────────┘
```

1.  **Server 1 (API Server):** Run your FastAPI backend connected to your managed production database (e.g. AWS RDS PostgreSQL).
2.  **Server 2 (Sandbox Server):** Run Judge0 on a separate, dedicated virtual machine. Set the security group to only allow incoming requests on port `2358` from Server 1's private IP.
3.  **Connection:** Set the FastAPI environment variable `JUDGE0_URL=http://<private-ip-of-server-2>:2358`.

---

## 3. Important Production Checklist

### 1. Enable Cgroups v2 on the Linux Host
Since Judge0 runs compiles and runs in the `isolate` sandbox using cgroups, your host Linux kernel must support cgroups v2. Native Ubuntu 22.04 LTS has cgroups v2 enabled out of the box.

### 2. Configure Proper Resource Limits
Ensure you configure production limits in `judge0.conf` to prevent malicious submissions from locking up your server (e.g. limiting CPU time to 5 seconds, memory to 256MB, and disabling network access for sandboxed runs).

### 3. Database backups
Configure daily database dumps for your PostgreSQL databases (`coding_platform` and `judge0`) to prevent data loss.
