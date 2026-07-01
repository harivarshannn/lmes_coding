# Manual Deployment & Starting Guide: Custom Judge0 CE

This guide explains how to manually build, run, and troubleshoot the custom **Judge0 CE** sandbox environment. It has been stripped of unused compilers and optimized down to **~510 MB**, supporting exclusively **Python 3**, **JavaScript (Node.js)**, and **SQL (SQLite 3)**.

---

## 1. Prerequisites & Host System Check

Before starting, ensure your host environment meets the following requirements:

### A. Verify Cgroups v2 Support
The sandbox requires **cgroups v2** (unified hierarchy). Run this command in WSL2:
```bash
mount | grep cgroup2
```
* **Expected Output:**
  ```
  cgroup2 on /sys/fs/cgroup type cgroup2 (rw,nosuid,nodev,noexec,relatime,nsdelegate)
  ```
  If it shows `/sys/fs/cgroup` as the mount target, your WSL2 kernel is successfully running cgroups v2. This is the correct, modern behavior required by `isolate` v2.0.

### B. Verify Docker Integration
If you get the error:
`The command 'docker' could not be found in this WSL 2 distro.`
It means Docker Desktop is running on Windows, but it is not linked to your active WSL2 shell.

---

## 2. Resolving "Docker command not found" in WSL2

You can resolve this using one of the following options:

### Option A: Enable WSL Integration in Docker Desktop (Recommended)
This symlinks the Windows host Docker daemon directly into your WSL2 distro:
1. Open the **Docker Desktop** application on Windows.
2. Click the **Settings (Gear Icon)** in the top right.
3. Navigate to **Resources** -> **WSL Integration**.
4. Check the toggle switch next to your active WSL2 distribution (e.g. `Harivarshann` or `Ubuntu`).
5. Click **Apply & Restart** in the bottom right.
6. Re-open your WSL2 terminal or run `exec bash`. Test with:
   ```bash
   docker --version
   ```

### Option B: Install Native Docker Engine inside WSL2
If you are running WSL2 standalone without Docker Desktop:
1. Install Docker using the official repository script:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```
2. Start the Docker daemon:
   ```bash
   sudo service docker start
   ```
3. Allow running commands without `sudo`:
   ```bash
   sudo usermod -aG docker $USER
   # Restart WSL shell to apply groups
   ```

---

## 3. Ports & Network Access Control

For security, the database and caching services do not expose ports to the public internet:
* **Judge0 API Server:** Exposes port `2358` publicly (can be reverse-proxied using Nginx).
* **PostgreSQL Database (`db`):** Localhost bound (`127.0.0.1:5432:5432`).
* **Redis Message Broker (`redis`):** Localhost bound (`127.0.0.1:6379:6379`).

---

## 4. How to Start Manually

Follow these steps sequentially to build and start the containers:

### Step 1: Build the Custom Multi-Stage Image
Run the following build command from the `judge0` directory (or the root project directory if using the unified compose setup):
```bash
docker compose build --no-cache
```
*This triggers the 3-stage compiler extraction and Rails dependency bundling, resulting in a slim execution runtime.*

### Step 2: Start the Stack in Detached Mode
```bash
docker compose up -d
```

### Step 3: Monitor Seeding & Server Health
Watch the database migrations and seeding process:
```bash
docker compose logs -f server
```
*The server is fully initialized and healthy when it prints `Puma starting in single mode...` and binds to port `2358`.*

### Step 4: Verify Running Container Status
```bash
docker compose ps
```
*All containers (`server`, `worker`, `db`, `redis`) should display a status of `Up` or `healthy`.*

---

## 5. Diagnostics & Troubleshooting

### Check Active Languages Seeding
Verify that only the requested compilers are active in the database:
```bash
curl -s http://localhost:2358/languages
```
**Expected JSON output:**
```json
[
  {"id":43,"name":"Plain Text"},
  {"id":63,"name":"JavaScript (Node.js 12.14.0)"},
  {"id":71,"name":"Python (3.8.1)"},
  {"id":82,"name":"SQL (SQLite 3.27.2)"}
]
```

### Test the Sandbox Engine Directly
To ensure that `isolate` has successfully initialized sandboxed directories under unified cgroups v2, execute the version diagnostic check inside the worker container:
```bash
docker compose exec worker isolate --version
```
**Expected output:**
```
Isolate sandbox version 2.0
Configured with cgroup root /sys/fs/cgroup
```

If it prints permission errors, verify that:
1. The container is running in `privileged: true` mode.
2. The host has delegated the unified controllers. You can force-enable subtree control by running on the host:
   ```bash
   echo "+cpu +memory +pids +cpuset" | sudo tee /sys/fs/cgroup/cgroup.subtree_control
   ```
