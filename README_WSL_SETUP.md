# Teammate Local WSL2 Setup Guide

Because the Judge0 sandbox system uses Linux-only kernel constructs (such as namespaces and cgroups v2) for process isolation, the DevArena platform stack **must** run in a Linux environment. On Windows host machines, this is achieved using **WSL2 (Windows Subsystem for Linux)**.

Follow these steps to get your local environment running.

---

## Step 1: Install & Enable WSL2 on Windows

1. Open **PowerShell** or **Windows Command Prompt** as **Administrator** and run:
   ```powershell
   wsl --install
   ```
   *Note: This command installs the default Linux distribution (Ubuntu) and configures WSL2.*
2. **Restart your computer** when prompted to complete the installation.
3. Upon restart, a terminal window will open to set up your Ubuntu username and password.

---

## Step 2: Enable Systemd in WSL2 (Mandatory)

Isolate requires systemd to mount and manage unified control groups (cgroups v2) correctly.
1. Open your WSL2 terminal (Ubuntu) and edit the WSL configuration file:
   ```bash
   sudo nano /etc/wsl.conf
   ```
2. Paste the following configuration:
   ```ini
   [boot]
   systemd=true
   ```
3. Save and close the file (`Ctrl+O`, `Enter`, then `Ctrl+X`).
4. Close your Ubuntu terminal, open PowerShell on Windows, and restart WSL to apply the change:
   ```powershell
   wsl --shutdown
   ```

---

## Step 3: Install Docker Desktop & Enable WSL2 Integration

1. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. During installation, ensure the option **"Use the WSL 2 based engine"** is checked.
3. Open Docker Desktop, go to **Settings (Gear Icon)** -> **Resources** -> **WSL Integration**.
4. Toggle on **"Enable integration with my default WSL distro"** (and check your `Ubuntu` distribution checkbox).
5. Click **Apply & Restart**.

---

## Step 4: Configure Git Line Endings (CRITICAL)

Windows checkouts use CRLF (`\r\n`) line endings by default. If shell scripts (`.sh`) are checked out with CRLF, Linux containers will fail to start them with `exec format error` or `no such file or directory`.

We have committed a `.gitattributes` file to enforce LF line endings, but you should also configure Git globally:
1. Open PowerShell or Command Prompt on Windows and run:
   ```cmd
   git config --global core.autocrlf false
   ```
2. If you have already cloned the repository before changing this setting, run this inside the repo directory to re-normalize the line endings:
   ```bash
   git rm --cached -r .
   git reset --hard
   ```

---

## Step 5: Boot the Stack & Seed Data

Now you can clone and boot the stack inside your WSL2 environment.

1. Open your WSL2 Ubuntu terminal.
2. Navigate to your workspace directory (you can access your Windows drives under `/mnt/`, e.g., `/mnt/c/Users/...` or `/mnt/d/`):
   ```bash
   cd /mnt/k/your_workspace_folder
   ```
3. Clone the repository and navigate into it:
   ```bash
   git clone https://github.com/harivarshannn/lmes_coding.git
   cd lmes_coding
   ```
4. Start the Docker containers:
   ```bash
   docker compose up --build -d
   ```
5. Seed the database structure and coding questions:
   ```bash
   docker compose exec backend-api python -m app.seed.seed_data
   ```

The Web IDE will now be accessible locally on your Windows browser at:
* **URL:** [http://localhost:8008/](http://localhost:8008/)
