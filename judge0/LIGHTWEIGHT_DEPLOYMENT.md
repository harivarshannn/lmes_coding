# Guide: Lightweight Judge0 Deployment for Python & Java

By default, the official `judge0/compilers:1.4.0` image pre-packages compilers and runtimes for 60+ programming languages (including Mono, GHC, Rustc, Swift, GnuCOBOL, etc.), making the image size very large (~15GB).

Since this platform now supports **only Python and Java**, you can deploy a lightweight version of Judge0 by building a custom base image. This reduces your disk space and network footprint by **over 90% (down to ~1.2GB)**.

---

## Step 1: Create a Lightweight Compilers Base Image

Create a file named `Dockerfile.compilers` in your `judge0` directory:

```dockerfile
# judge0/Dockerfile.compilers
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install core build dependencies, Ruby runtime, and isolate dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      ca-certificates \
      curl \
      git \
      libcap-dev \
      libpq-dev \
      shared-mime-info \
      sudo \
      unzip \
      # Ruby dependencies
      ruby-full \
      # Python 3 interpreter
      python3 \
      python3-pip \
      # Java 11 runtime and compiler
      openjdk-11-jdk-headless && \
    rm -rf /var/lib/apt/lists/*

# Compile and install isolate v2.0 (compatible with cgroups v2)
WORKDIR /tmp
RUN git clone https://github.com/ioi/isolate.git && \
    cd isolate && \
    make install && \
    rm -rf /tmp/isolate

# Setup isolate config
RUN echo "cg_root = /sys/fs/cgroup\nlock_root = /run/isolate/locks" > /usr/local/etc/isolate
```

Build this image locally and tag it as `judge0-compilers:lightweight`:
```bash
docker build -t judge0-compilers:lightweight -f Dockerfile.compilers .
```

---

## Step 2: Build the Lightweight Judge0 Image

Now, modify your `judge0/Dockerfile` to inherit from your lightweight compilers image instead of `judge0/compilers:1.4.0`:

```dockerfile
# judge0/Dockerfile
FROM judge0-compilers:lightweight AS production

ENV JUDGE0_HOMEPAGE "https://judge0.com"
LABEL homepage=$JUDGE0_HOMEPAGE

ENV PATH "/usr/local/bin:/opt/.gem/bin:$PATH"
ENV GEM_HOME "/opt/.gem/"

RUN gem install bundler:2.1.4

EXPOSE 2358
WORKDIR /api

COPY Gemfile* ./
RUN RAILS_ENV=production bundle

COPY cron /etc/cron.d
RUN cat /etc/cron.d/* | crontab -

COPY . .

ENTRYPOINT ["/api/docker-entrypoint.sh"]
CMD ["/api/scripts/server"]

RUN useradd -u 1000 -m -r judge0 && \
    echo "judge0 ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers && \
    chown -R judge0:judge0 /api/tmp/

USER judge0
ENV JUDGE0_VERSION "1.13.1"
```

---

## Step 3: Rebuild and Start Judge0 Services

Update the `image` fields in your `judge0/docker-compose.yml` to build your local `Dockerfile` rather than pulling the default `judge0/judge0:latest` image:

```yaml
# judge0/docker-compose.yml
services:
  server:
    build:
      context: .
      dockerfile: Dockerfile
    # image: judge0/judge0:latest (comment out/remove)
    volumes:
      - ./judge0.conf:/judge0.conf:ro
      - ./app/jobs/isolate_job.rb:/api/app/jobs/isolate_job.rb:ro
      - ./db:/api/db:ro
    ports:
      - "2358:2358"
    privileged: true
    restart: always

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    # image: judge0/judge0:latest (comment out/remove)
    command: ["bash", "-c", "mkdir -p /sys/fs/cgroup/init && for pid in $$(cat /sys/fs/cgroup/cgroup.procs); do echo $$pid > /sys/fs/cgroup/init/cgroup.procs 2>/dev/null; done; echo '+cpu +memory +pids +cpuset' > /sys/fs/cgroup/cgroup.subtree_control; exec ./scripts/workers"]
    volumes:
      - ./judge0.conf:/judge0.conf:ro
      - ./app/jobs/isolate_job.rb:/api/app/jobs/isolate_job.rb:ro
      - ./db:/api/db:ro
    privileged: true
    user: root
    restart: always
```

Then rebuild and launch the services:
```bash
docker compose down
docker compose build
docker compose up -d
```
This custom setup will deploy a lightweight instance running **only Python 3 and Java 11**, significantly optimizing server memory usage and reducing disk storage requirements.
