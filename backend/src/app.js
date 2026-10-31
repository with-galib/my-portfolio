import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};
const clean = (v, max) =>
  String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

export function createApp({
  dataDir = path.join(here, '..', 'data'),
  publicDir = path.join(here, '..', '..', 'frontend'),
  adminToken = process.env.ADMIN_TOKEN,
  origins = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
} = {}) {
  const app = express();
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ['https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null, // keep plain http://localhost working
      },
    },
  }));
  app.use('/api', cors({
    origin: (o, cb) => cb(null, !o || origins.includes(o)),
    methods: ['GET', 'POST'],
  }));
  app.use(express.json({ limit: '10kb' }));

  const loadProjects = async () => JSON.parse(await readFile(path.join(dataDir, 'projects.json'), 'utf8'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: Math.round(process.uptime()) }));

  app.get('/api/projects', wrap(async (req, res) => {
    let projects = await loadProjects();
    const { filter } = req.query;
    if (filter) projects = projects.filter((p) => p.filters.includes(String(filter)));
    res.set('Cache-Control', 'public, max-age=60').json({ projects });
  }));

  app.get('/api/projects/:slug', wrap(async (req, res) => {
    const project = (await loadProjects()).find((p) => p.slug === req.params.slug);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  }));

  const contactLimit = rateLimit({
    windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false,
    message: { error: 'Too many messages. Please try again later.' },
  });

  app.post('/api/contact', contactLimit, wrap(async (req, res) => {
    const b = req.body || {};
    if (clean(b.website, 200)) return res.status(201).json({ ok: true }); // honeypot: pretend success
    const name = clean(b.name, 100), email = clean(b.email, 200), message = clean(b.message, 2000);
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (message.length < 10) return res.status(400).json({ error: 'Message must be at least 10 characters' });
    await mkdir(dataDir, { recursive: true });
    await appendFile(path.join(dataDir, 'messages.jsonl'),
      JSON.stringify({ name, email, message, at: new Date().toISOString() }) + '\n');
    res.status(201).json({ ok: true });
  }));

  app.get('/api/messages', wrap(async (req, res) => {
    const token = (req.get('authorization') || '').replace(/^Bearer /, '');
    if (!adminToken || !safeEqual(token, adminToken)) return res.status(401).json({ error: 'Unauthorized' });
    let raw = '';
    try { raw = await readFile(path.join(dataDir, 'messages.jsonl'), 'utf8'); } catch {}
    const messages = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l)).reverse();
    res.set('Cache-Control', 'no-store').json({ messages });
  }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(express.static(publicDir, { extensions: ['html'] })); // /work serves work.html

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });
  return app;
}
