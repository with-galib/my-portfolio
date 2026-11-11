# My Portfolio

An interactive, responsive portfolio with a small Node.js backend.

- **Frontend** (`frontend/`): a static multi-page site with no build step. Pages: `index.html` (home with the live node network), `work.html`, `skills.html`, `about.html` and `contact.html`. Shared styles live in `css/`, scripts in `js/`. Projects show instantly from built-in data, then update from the API when the backend is reachable.
- **Backend** (`backend/`): Express API with validation, rate limiting, security headers and file-based storage. It also serves the frontend (with clean URLs like `/work`), so one process runs everything.

## Run locally

```bash
cd backend
npm install
cp .env.example .env   # optional; export the variables or use `node --env-file=.env`
npm start              # http://localhost:3000
npm test
```

Node 18 or newer is required.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/projects?filter=systems` | List projects, optionally filtered by `mobile`, `systems` or `network` |
| GET | `/api/projects/:slug` | One project |
| POST | `/api/contact` | Body `{name, email, message}`. Limited to 5 per hour per IP; the hidden `website` field is a spam trap |
| GET | `/api/messages` | Stored messages, newest first. Needs `Authorization: Bearer $ADMIN_TOKEN` |

Edit `backend/data/projects.json` to change your projects. Messages are appended to `backend/data/messages.jsonl` (git-ignored).

## Put it on GitHub

```bash
git init && git add . && git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/with-galib/portfolio.git
git push -u origin main
```
//
## Deploy

**Option A: everything on one server (simplest).** Build the Docker image from the repo root (`docker build -f backend/Dockerfile -t portfolio .`) and run it on Render, Railway, Fly.io or any VPS. Set `ADMIN_TOKEN` and `TRUST_PROXY=1`. Mount a persistent disk at `backend/data` so messages survive restarts.

**Option B: frontend on GitHub Pages, backend elsewhere.**
1. In the repo settings, set Pages source to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` publishes `frontend/` on every push.
2. Deploy the backend as in option A.
3. Put the backend URL in `frontend/config.js` (`API_BASE`) and set `ALLOWED_ORIGINS` on the backend to your Pages origin, for example `https://with-galib.github.io`.

Without a backend the page still works; only the contact form needs it.

## Notes

- Storage is a JSON lines file, which is fine for a portfolio. If you expect real volume, swap the two file reads and writes in `backend/src/app.js` for a database.
- The Content-Security-Policy is strict: no inline scripts or styles, so add new code as files under `frontend/js` and `frontend/css`.
- To add a page, copy an existing one, add a link in each page's nav and give it a `aria-current="page"` on its own link.
