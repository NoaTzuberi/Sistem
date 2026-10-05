// DEV ONLY: `npm run dev:phone` — server + mobile app for testing on a phone on the same Wi-Fi.
// The mobile app calls the API on its own origin ("/api", proxied by Vite to the local
// server) and is served over self-signed HTTPS so Screen Wake Lock works on the phone.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE_PORT = 5173;

// The proxy must hit the port the server really uses (PORT in apps/server/.env, default 5002).
function serverPort() {
  try {
    const env = readFileSync(join(root, 'apps/server/.env'), 'utf8');
    const match = env.match(/^\s*PORT\s*=\s*(\d+)/m);
    if (match) return Number(match[1]);
  } catch {
    // No .env — the server falls back to its default too.
  }
  return 5002;
}

// Wi-Fi first (en0 on a Mac), then any other private IPv4 address.
function localIps() {
  const all = Object.entries(networkInterfaces()).flatMap(([name, addrs]) =>
    (addrs ?? [])
      .filter((a) => a.family === 'IPv4' && !a.internal)
      .map((a) => ({ name, address: a.address })),
  );
  all.sort((a, b) => (b.name === 'en0') - (a.name === 'en0'));
  return all.map((a) => a.address);
}

const ips = localIps();
const line = '─'.repeat(60);
console.log(`\n${line}`);
if (ips.length === 0) {
  console.log('  No network address found — is the Mac connected to Wi-Fi?');
} else {
  console.log('  Open on the phone (same Wi-Fi):');
  for (const ip of ips) console.log(`    https://${ip}:${MOBILE_PORT}`);
  console.log('  Self-signed certificate: accept the warning once (see README).');
}
console.log(`${line}\n`);

const env = {
  ...process.env,
  SISTEM_DEV_HTTPS: '1',
  SISTEM_API_PROXY_TARGET: `http://localhost:${serverPort()}`,
  // Overrides apps/mobile/.env for this run only (Vite keeps existing env vars).
  VITE_API_URL: '/api',
};

const isWindows = process.platform === 'win32';
const child = spawn(
  join(root, 'node_modules/.bin', isWindows ? 'concurrently.cmd' : 'concurrently'),
  [
    '-k',
    '-n', 'server,mobile',
    '-c', 'magenta,cyan',
    'npm:dev:server',
    // strictPort: the printed URL must be the real one.
    `npm run dev -w @sistem/mobile -- --strictPort --port ${MOBILE_PORT}`,
  ],
  { cwd: root, env, stdio: 'inherit', shell: isWindows },
);

child.on('exit', (code) => process.exit(code ?? 0));
