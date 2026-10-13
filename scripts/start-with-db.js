/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('child_process');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

const FALLBACK_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

function loadDotenv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
}

function banner(lines) {
  const width = Math.max(...lines.map(l => l.length)) + 4;
  const bar = '─'.repeat(width);
  console.log(bar);
  lines.forEach(l => console.log(l));
  console.log(bar);
}

function isDnsError(err) {
  const code = err && err.code;
  return code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'querySrv' || code === 'ESERVFAIL';
}

async function connectMongo(uri) {
  const mongoose = require('mongoose');
  mongoose.set('bufferCommands', false);
  try {
    await mongoose.connect(uri);
    return { ok: true };
  } catch (err) {
    if (!isDnsError(err)) return { ok: false, error: err };

    // Local DNS resolver refused the SRV lookup (common with VPNs / local
    // DNS proxies on Windows) — retry once against public resolvers.
    dns.setServers(FALLBACK_DNS_SERVERS);
    try {
      await mongoose.connect(uri);
      return { ok: true };
    } catch (retryErr) {
      return { ok: false, error: retryErr };
    }
  }
}

async function connectAndStart() {
  loadDotenv();
  const mongooseUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL;

  if (!mongooseUri) {
    banner(['⚠  MongoDB: NOT CONFIGURED', '   No MONGODB_URI in .env — running in MOCK DATA mode']);
  } else {
    const host = mongooseUri.replace(/\/\/.*@/, '//***:***@');
    console.log(`Connecting to MongoDB (${host}) ...`);
    const result = await connectMongo(mongooseUri);
    if (result.ok) {
      banner(['✅ MongoDB: CONNECTED']);
    } else {
      banner([
        '❌ MongoDB: CONNECTION FAILED',
        `   ${result.error.message}`,
        '   Running in MOCK DATA mode',
      ]);
    }
  }

  const proc = spawn('npx', ['next', 'dev'], { stdio: 'inherit', shell: true });
  proc.on('exit', code => process.exit(code));
  proc.on('error', err => {
    console.error('Failed to start next dev:', err);
    process.exit(1);
  });
}

connectAndStart();
