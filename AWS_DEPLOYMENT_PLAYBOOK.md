# AWS Production Deployment Guide: Step-by-Step

This playbook provides a detailed, production-grade guide for deploying the **Coding Assessment Execution Service** (FastAPI + PostgreSQL + Redis + Judge0 Sandbox) onto a native Linux server on Amazon Web Services (AWS).

---

## Architecture Overview

We will configure a production setup using **Option A (Single-Server Docker Compose)**, which is highly efficient for most school/LMS platforms. 

```
                                [ Student Client ]
                                        │
                                        ▼ (HTTPS: Port 443)
                            ┌──────────────────────┐
                            │ Nginx Reverse Proxy  │
                            └──────────┬───────────┘
                                       │ (Port 8000)
                                       ▼
                            ┌──────────────────────┐
                            │ FastAPI Backend API  │
                            └────┬────────────┬────┘
                                 │            │
             (Internal Docker)   ▼            ▼   (Internal Docker)
                        ┌─────────┐      ┌──────────────┐
                        │ Postgres│      │ Judge0 Suite │
                        └─────────┘      └──────────────┘
```

---

## Phase 1: AWS EC2 Instance Setup

### 1. Sizing the Instance
Since compilation (especially for **Java** and **TypeScript**) and sandboxed execution require CPU cycles and RAM, select a virtual machine with at least:
*   **Recommended:** `t3.medium` (2 vCPUs, 4 GiB RAM) or `t3.large` (2 vCPUs, 8 GiB RAM).
*   **Storage:** 20 GB - 30 GB gp3 SSD (especially if using default Judge0 compilers).

### 2. Choose the Operating System (AMI)
Select **Ubuntu 22.04 LTS (HVM), SSD Volume Type** (64-bit x86). Native Ubuntu 22.04 includes native **cgroups v2** support, which is mandatory for the sandboxed execution environment.

### 3. Configure the Security Group (Firewall)
Set up the firewall rules to block direct database and sandbox access and only allow public web traffic:
*   **SSH (Port 22):** Allowed only from your IP address.
*   **HTTP (Port 80):** Allowed from Anywhere (`0.0.0.0/0`).
*   **HTTPS (Port 443):** Allowed from Anywhere (`0.0.0.0/0`).
*   *Keep ports `2358` (Judge0) and `5432` (PostgreSQL) closed to the public.* They will communicate securely inside the internal Docker network.

---

## Phase 2: Host Configuration & Installing Docker

Once your instance is running, connect via SSH:
```bash
ssh -i /path/to/key.pem ubuntu@your-ec2-public-ip
```

### 1. Update the System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker Engine
Run the official Docker installation script:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Add your user to the `docker` group to run commands without `sudo` (requires logging out and back in to take effect):
```bash
sudo usermod -aG docker ubuntu
# Reload session
newgrp docker
```

### 3. Install Docker Compose Plugin
```bash
sudo apt install -y docker-compose-v2
```

### 4. Verify Cgroups v2 Support
Judge0 requires cgroups v2 to isolate user runs:
```bash
mount | grep cgroup
```
You should see `cgroup2` in the output. If it is mounted, your system is ready.

---

## Phase 3: Setup Application Code & Config

### 1. Clone Your Repository
Clone your project onto the EC2 host:
```bash
git clone <your-git-repository-url> lmes_portal
cd lmes_portal
```

### 2. Create the Production Environment File (`.env`)
Create a production environment configuration file inside `/backend`:
```bash
nano backend/.env
```
Add the production configuration:
```env
DATABASE_URL=postgresql+psycopg2://lmes_user:SuperSecureDBPassword@db:5432/coding_platform
JUDGE0_URL=http://server:2358
```

### 3. Update the Judge0 Configuration (`judge0.conf`)
Modify `judge0/judge0.conf` to secure PostgreSQL and Redis passwords:
```bash
nano judge0/judge0.conf
```
Ensure you change the following from default values:
```conf
# PostgreSQL Database settings
DB_USER=postgres
DB_PASSWORD=SuperSecureJudgePassword
DB_NAME=judge0

# Redis Password settings
REDIS_PASSWORD=SuperSecureRedisPassword
```

---

## Phase 4: Build & Start Services

### 1. Option: Build Lightweight Compilers (Highly Recommended)
By default, the default Judge0 image is ~15GB because it includes 60+ compilers. To reduce it to ~1.2GB (supporting Python 3, Java 11, JS/TS, SQLite, and HTML/React assets), build the custom lightweight setup:

