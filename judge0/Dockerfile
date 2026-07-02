# ========================================================
# STAGE 1: Sandbox Builder (Compile Isolate)
# ========================================================
FROM ruby:3.0-slim AS isolate-builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      ca-certificates \
      git \
      libcap-dev \
      libseccomp-dev \
      libsystemd-dev \
      pkg-config && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
RUN git clone https://github.com/ioi/isolate.git && \
    cd isolate && \
    git checkout v2.0 && \
    make install

# ========================================================
# STAGE 2: Rails Gem Builder (Compile Gem Native Extensions)
# ========================================================
FROM ruby:3.0-slim AS gems-builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      shared-mime-info && \
    rm -rf /var/lib/apt/lists/*

ENV GEM_HOME "/opt/.gem/"
RUN gem install bundler:2.1.4

WORKDIR /api
COPY Gemfile Gemfile.lock ./
RUN RAILS_ENV=production bundle

# ========================================================
# STAGE 3: Production Runtime Sandbox Environment
# ========================================================
FROM ruby:3.0-slim AS production-base

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH "/usr/bin:/opt/.gem/bin:$PATH"
ENV GEM_HOME "/opt/.gem/"

# Install ONLY runtime packages for Python 3, Node.js, SQLite3, and Ruby
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      cron \
      curl \
      libcap2 \
      libseccomp2 \
      libpq5 \
      shared-mime-info \
      sudo \
      # Python 3 runtime (no dev tools/compilers)
      python3 \
      python3-pip \
      # Node.js runtime (no npm/build tools)
      nodejs \
      npm \
      # SQLite3 execution
      sqlite3 && \
    rm -rf /var/lib/apt/lists/*

# Copy Compiled Isolate binary & config from Stage 1
COPY --from=isolate-builder /usr/local/bin/isolate /usr/local/bin/isolate
COPY --from=isolate-builder /usr/local/etc/isolate /usr/local/etc/isolate

# Setup isolate config cgroups paths
RUN echo "cg_root = /sys/fs/cgroup\nlock_root = /run/isolate/locks" > /usr/local/etc/isolate

# Copy Pre-compiled Gems from Stage 2
COPY --from=gems-builder /opt/.gem/ /opt/.gem/

EXPOSE 2358

WORKDIR /api

# Copy cron configurations
COPY cron /etc/cron.d
RUN cat /etc/cron.d/* | crontab -

# Copy application source code
COPY . .

# Setup entrypoint
ENTRYPOINT ["/api/docker-entrypoint.sh"]

# Setup non-privileged sandbox execution user
RUN useradd -u 1000 -m -r judge0 && \
    echo "judge0 ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers && \
    chown judge0: /api/tmp/

USER judge0

ENV JUDGE0_VERSION "1.13.1"
LABEL version=$JUDGE0_VERSION

# Development Target
FROM production-base AS development
CMD ["sleep", "infinity"]

# Production Target (Default)
FROM production-base AS production
CMD ["/api/scripts/server"]
