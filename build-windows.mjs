#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Windows build process...');

// 设置环境变量
process.env.OPENCLAW_A2UI_SKIP_MISSING = '1';

// 构建步骤
const steps = [
  {
    name: 'TypeScript Compilation',
    command: 'pnpm',
    args: ['tsc', '-p', 'tsconfig.json']
  },
  {
    name: 'Copy Canvas A2UI',
    command: 'node',
    args: ['--import', 'tsx', 'scripts/canvas-a2ui-copy.ts']
  },
  {
    name: 'Copy Hook Metadata',
    command: 'node',
    args: ['--import', 'tsx', 'scripts/copy-hook-metadata.ts']
  },
  {
    name: 'Write Build Info',
    command: 'node',
    args: ['--import', 'tsx', 'scripts/write-build-info.ts']
  },
  {
    name: 'Copy Docs',
    command: 'node',
    args: ['--import', 'tsx', 'scripts/copy-docs.ts']
  },
  {
    name: 'Build Enabled Plugins',
    command: 'node',
    args: ['--import', 'tsx', 'scripts/build-enabled-plugins.ts']
  },
  {
    name: 'Copy Plugins',
    command: 'node',
    args: ['--import', 'tsx', 'scripts/copy-plugins.ts']
  }
];

async function runStep(step) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 ${step.name}...`);
    
    const child = spawn(step.command, step.args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${step.name} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${step.name} failed with code ${code}`);
        reject(new Error(`${step.name} failed`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ ${step.name} error:`, error);
      reject(error);
    });
  });
}

async function main() {
  try {
    for (const step of steps) {
      await runStep(step);
    }
    console.log('\n🎉 Windows build completed successfully!');
  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

main();