```bash
# Build base compiler image
docker build -t judge0-compilers:lightweight -f judge0/Dockerfile.compilers ./judge0

# Build final judge0 application image
docker build -t judge0-custom -f judge0/Dockerfile ./judge0
```

### 2. Start the Docker Services
Start the integrated stacks (FastAPI, Postgres database, Redis, Judge0 server, and Judge0 workers):
We will use a combined docker-compose script or launch both. Let's create a production docker-compose file:

```bash
nano docker-compose.prod.yml
```

Paste the following configurations:
```yaml
version: "3.8"

networks:
  prod-network:
    driver: bridge

services:
  # --- DB & Caching ---
  db:
    image: postgres:16.2
    environment:
      - POSTGRES_USER=lmes_user
      - POSTGRES_PASSWORD=SuperSecureDBPassword
      - POSTGRES_DB=coding_platform
    volumes:
      - pg_data:/var/lib/postgresql/data
    networks:
      - prod-network
    restart: always

  redis:
    image: redis:7.2.4
    command: ["bash", "-c", "docker-entrypoint.sh --appendonly no --requirepass SuperSecureRedisPassword"]
    networks:
      - prod-network
    restart: always

  # --- Judge0 Core Services ---
  judge0-db:
    image: postgres:16.2
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=SuperSecureJudgePassword
      - POSTGRES_DB=judge0
    volumes:
      - judge_data:/var/lib/postgresql/data
    networks:
      - prod-network
    restart: always

  server:
    image: judge0-custom
    volumes:
      - ./judge0/judge0.conf:/judge0.conf:ro
    environment:
      - REDIS_PASSWORD=SuperSecureRedisPassword
      - DB_PASSWORD=SuperSecureJudgePassword
    networks:
      - prod-network
    depends_on:
      - judge0-db
      - redis
    restart: always

  worker:
    image: judge0-custom
    command: ["bash", "-c", "mkdir -p /sys/fs/cgroup/init && for pid in $$(cat /sys/fs/cgroup/cgroup.procs); do echo $$pid > /sys/fs/cgroup/init/cgroup.procs 2>/dev/null; done; echo '+cpu +memory +pids +cpuset' > /sys/fs/cgroup/cgroup.subtree_control; exec ./scripts/workers"]
    volumes:
      - ./judge0/judge0.conf:/judge0.conf:ro
    environment:
      - REDIS_PASSWORD=SuperSecureRedisPassword
      - DB_PASSWORD=SuperSecureJudgePassword
    privileged: true
    user: root
    networks:
      - prod-network
    depends_on:
      - server
    restart: always

  # --- FastAPI Python Application ---
  backend-api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+psycopg2://lmes_user:SuperSecureDBPassword@db:5432/coding_platform
      - JUDGE0_URL=http://server:2358
    depends_on:
      - db
      - server
    networks:
      - prod-network
    restart: always

volumes:
  pg_data:
  judge_data:
```

Launch the stack:
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Phase 5: Reverse Proxy & HTTPS Configuration

To secure communication and provide a clean domain name for your backend (e.g. `api.lmes.yourdomain.com`), configure Nginx and Let's Encrypt SSL.

### 1. Install Nginx
```bash
sudo apt install nginx -y
```

### 2. Configure Nginx Server Block
Create a configuration block for your backend:
```bash
sudo nano /etc/nginx/sites-available/lmes-api
```
Add the reverse proxy settings (replace `api.yourdomain.com` with your subdomain):
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/lmes-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Setup SSL Certificate (Let's Encrypt)
Use Certbot to automatically fetch and configure a free SSL certificate:
```bash
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

Run Certbot to fetch the certificate and configure Nginx automatically:
```bash
sudo certbot --nginx -d api.yourdomain.com
```
Follow the prompts, agree to the terms, and Nginx will be auto-configured to redirect HTTP to HTTPS.

---

## Phase 6: Database Seeding & Verification

### 1. Verify Containers are Healthy
```bash
docker compose -f docker-compose.prod.yml ps
```
All containers should display a status of `Up`.

### 2. Seed Coding Questions & Test Cases
Run the seed script inside the backend container to populate initial questions (like Two Sum, SQL Rank, and React Clicker):
```bash
docker compose -f docker-compose.prod.yml exec backend-api python app/seed/seed_data.py
```

### 3. Run a Health Check Curl Command
Test if the API is publicly responding over HTTPS:
```bash
curl -X GET https://api.yourdomain.com/questions
```
You should get a JSON array containing your seeded questions.

You can now hand off the URL `https://api.yourdomain.com` to the main frontend team!
