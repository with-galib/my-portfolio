import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';

async function start(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pf-'));
  await cp(new URL('../data/projects.json', import.meta.url), path.join(dir, 'projects.json'));
  const server = await new Promise((r) => { const s = createApp({ dataDir: dir, adminToken: 'secret' }).listen(0, () => r(s)); });
  t.after(() => server.close());
  return { dir, base: `http://127.0.0.1:${server.address().port}` };
}
const post = (base, body) => fetch(base + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const good = { name: 'Ada', email: 'ada@example.com', message: 'Hello, I love your work.' };

test('health and projects', async (t) => {
  const { base } = await start(t);
  assert.equal((await (await fetch(base + '/api/health')).json()).status, 'ok');
  const all = await (await fetch(base + '/api/projects')).json();
  assert.ok(all.projects.length >= 1);
  const sys = await (await fetch(base + '/api/projects?filter=systems')).json();
  assert.ok(sys.projects.every((p) => p.filters.includes('systems')));
  assert.equal((await fetch(base + '/api/projects/nope')).status, 404);
});

test('contact validates, stores and hides honeypot spam', async (t) => {
  const { base, dir } = await start(t);
  assert.equal((await post(base, { ...good, email: 'bad' })).status, 400);
  assert.equal((await post(base, { ...good, message: 'short' })).status, 400);
  assert.equal((await post(base, { ...good, website: 'spam' })).status, 201);
  assert.equal((await post(base, good)).status, 201);
  const lines = (await readFile(path.join(dir, 'messages.jsonl'), 'utf8')).trim().split('\n');
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).name, 'Ada');
});

test('messages need the admin token', async (t) => {
  const { base } = await start(t);
  await post(base, good);
  assert.equal((await fetch(base + '/api/messages')).status, 401);
  const r = await fetch(base + '/api/messages', { headers: { Authorization: 'Bearer secret' } });
  assert.equal((await r.json()).messages.length, 1);
});

test('serves separate pages with clean URLs', async (t) => {
  const { base } = await start(t);
  for (const p of ['/', '/work', '/skills', '/about', '/contact']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 200, p);
    assert.match(r.headers.get('content-type'), /html/);
  }
});
