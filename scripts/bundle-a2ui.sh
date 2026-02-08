#!/usr/bin/env bash
set -euo pipefail

on_error() {
  echo "A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle" >&2
  echo "If this persists, verify pnpm deps and try again." >&2
}
trap on_error ERR

# 更健壮的 ROOT_DIR 设置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -z "$SCRIPT_DIR" ]]; then
  echo "Error: Could not determine script directory" >&2
  exit 1
fi
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
if [[ -z "$ROOT_DIR" ]]; then
  echo "Error: Could not determine root directory" >&2
  exit 1
fi
HASH_FILE="$ROOT_DIR/src/canvas-host/a2ui/.bundle.hash"
OUTPUT_FILE="$ROOT_DIR/src/canvas-host/a2ui/a2ui.bundle.js"
A2UI_RENDERER_DIR="$ROOT_DIR/vendor/a2ui/renderers/lit"
A2UI_APP_DIR="$ROOT_DIR/apps/shared/OpenClawKit/Tools/CanvasA2UI"

# Docker builds exclude vendor/apps via .dockerignore.
# In that environment we must keep the prebuilt bundle.
echo "=== A2UI Bundle Debug ==="
echo "A2UI_RENDERER_DIR: $A2UI_RENDERER_DIR"
echo "A2UI_APP_DIR: $A2UI_APP_DIR"
echo "Checking directories..."
if [[ -d "$A2UI_RENDERER_DIR" ]]; then
  echo "✅ Renderer dir exists: $A2UI_RENDERER_DIR"
  ls -la "$A2UI_RENDERER_DIR" | head -10
else
  echo "❌ Renderer dir missing: $A2UI_RENDERER_DIR"
fi
if [[ -d "$A2UI_APP_DIR" ]]; then
  echo "✅ App dir exists: $A2UI_APP_DIR"
  ls -la "$A2UI_APP_DIR" | head -10
else
  echo "❌ App dir missing: $A2UI_APP_DIR"
fi

if [[ ! -d "$A2UI_RENDERER_DIR" || ! -d "$A2UI_APP_DIR" ]]; then
  echo "A2UI sources missing; keeping prebuilt bundle."
  exit 0
fi

INPUT_PATHS=(
  "$ROOT_DIR/package.json"
  "$ROOT_DIR/pnpm-lock.yaml"
  "$A2UI_RENDERER_DIR"
  "$A2UI_APP_DIR"
)

compute_hash() {
  ROOT_DIR="$ROOT_DIR" node --input-type=module - "${INPUT_PATHS[@]}" <<'NODE'
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.env.ROOT_DIR ?? process.cwd();
const inputs = process.argv.slice(2);
const files = [];

async function walk(entryPath) {
  const st = await fs.stat(entryPath);
  if (st.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    for (const entry of entries) {
      await walk(path.join(entryPath, entry));
    }
    return;
  }
  files.push(entryPath);
}

for (const input of inputs) {
  await walk(input);
}

function normalize(p) {
  return p.split(path.sep).join("/");
}

files.sort((a, b) => normalize(a).localeCompare(normalize(b)));

const hash = createHash("sha256");
for (const filePath of files) {
  const rel = normalize(path.relative(rootDir, filePath));
  hash.update(rel);
  hash.update("\0");
  hash.update(await fs.readFile(filePath));
  hash.update("\0");
}

process.stdout.write(hash.digest("hex"));
NODE
}

current_hash="$(compute_hash)"
if [[ -f "$HASH_FILE" ]]; then
  previous_hash="$(cat "$HASH_FILE")"
  if [[ "$previous_hash" == "$current_hash" && -f "$OUTPUT_FILE" ]]; then
    echo "A2UI bundle up to date; skipping."
    exit 0
  fi
fi

pnpm -s exec tsc -p "$A2UI_RENDERER_DIR/tsconfig.json"
rolldown -c "$A2UI_APP_DIR/rolldown.config.mjs"

echo "$current_hash" > "$HASH_FILE"
