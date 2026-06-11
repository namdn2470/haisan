#!/usr/bin/env node
// Kill SeaFool dev ports before starting dev server.
// Usage:
//   node scripts/kill-dev-ports.mjs          → kills 3012 and 3001
//   node scripts/kill-dev-ports.mjs 3012      → kills only 3012
//   node scripts/kill-dev-ports.mjs 3001 3012 → kills both

import { execSync } from 'node:child_process';

const inputPorts = process.argv.slice(2).map(Number).filter((n) => n > 0);
const ports = inputPorts.length > 0 ? inputPorts : [3012, 3001];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPids(port) {
  try {
    const output = execSync(`lsof -ti :${port}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (!output) return [];
    return [...new Set(output.split('\n').map((x) => x.trim()).filter(Boolean))];
  } catch {
    // lsof exits non-zero when no process found — that's fine
    return [];
  }
}

for (const port of ports) {
  const pids = getPids(port);

  if (pids.length === 0) {
    console.log(`  ✓ Port ${port} is free`);
    continue;
  }

  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`  ✓ Killed PID ${pid} on port ${port}`);
    } catch {
      console.log(`  ! Failed to kill PID ${pid} on port ${port}`);
    }
  }
}

// Wait for OS to fully release the sockets before the caller starts new servers
await sleep(500);

console.log('  ✓ Dev ports cleanup done\n');
