#!/bin/bash
set -euo pipefail

echo "[build] 🔧 Installing system dependencies..."
apt-get update && apt-get install -y --no-install-recommends \
  build-essential curl git ca-certificates gnupg \
  && rm -rf /var/lib/apt/lists/*

echo "[build] 💻 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "[build] 📦 Installing frontend deps..."
npm ci
npm run build

echo "[build] 🐍 Installing Python tools..."
pip install --upgrade pip
pip install pyinstaller

echo "[build] 🛠️  Building binary..."
pyinstaller --onefile \
  --name ui-server \
  --add-data "dist:dist" \
  server/server.py

echo "[build] ✅ Binary available at: dist/ui-server"

