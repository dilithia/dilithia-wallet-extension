#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRATE_DIR="$ROOT_DIR/crypto-wasm"

if ! command -v wasm-pack >/dev/null 2>&1; then
  echo "wasm-pack is required but was not found in PATH." >&2
  exit 1
fi

if ! command -v clang >/dev/null 2>&1; then
  echo "clang is required but was not found in PATH." >&2
  exit 1
fi

mkdir -p "$CRATE_DIR/target/tmp"

cd "$ROOT_DIR"
TMPDIR="$CRATE_DIR/target/tmp" wasm-pack build crypto-wasm --target web --out-dir pkg
