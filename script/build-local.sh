#!/bin/bash

set -e

SERVER_NAME="ui-server"
RELEASE_DIR="bin"
SERVER_SCRIPT="server/server.py"

# Absolute paths
ROOT_DIR="$(pwd)"
DIST_DIR="$ROOT_DIR/dist"
SCRIPT_PATH="$ROOT_DIR/$SERVER_SCRIPT"

echo "🛠 Building Vite app..."
npm run build

if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Build failed or dist/ folder missing!"
  exit 1
fi

echo "🧼 Cleaning up old artifacts..."
rm -rf "$RELEASE_DIR" build dist/__pycache__

echo "📦 Packaging server binary with embedded static files..."
pyinstaller \
  --onefile \
  --name "$SERVER_NAME" \
  --add-data "$DIST_DIR:dist" \
  --distpath "$RELEASE_DIR" \
  "$SCRIPT_PATH"

echo "✅ Done!"
echo "Run http server binary with:"
echo "   cd $RELEASE_DIR && ./$SERVER_NAME"