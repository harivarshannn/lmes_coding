# AI Agent Handoff & Project Context

This file serves as a memory checkpoint for AI coding agents (like Antigravity or others) to restore full context, design rationale, and system-level configuration states for this repository.

---

## 1. Project Mission
Build a production-grade Coding Assessment Execution Service (LeetCode clone) for Python, C++, and Java.
- **Backend:** FastAPI, PostgreSQL, SQLAlchemy ORM, Alembic.
- **Sandbox Engine:** Local Judge0 CE (Docker-based) using the Linux `isolate` sandbox.

---

## 2. Workspace Layout
- `K:/lmes_portal/backend`: The FastAPI web server and database configuration.
- `K:/lmes_portal/judge0`: The Judge0 CE configuration, database, Redis broker, server, and worker containers.

---

## 3. The WSL2 Cgroup v2 Virtualization Patch
On Windows 11 with WSL2/Docker Desktop, the system boots into pure **cgroups v2**. However, Judge0's standard `isolate` sandbox (v1.8.1) requires cgroups v1. Without cgroups, it restricts process limits to 1 (`RLIMIT_NPROC=1`), causing C++ compilations (`g++` forks) and Java runtime executions (JVM thread spawns) to fail with resource limits errors.

### The Virtualization Solution (Apply if containers are rebuilt):
1. **Docker Worker User:** In `K:/lmes_portal/judge0/docker-compose.yml`, the `worker` service is configured with `user: root` and `privileged: true`.
2. **Cgroup Controller Setup on Startup:** The `worker` container runs a startup command wrapper:
   ```yaml
   command: ["bash", "-c", "mkdir -p /sys/fs/cgroup/init && for pid in $$(cat /sys/fs/cgroup/cgroup.procs); do echo $$pid > /sys/fs/cgroup/init/cgroup.procs 2>/dev/null; done; echo '+cpu +memory +pids +cpuset' > /sys/fs/cgroup/cgroup.subtree_control; exec ./scripts/workers"]
   ```
   *Explanation:* This complies with cgroup v2's "no internal processes" constraint by moving container processes to `/sys/fs/cgroup/init` before distributing CPU, memory, and PIDs controllers to child sandboxes.
3. **Sandbox Upgrade:** Run `/tmp/install_isolate.sh` (or [install_isolate.sh](file:///K:/lmes_portal/judge0/install_isolate.sh) copied from the host) inside `judge0-worker-1` as root. This compiles **isolate v2.0** (which supports cgroup v2) and writes `/usr/local/etc/isolate` with `cg_root = /sys/fs/cgroup`.
4. **Rails ActiveJob Configuration:** In [isolate_job.rb](file:///K:/lmes_portal/judge0/app/jobs/isolate_job.rb), cgroups are enabled using `@cgroups = "--cg"`. Deprecated `--cg-timing` flags are removed, and the `exec` prefix is removed from the execution script since multiprocessing works natively under cgroups.

---

## 4. Verification Commands

### Integration Test (Real Sandbox)
To submit and execute Python, C++, and Java code against the active Judge0 worker sandbox:
```powershell
docker exec -e JUDGE0_URL=http://host.docker.internal:2358 backend-web-1 python app/tests/test_judge0_integration.py
```
*Expected Output:* All three languages must print `validation PASSED!` with `Accepted` status.

### Unit Tests
To run all web server, schema, database, and evaluation tests:
```powershell
docker exec -e PYTHONPATH=/workspace backend-web-1 pytest
```
*Expected Output:* `15 passed`

---

## 5. Active Container Info
- **FastAPI Port:** `8000` (`backend-web-1`)
- **Postgres DB Port:** `5432` (`backend-db-1`)
- **Judge0 Port:** `2358` (`judge0-server-1`)
