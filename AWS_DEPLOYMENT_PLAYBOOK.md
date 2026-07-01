# AWS Production Deployment Guide: Step-by-Step

This playbook provides a detailed, production-grade guide for deploying the **DevArena Coding Practice Platform** (FastAPI + PostgreSQL + Redis + Judge0 Sandbox + AI microservice) onto a Linux server on Amazon Web Services (AWS).

---

## Architecture Overview

We will configure a production setup using **Option A (Single-Server Docker Compose)**, which is highly cost-effective and fits within standard budget tiers. 

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
                            │   FastAPI Web API    │
                            └────┬────────────┬────┘
                                 │            │
             (Internal Docker)   ▼            ▼   (Internal Docker)
                        ┌─────────┐      ┌────────────────────────┐
                        │ Postgres│      │ Redis Cache & Queues   │
                        └─────────┘      └────────────────────────┘
                                 │            │
             (Internal Docker)   ▼            ▼   (Internal Docker)
                        ┌─────────┐      ┌────────────────────────┐
                        │ Judge0  │      │ AI Service Microservice│
                        └─────────┘      └────────────────────────┘
```

---

## Phase 1: AWS EC2 Instance Setup

### 1. Sizing the Instance
By stripping out C++, Java, Rust, Go, and 50+ other compilers, the memory footprint and CPU spike limits are drastically reduced. You no longer need expensive compute-optimized instances.
* **Instance Choice:** `t3.micro` (1 GB RAM - strictly for minimal staging) or `t3.small` / `t3.medium` (2 GB to 4 GB RAM - recommended for production).
* **Storage:** 15 GB - 20 GB gp3 SSD (the custom compilers container size is only ~1.2 GB, compared to Judge0's standard 15 GB).

### 2. Choose the Operating System (AMI)
Select **Ubuntu 24.04 LTS (HVM), SSD Volume Type** (64-bit x86). Native Ubuntu includes **cgroups v2** support, which is required for the sandboxed execution environment.

### 3. Configure the Security Group (Firewall)
Set up the firewall rules to block direct database and sandbox access and only allow public web traffic:
* **SSH (Port 22):** Allowed only from your IP address.
* **HTTP (Port 80):** Allowed from Anywhere (`0.0.0.0/0`).
* **HTTPS (Port 443):** Allowed from Anywhere (`0.0.0.0/0`).
* *Keep ports `2358` (Judge0), `6379` (Redis), and `5432` (PostgreSQL) closed to the public.* They will communicate securely inside the internal Docker network.

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
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker
```

### 3. Install Docker Compose Plugin
```bash
sudo apt install -y docker-compose-v2
```

### 4. Verify Cgroups v2 Support
Verify that cgroups v2 is active:
```bash
mount | grep cgroup
```
You should see `cgroup2` in the output.

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
DATABASE_URL=postgresql+psycopg2://postgres:securepassword@db:5432/coding_platform
REDIS_URL=redis://:securepassword@redis:6379/0
JUDGE0_URL=http://server:2358
AI_SERVICE_URL=http://ai-service:8080
```

### 3. Update the Judge0 Configuration (`judge0.conf`)
Modify `judge0/judge0.conf` to secure passwords:
```bash
nano judge0/judge0.conf
```
Ensure you change the following from default values:
```conf
DB_PASSWORD=securepassword
REDIS_PASSWORD=securepassword
```

---

## Phase 4: Build & Start Services

### 1. Build the Custom Compiler Base Image
Build the lightweight runtime environment:
```bash
# Build base compiler image
docker build -t judge0-compilers:lightweight -f judge0/Dockerfile.compilers ./judge0
```

### 2. Launch the Production compose file
Run the unified Docker Compose configuration:
```bash
docker compose up -d
```
This builds all custom services (API backend, AI service, custom Judge0) and creates isolated networks (`frontend-net`, `backend-net`).

---

## Phase 5: Reverse Proxy & HTTPS Configuration

To secure communication and serve the Monaco Web IDE over SSL, configure Nginx and Let's Encrypt.

### 1. Install Nginx
```bash
sudo apt install nginx -y
```

### 2. Configure Nginx Server Block
Create a configuration block:
```bash
sudo nano /etc/nginx/sites-available/devarena
```
Add the reverse proxy settings (replace `code.yourdomain.com` with your subdomain):
```nginx
server {
    listen 80;
    server_name code.yourdomain.com;

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
sudo ln -s /etc/nginx/sites-available/devarena /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Setup SSL Certificate (Let's Encrypt)
Use Certbot to automatically configure SSL:
```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d code.yourdomain.com
```

---

## Phase 6: Database Seeding & Verification

### 1. Seed Coding Questions & Test Cases
Run the seed script inside the backend API container:
```bash
docker compose exec backend-api python app/seed/seed_data.py
```

### 2. Run a Health Check
Test if the API is responding correctly:
```bash
curl -X GET https://code.yourdomain.com/questions
```
You should get a JSON array containing the seeded questions, topics, templates, and limits.
