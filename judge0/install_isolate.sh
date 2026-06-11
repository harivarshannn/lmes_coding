#!/bin/bash
set -e

echo "Updating apt sources list to archives..."
echo 'deb http://archive.debian.org/debian/ buster main contrib non-free' > /etc/apt/sources.list
echo 'deb http://archive.debian.org/debian-security/ buster/updates main contrib non-free' >> /etc/apt/sources.list

echo "Updating package index..."
apt-get update -o Acquire::Check-Valid-Until=false

echo "Installing build dependencies..."
apt-get install -y libcap-dev libseccomp-dev libsystemd-dev

echo "Cloning isolate..."
rm -rf /tmp/isolate
git clone https://github.com/ioi/isolate.git /tmp/isolate

echo "Checking out version v2.0 and compiling..."
cd /tmp/isolate
git checkout v2.0
make clean
# Ignore manpage generation error
make || true

echo "Installing new isolate binary..."
cp /tmp/isolate/isolate /usr/local/bin/isolate
chmod 4755 /usr/local/bin/isolate

echo "Writing configuration file..."
mkdir -p /run/isolate/locks
cat << 'EOF' > /usr/local/etc/isolate
box_root = /var/local/lib/isolate
lock_root = /run/isolate/locks
cg_root = /sys/fs/cgroup
first_uid = 60000
first_gid = 60000
num_boxes = 1000
EOF

echo "Checking new isolate version..."
/usr/local/bin/isolate --version || true

echo "Isolate installation complete!"
