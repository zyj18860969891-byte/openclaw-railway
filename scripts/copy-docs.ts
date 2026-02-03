#!/usr/bin/env tsx
/**
 * Copy docs directory to dist/
 * This ensures runtime template files are available in the Docker image
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const srcDocs = path.join(projectRoot, 'docs');
const distDocs = path.join(projectRoot, 'dist', 'docs');

function copyDocs() {
  if (!fs.existsSync(srcDocs)) {
    console.warn('[copy-docs] Source docs directory not found:', srcDocs);
    return;
  }

  console.log('[copy-docs] Copying docs from', srcDocs, 'to', distDocs);

  // Ensure dist/docs exists
  fs.mkdirSync(distDocs, { recursive: true });

  // Copy the entire docs directory recursively
  function copyDir(src: string, dest: string) {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDir(srcDocs, distDocs);

  console.log('[copy-docs] Done copying docs');
}

copyDocs();
