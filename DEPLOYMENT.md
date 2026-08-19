# Deploying NSEMAS

This app has a **stateful backend** — a real Express API backed by a file-based
JSON data store (which can also run AES-256-GCM encrypted, see the README).
That matters for where it can live:

- **Railway** is a great fit: it runs a real long-lived Node process with a
  persistent disk (via a Volume), which this app needs.
- **Vercel** is built around stateless serverless functions with an
  ephemeral, read-only filesystem at request time — it **cannot** run this
  backend as-is (every write to `backend/data/*.json` would vanish, and
  most requests would 500). Vercel is still genuinely useful here for
  hosting the **frontend** as a static site, pointed at the Railway backend.

Two deployment shapes are supported. Pick one:

| | Option A — Simplest | Option B — Split |
|---|---|---|
| Backend | Railway | Railway |
| Frontend | *same Railway service* (Express already serves it) | Vercel (separate) |
| Setup effort | One Railway service, done | Railway + Vercel + one config edit |
| When to use it | You just want it live | You want a CDN-fronted frontend, or separate scaling/branding |

Both options put the same backend on Railway; Option B additionally puts a
copy of the frontend on Vercel.

---

## 0. Push to GitHub

```bash
cd nsemas
git init
git add .
git commit -m "NSEMAS initial commit"
gh repo create nsemas --source=. --public --push
# or: create a repo on github.com, then
#   git remote add origin https://github.com/<you>/nsemas.git
#   git branch -M main
#   git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `backend/data/` (seeded/live
data — you don't want to commit a database dump), and `.env` files.

---

## Option A — Railway only (recommended starting point)

### 1. Create the Railway service

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select your `nsemas` repo.
2. Open the new service's **Settings** tab → **Root Directory** → set to `backend`.
   (Railway needs this because `package.json` lives in `backend/`, not the repo root.)
3. Railway auto-detects Node via Nixpacks and will run `npm install` then
   `npm start` (from `backend/railway.json` / `package.json`) automatically.

### 2. Add a persistent Volume (important)

Without this, every redeploy wipes the database back to a fresh reseed —
fine for a demo, but you'll lose any real data entered in between deploys.

1. Service → **Settings** → **Volumes** → **Add Volume**.
2. Mount path: `/app/backend/data`
3. Redeploy once after adding it so the app starts writing into the volume.

This same path is also where `.encryption-key` lives if you turn on
encryption-at-rest, and where `npm run backup` writes to — so one volume
covers all of it.

### 3. Set environment variables

Service → **Variables** tab. At minimum:

```
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
NODE_ENV=production
```

Everything else in `.env.example` is optional (email/SMS delivery,
encryption-at-rest). Leave `CORS_ORIGIN` unset for this option — the
frontend and API share an origin, so CORS doesn't come into play.

### 4. Set the health check (optional but recommended)

Already configured via `backend/railway.json` → `/api/health`. Railway will
use it to know the deploy is actually up before routing traffic to it.

### 5. Get your URL and verify

Railway assigns a domain like `nsemas-production.up.railway.app` (or attach
a custom domain under **Settings → Networking**). Open it — you should land
on the NSEMAS login screen with the full Quick Demo Access grid.

**You're done.** This one service serves both the API and the frontend.

---

## Option B — Railway backend + Vercel frontend

Do steps 1–5 from Option A first (the backend needs to exist and have a URL
before the frontend can point at it), then:

### 6. Point the frontend at the Railway backend

Edit `frontend/config.js`:

```js
window.NSEMAS_CONFIG = {
  API_BASE: 'https://nsemas-production.up.railway.app', // your Railway URL, no trailing slash
};
```

Commit and push this change.

### 7. Lock down CORS on the backend

Now that the frontend lives on a different origin, set this Railway
environment variable so the browser is actually allowed to call the API:

```
CORS_ORIGIN=https://<your-vercel-project>.vercel.app
```

(You'll know the exact Vercel URL after step 8 — come back and set this
after your first Vercel deploy, then redeploy the Railway service.)

### 8. Deploy the frontend to Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the same GitHub repo.
2. **Root Directory** → set to `frontend`.
3. Framework Preset → **Other** (it's a no-build static site — `frontend/vercel.json` already sets `buildCommand: null`).
4. Deploy.

Vercel gives you a URL like `nsemas.vercel.app`. Go back to step 7 and set
`CORS_ORIGIN` on Railway to that exact URL, then redeploy the Railway
service so the new CORS setting takes effect.

### 9. Verify the split deployment

Open the Vercel URL, log in with a demo account, and check the browser's
Network tab — requests should go to your Railway URL and succeed (no CORS
errors in the console).

---

## Post-deploy checklist

Run through this once, on whichever URL is live:

- [ ] Login page loads with the Quick Demo Access grid
- [ ] `demo_headmaster` / `demo123` logs in successfully
- [ ] Dashboard loads with data (schools/students/attendance numbers, not all zeros/errors)
- [ ] Students → click into a student → passport loads
- [ ] Attendance → daily register loads
- [ ] `GET https://<your-url>/api/health` returns `{"status":"ok",...}`

If anything 500s, check your platform's deploy logs first — the most common
cause is `JWT_SECRET` missing in a `NODE_ENV=production` deploy (the app
still works, but logs a warning) or a Vercel deployment accidentally
pointed at `backend/` instead of `frontend/` (it'll try to run a Node
server as a static site and fail to build).

## Troubleshooting

**"Network error — is the NSEMAS backend running?" on the login page**
The frontend's `API_BASE` (in `frontend/config.js`) doesn't match your
actual backend URL, or the backend isn't up. Check `config.js` and hit
`/api/health` on your backend URL directly.

**CORS errors in the browser console (Option B only)**
`CORS_ORIGIN` on Railway doesn't exactly match your Vercel URL (must
include `https://`, no trailing slash). Multiple origins are comma-separated.

**Data resets after every deploy**
You don't have a Volume attached (Option A, step 2) — without one, Railway
gives the container a fresh filesystem on every deploy and the app just
reseeds demo data, same as running it locally for the first time.

**Vercel build fails**
Root Directory is probably still pointed at the repo root or `backend/`
instead of `frontend/` — Vercel will try to treat this like a Node app to
build, which it isn't (no build step, no `main` server file it should run).

---

## Replacing your GitHub repo's entire history

If you want to wipe the old commit history and push this build as a clean
single commit — for example after pulling in a large batch of changes and
wanting a fresh starting point — do this from inside your existing local
clone:

```bash
cd nsemas   # your existing local repo, already up to date with origin/main

# Create a brand-new branch with NO parent commits (an "orphan" branch)
git checkout --orphan fresh-start

# Stage everything currently in the working directory
git add -A
git commit -m "NSEMAS — clean history"

# Replace main with this single-commit branch
git branch -D main
git branch -m main

# Force-push, overwriting all history on GitHub
git push origin main --force
```

**This is irreversible** — every prior commit, and anyone else's ability to
`git pull` without a forced reset on their end, goes away. Double-check
`git status` shows exactly the files you expect staged before the `commit`
step. If anyone else has a clone of this repo, they'll need to re-clone it
after this rather than pulling.

Railway and Vercel will both pick up the force-pushed `main` and redeploy
automatically, the same as any other push.
