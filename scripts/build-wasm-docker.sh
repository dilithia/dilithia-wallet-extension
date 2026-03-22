#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "$ROOT_DIR/.." && pwd)"
PROJECT_DIR_NAME="$(basename "$ROOT_DIR")"
IMAGE_NAME="dilithia-wallet-wasm-builder"

docker build -f "$ROOT_DIR/docker/wasm-builder.Dockerfile" -t "$IMAGE_NAME" "$ROOT_DIR"

docker run --rm \
  -v "$WORKSPACE_DIR:/workspace-root" \
  -w "/workspace-root/$PROJECT_DIR_NAME" \
  -e HOST_UID="$(id -u)" \
  -e HOST_GID="$(id -g)" \
  "$IMAGE_NAME" \
  bash -lc 'export PATH=/usr/local/cargo/bin:$PATH && mkdir -p /tmp/cargo-home crypto-wasm/.tmp crypto-wasm/target-wasm && CARGO_HOME=/tmp/cargo-home TMPDIR="/workspace-root/'"$PROJECT_DIR_NAME"'/crypto-wasm/.tmp" CARGO_TARGET_DIR="/workspace-root/'"$PROJECT_DIR_NAME"'/crypto-wasm/target-wasm" /usr/local/cargo/bin/wasm-pack build crypto-wasm --target web --out-dir pkg && chown -R "$HOST_UID:$HOST_GID" "/workspace-root/'"$PROJECT_DIR_NAME"'/crypto-wasm/pkg" "/workspace-root/'"$PROJECT_DIR_NAME"'/crypto-wasm/target-wasm" "/workspace-root/'"$PROJECT_DIR_NAME"'/crypto-wasm/.tmp"'
